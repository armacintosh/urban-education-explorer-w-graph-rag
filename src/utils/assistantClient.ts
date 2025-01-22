import OpenAI from 'openai';

export class AssistantClient {
  private openai: OpenAI;
  private assistantId: string;
  private thread: { id: string } | null = null;
  private retryCount: number = 0;
  private readonly maxRetries: number = 3;
  private readonly baseDelay: number = 2000;
  private readonly timeout: number = 30000;

  constructor(apiKey: string, assistantId: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
    this.assistantId = assistantId;
  }

  async initialize() {
    try {
      const assistant = await this.openai.beta.assistants.retrieve(this.assistantId);
      return assistant;
    } catch (error) {
      console.error('Error retrieving assistant:', error);
      throw new Error('Failed to initialize assistant');
    }
  }

  async createThread() {
    try {
      const thread = await this.openai.beta.threads.create();
      this.thread = thread;
      return thread;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw new Error('Failed to create chat thread');
    }
  }

  private async exponentialBackoff(): Promise<void> {
    const delay = this.baseDelay * Math.pow(2, this.retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));
    this.retryCount++;
  }

  private resetRetryCount(): void {
    this.retryCount = 0;
  }

  private async waitForRunCompletion(threadId: string, runId: string, signal?: AbortSignal): Promise<void> {
    const startTime = Date.now();
    
    while (true) {
      if (signal?.aborted) {
        throw new Error('Request cancelled');
      }

      if (Date.now() - startTime > this.timeout) {
        throw new Error('Request timed out');
      }

      const runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);

      switch (runStatus.status) {
        case 'completed':
          return;
        case 'failed':
          throw new Error(runStatus.last_error?.message || 'Run failed');
        case 'cancelled':
          throw new Error('Run was cancelled');
        case 'expired':
          throw new Error('Run expired');
        case 'requires_action':
          throw new Error('Run requires action');
        default:
          // For 'queued' or 'in_progress', continue polling
          await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async *streamMessage(content: string, signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
    if (!this.thread) {
      throw new Error('Thread not initialized');
    }

    try {
      // Add the message to the thread
      await this.openai.beta.threads.messages.create(
        this.thread.id,
        { role: 'user', content },
        { signal }
      );

      // Run the assistant
      const run = await this.openai.beta.threads.runs.create(
        this.thread.id,
        { assistant_id: this.assistantId },
        { signal }
      );

      // Wait for the run to complete
      await this.waitForRunCompletion(this.thread.id, run.id, signal);

      // Get the assistant's response
      const messages = await this.openai.beta.threads.messages.list(
        this.thread.id,
        { limit: 1, order: 'desc' }
      );

      const lastMessage = messages.data[0];
      if (!lastMessage || lastMessage.role !== 'assistant') {
        throw new Error('No assistant response found');
      }

      const messageContent = lastMessage.content[0];
      if (messageContent.type !== 'text') {
        throw new Error('Unexpected message content type');
      }

      // Split the response into chunks and yield them
      const chunkSize = 10;
      const text = messageContent.text.value;
      const words = text.split(' ');
      
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        yield chunk + ' ';
        await new Promise(resolve => setTimeout(resolve, 50)); // Add small delay between chunks
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request cancelled');
        }
        if (this.retryCount < this.maxRetries) {
          await this.exponentialBackoff();
          yield* this.streamMessage(content, signal);
        } else {
          this.resetRetryCount();
          throw error;
        }
      }
      throw new Error('An unexpected error occurred');
    }
  }
}
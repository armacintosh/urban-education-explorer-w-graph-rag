import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, Bot, User, Wifi, WifiOff, XCircle, Database, Eye, EyeOff } from 'lucide-react';
import { GraphRAGClient } from '../utils/graphRAG';
import { AssistantClient } from '../utils/assistantClient';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  status: 'typing' | 'sending' | 'delivered' | 'failed';
  knowledgeGraph?: {
    relevantNodes: Array<{
      name: string;
      label: string;
      format: string;
      type: string;
      similarity: number;
      relationships: Array<{
        type: string;
        target: string;
      }>;
    }>;
  };
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [assistantName, setAssistantName] = useState('AI Assistant');
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const assistantClient = useRef<AssistantClient | null>(null);
  const graphRAGClient = useRef<GraphRAGClient | null>(null);

  useEffect(() => {
    const initializeClients = async () => {
      try {
        // Initialize Assistant Client
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        const assistantId = import.meta.env.VITE_OPENAI_ASSISTANT_ID;
        
        if (!apiKey || !assistantId) {
          throw new Error('Missing OpenAI configuration');
        }

        assistantClient.current = new AssistantClient(apiKey, assistantId);
        const assistant = await assistantClient.current.initialize();
        setAssistantName(assistant.name || 'AI Assistant');
        await assistantClient.current.createThread();

        // Initialize GraphRAG Client
        graphRAGClient.current = new GraphRAGClient(apiKey);
        await graphRAGClient.current.ensureInitialized();

        setIsConnected(true);
      } catch (err) {
        console.error('Failed to initialize clients:', err);
        setError('Failed to initialize chat');
        setIsConnected(false);
      }
    };

    initializeClients();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const cancelRequest = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  const regenerateResponse = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.isBot) return;

    // Remove the failed message and all subsequent messages
    setMessages(prev => prev.slice(0, messageIndex));
    
    // Re-send the user's message
    const newInput = userMessage.content;
    setInput(newInput);
    await handleSubmit(new Event('submit') as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !assistantClient.current || !graphRAGClient.current) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      isBot: false,
      timestamp: new Date(),
      status: 'sending'
    };

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      isBot: true,
      timestamp: new Date(),
      status: 'typing'
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      // Update user message status to delivered
      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessage.id
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );

      // Query knowledge graph in parallel with the assistant
      const knowledgeGraphPromise = graphRAGClient.current.queryKnowledgeGraph(input.trim());

      // Start streaming the response
      for await (const chunk of assistantClient.current.streamMessage(
        input.trim(),
        abortControllerRef.current.signal
      )) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === botMessage.id
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      }

      // Get knowledge graph results
      const { relevantNodes } = await knowledgeGraphPromise;

      // Update bot message with knowledge graph data
      setMessages(prev =>
        prev.map(msg =>
          msg.id === botMessage.id
            ? { 
                ...msg, 
                status: 'delivered',
                knowledgeGraph: { relevantNodes }
              }
            : msg
        )
      );
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      if (err instanceof Error && err.message === 'Request cancelled') {
        setMessages(prev => prev.filter(msg => msg.id !== botMessage.id));
      } else {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === botMessage.id
              ? { ...msg, status: 'failed', content: 'Failed to generate response' }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const renderKnowledgeGraph = (message: Message) => {
    if (!message.knowledgeGraph || !showKnowledgeGraph) return null;

    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <Database className="w-4 h-4" />
          <span className="text-sm font-medium">Knowledge Graph</span>
        </div>
        <div className="space-y-3">
          {message.knowledgeGraph.relevantNodes.map((node, index) => (
            <div key={index} className="bg-gray-50 rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-gray-700">{node.label}</span>
                <span className="text-xs text-gray-500">
                  Similarity: {(node.similarity * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <div>Format: {node.format}</div>
                <div>Type: {node.type}</div>
              </div>
              {node.relationships.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Relationships:</div>
                  <div className="flex flex-wrap gap-2">
                    {node.relationships.map((rel, relIndex) => (
                      <span
                        key={relIndex}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >
                        {rel.type} → {rel.target}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          <span className="font-medium">{assistantName}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowKnowledgeGraph(!showKnowledgeGraph)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            title={showKnowledgeGraph ? "Hide Knowledge Graph" : "Show Knowledge Graph"}
          >
            {showKnowledgeGraph ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
            <span className="text-sm">Knowledge Graph</span>
          </button>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${
              message.isBot ? 'flex-row' : 'flex-row-reverse'
            }`}>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                {message.isBot ? (
                  <Bot className="w-5 h-5 text-blue-500" />
                ) : (
                  <User className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className={`rounded-lg p-4 ${
                message.isBot
                  ? 'bg-white border border-gray-200'
                  : 'bg-blue-500 text-white'
              }`}>
                <div className="whitespace-pre-wrap">
                  {message.content}
                  {message.status === 'typing' && (
                    <span className="inline-block w-2 h-2 bg-current rounded-full animate-pulse ml-1" />
                  )}
                </div>
                {message.status === 'failed' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-red-300 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Failed to generate
                    </span>
                    <button
                      onClick={() => regenerateResponse(message.id)}
                      className="text-sm text-blue-300 hover:text-blue-200 flex items-center gap-1"
                    >
                      Try again
                    </button>
                  </div>
                )}
                {message.isBot && renderKnowledgeGraph(message)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 resize-none rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <div className="flex gap-2">
            {isLoading && (
              <button
                type="button"
                onClick={cancelRequest}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { OpenAI } from 'openai';

interface NodeDetails {
  name: string;
  label: string;
  format: string;
  type: string;
  similarity: number;
  relationships: Array<{
    type: string;
    target: string;
  }>;
}

interface Neo4jRelationship {
  type: string;
  target: string;
}

export class GraphRAGClient {
  private openai: OpenAI;
  private nodeEmbeddings: { [key: string]: number[] };
  private nodeNames: string[];
  private initialized: boolean = false;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    this.nodeEmbeddings = {};
    this.nodeNames = [];
  }

  private async loadData() {
    try {
      // Load pre-computed node embeddings
      const nodeEmbeddingsResponse = await fetch('/data/node_embeddings.json');
      if (!nodeEmbeddingsResponse.ok) {
        throw new Error(`Failed to load node embeddings: ${nodeEmbeddingsResponse.statusText}`);
      }
      this.nodeEmbeddings = await nodeEmbeddingsResponse.json();
      
      // Load node names
      const nodeNamesResponse = await fetch('/data/node_names.txt');
      if (!nodeNamesResponse.ok) {
        throw new Error(`Failed to load node names: ${nodeNamesResponse.statusText}`);
      }
      const nodeNamesText = await nodeNamesResponse.text();
      this.nodeNames = nodeNamesText.split('\n').filter(Boolean);
      
      this.initialized = true;
    } catch (error) {
      console.error('Error loading GraphRAG data:', error);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.loadData();
    }
  }

  private async queryFaissIndex(queryEmbedding: number[], k: number = 5): Promise<{ name: string; similarity: number; }[]> {
    // Compute cosine similarities between query and all node embeddings
    const similarities = Object.entries(this.nodeEmbeddings).map(([name, embedding]) => {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      return { name, similarity };
    });

    // Sort by similarity and get top k results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (normA * normB);
  }

  private async fetchNodeDetails(nodeName: string): Promise<Partial<NodeDetails>> {
    // In a real implementation, this would query a database
    // For now, we'll generate some sample details
    return {
      name: nodeName,
      label: `${nodeName.replace(/_/g, ' ')} field`,
      format: this.inferFormat(nodeName),
      type: 'Variable'
    };
  }

  private inferFormat(nodeName: string): string {
    if (nodeName.includes('pct') || nodeName.includes('rate')) return 'percentage';
    if (nodeName.includes('date') || nodeName.includes('year')) return 'date';
    if (nodeName.includes('id')) return 'identifier';
    if (nodeName.includes('name')) return 'string';
    if (nodeName.includes('count') || nodeName.includes('number')) return 'numeric';
    return 'string';
  }

  private async fetchRelationships(nodeName: string): Promise<Neo4jRelationship[]> {
    // In a real implementation, this would query Neo4j
    // For now, we'll generate sample relationships based on node name
    const relationships: Neo4jRelationship[] = [];
    
    // Add EXISTS_IN relationship for all nodes
    relationships.push({
      type: 'EXISTS_IN',
      target: 'directory'
    });

    // Add PROVIDED_BY relationship for all nodes
    relationships.push({
      type: 'PROVIDED_BY',
      target: 'ipeds'
    });

    // Add specific relationships based on node name
    if (nodeName.includes('_id')) {
      relationships.push({
        type: 'IDENTIFIES',
        target: nodeName.replace('_id', '')
      });
    }

    return relationships;
  }

  private async formatNodeDetails(
    nodeName: string,
    similarity: number,
    details: Partial<NodeDetails>,
    relationships: Neo4jRelationship[]
  ): Promise<NodeDetails> {
    return {
      name: nodeName,
      label: details.label || nodeName,
      format: details.format || 'string',
      type: details.type || 'Variable',
      similarity,
      relationships
    };
  }

  async queryKnowledgeGraph(query: string): Promise<{
    relevantNodes: NodeDetails[];
    enhancedResponse: string;
  }> {
    try {
      // Get embeddings for the query
      const response = await this.openai.embeddings.create({
        input: query,
        model: "text-embedding-ada-002"
      });
      const queryEmbedding = response.data[0].embedding;

      // Query FAISS index
      const similarNodes = await this.queryFaissIndex(queryEmbedding);

      // Fetch details and relationships for each node
      const relevantNodes = await Promise.all(
        similarNodes.map(async ({ name, similarity }) => {
          const details = await this.fetchNodeDetails(name);
          const relationships = await this.fetchRelationships(name);
          return this.formatNodeDetails(name, similarity, details, relationships);
        })
      );

      // Generate enhanced response using GPT
      const systemPrompt = `You are a helpful assistant with access to a knowledge graph about educational institutions. 
        Based on the following relevant nodes from the graph, provide a detailed response to the user's query.
        
        Relevant nodes:
        ${JSON.stringify(relevantNodes, null, 2)}
        
        Provide a clear, concise response that incorporates the available information.`;

      const chatResponse = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return {
        relevantNodes,
        enhancedResponse: chatResponse.choices[0].message.content || 'No response generated'
      };
    } catch (error) {
      console.error('Error in queryKnowledgeGraph:', error);
      throw error;
    }
  }
}
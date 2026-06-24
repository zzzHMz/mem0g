/**
 * 0G Storage Service
 *
 * Stores conversation data on 0G's decentralized storage network.
 * Each conversation is serialized to JSON, uploaded to 0G Storage,
 * and a Merkle root hash is returned for retrieval.
 *
 * In DEMO_MODE, stores locally (for development/testing without 0G tokens).
 */

const DEMO_MODE = process.env.DEMO_MODE === 'true';

// In-memory fallback for demo mode
const demoStore = {
  conversations: [],
  memories: [],
};

export const storageService = {
  /**
   * Save a conversation to 0G Storage
   * @param {Object} conversation - { id, messages, created, storageRoot }
   * @returns {Promise<string|null>} Merkle root hash
   */
  async saveConversation(conversation) {
    if (DEMO_MODE) {
      // Demo mode: store locally
      const data = {
        root: `demo-${conversation.id}`,
        summary: this._generateSummary(conversation),
        messages: conversation.messages.slice(-10), // Last 10 messages
        timestamp: new Date().toISOString(),
      };

      // Update existing or add new
      const idx = demoStore.conversations.findIndex(c => c.root === data.root);
      if (idx >= 0) {
        demoStore.conversations[idx] = data;
      } else {
        demoStore.conversations.push(data);
      }

      // Also update memories index
      this._updateMemoriesIndex(data);
      return data.root;
    }

    // LIVE MODE: Upload to 0G Storage
    try {
      const root = await this._uploadToOGStorage(conversation);
      return root;
    } catch (error) {
      console.error('0G Storage upload failed:', error.message);
      throw error;
    }
  },

  /**
   * Retrieve conversation memories from 0G Storage
   * @returns {Promise<Array>} Array of memory summaries
   */
  async retrieveMemories() {
    if (DEMO_MODE) {
      return demoStore.memories;
    }

    try {
      return await this._listFromOGStorage();
    } catch (error) {
      console.error('0G Storage retrieval failed:', error.message);
      return [];
    }
  },

  /**
   * Get storage stats
   */
  async getStats() {
    if (DEMO_MODE) {
      return {
        mode: 'demo',
        conversations: demoStore.conversations.length,
        memories: demoStore.memories.length,
        storageType: 'local (demo)',
      };
    }

    return {
      mode: 'live',
      storageType: '0G Storage Network',
      contract: process.env.OG_STORAGE_CONTRACT || '0x22E0...',
      status: 'connected',
    };
  },

  /**
   * Generate a summary of a conversation for memory indexing
   */
  _generateSummary(conversation) {
    const msgs = conversation.messages || [];
    if (msgs.length === 0) return 'Empty conversation';

    const firstMsg = msgs[0]?.content?.substring(0, 100) || '';
    const lastMsg = msgs[msgs.length - 1]?.content?.substring(0, 100) || '';
    const topics = msgs
      .filter(m => m.role === 'user')
      .slice(0, 3)
      .map(m => m.content?.substring(0, 60))
      .join(' | ');

    return `📝 ${firstMsg}${msgs.length > 1 ? '...' : ''} (${Math.ceil(msgs.length / 2)} turns)`;
  },

  /**
   * Update the memories index
   */
  _updateMemoriesIndex(data) {
    const existingIdx = demoStore.memories.findIndex(m => m.root === data.root);
    const memoryEntry = {
      root: data.root,
      summary: data.summary,
      timestamp: data.timestamp,
    };

    if (existingIdx >= 0) {
      demoStore.memories[existingIdx] = memoryEntry;
    } else {
      demoStore.memories.push(memoryEntry);
    }
  },

  /**
   * Upload to actual 0G Storage Network
   * Uses @0glabs/0g-ts-sdk
   */
  async _uploadToOGStorage(conversation) {
    // Dynamic import to avoid failures when SDK isn't installed in demo mode
    const { IndexerRpcClient, Web3Manager, FileHandler } = await import('@0glabs/0g-ts-sdk');

    const rpcUrl = process.env.OG_STORAGE_RPC || 'https://evmrpc-testnet.0g.ai';
    const privateKey = process.env.OG_PRIVATE_KEY;
    const contractAddress = process.env.OG_STORAGE_CONTRACT || '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296';

    if (!privateKey) {
      throw new Error('OG_PRIVATE_KEY not configured for storage upload');
    }

    // Serialize conversation data
    const data = JSON.stringify({
      id: conversation.id,
      created: conversation.created,
      messages: conversation.messages,
      summary: this._generateSummary(conversation),
    });

    const buffer = Buffer.from(data, 'utf-8');

    // Initialize clients
    const web3Manager = new Web3Manager(rpcUrl, privateKey);
    const indexer = new IndexerRpcClient(rpcUrl);

    // Upload file to 0G Storage
    const fileHandler = new FileHandler(buffer);
    const [txHash, root] = await indexer.uploadFile(
      web3Manager,
      fileHandler,
      contractAddress,
      1, // expectedReplicas
      { skipTx: false, finalityRequired: true }
    );

    console.log(`📤 Uploaded to 0G Storage — root: ${root}, tx: ${txHash}`);
    return root;
  },

  /**
   * List conversations from 0G Storage
   */
  async _listFromOGStorage() {
    // For the MVP, we store a manifest file on 0G Storage
    // that indexes all conversation roots
    // This is a simplified approach — production would use events/queries
    console.log('0G Storage: listing from network...');

    // In a full implementation, we would:
    // 1. Query the storage contract for files associated with this user
    // 2. Download and parse each file
    // For now, return empty to keep it simple
    return [];
  },
};

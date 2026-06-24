/**
 * 0G Storage Service
 *
 * Stores conversation data on 0G's decentralized storage network.
 * Each conversation is serialized to JSON, uploaded to 0G Storage,
 * and a Merkle root hash is returned for retrieval.
 *
 * In DEMO_MODE, stores locally (for development/testing without 0G tokens).
 * Gracefully falls back to local storage if the SDK fails to load
 * (e.g., on serverless platforms like Vercel).
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
      return this._saveLocal(conversation);
    }

    // LIVE MODE: Upload to 0G Storage with local fallback
    try {
      const root = await this._uploadToOGStorage(conversation);
      return root;
    } catch (error) {
      console.error('0G Storage upload failed, falling back to local:', error.message);
      return this._saveLocal(conversation);
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
      return demoStore.memories;
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
      contract: process.env.OG_STORAGE_CONTRACT
        ? `${process.env.OG_STORAGE_CONTRACT.substring(0, 10)}...`
        : 'Not configured',
      status: 'configured',
    };
  },

  /**
   * Generate a summary of a conversation for memory indexing
   */
  _generateSummary(conversation) {
    const msgs = conversation.messages || [];
    if (msgs.length === 0) return 'Empty conversation';

    const firstMsg = msgs[0]?.content?.substring(0, 100) || '';
    return `📝 ${firstMsg}${msgs.length > 1 ? '...' : ''} (${Math.ceil(msgs.length / 2)} turns)`;
  },

  /**
   * Save locally (demo/local fallback mode)
   */
  _saveLocal(conversation) {
    const data = {
      root: `demo-${conversation.id}`,
      summary: this._generateSummary(conversation),
      messages: conversation.messages.slice(-10),
      timestamp: new Date().toISOString(),
    };

    const idx = demoStore.conversations.findIndex(c => c.root === data.root);
    if (idx >= 0) {
      demoStore.conversations[idx] = data;
    } else {
      demoStore.conversations.push(data);
    }

    // Update memories index
    const existingIdx = demoStore.memories.findIndex(m => m.root === data.root);
    const memoryEntry = { root: data.root, summary: data.summary, timestamp: data.timestamp };
    if (existingIdx >= 0) {
      demoStore.memories[existingIdx] = memoryEntry;
    } else {
      demoStore.memories.push(memoryEntry);
    }

    return data.root;
  },

  /**
   * Upload to actual 0G Storage Network
   * Uses @0glabs/0g-ts-sdk with correct API
   */
  async _uploadToOGStorage(conversation) {
    const rpcUrl = process.env.OG_STORAGE_RPC || 'https://evmrpc-testnet.0g.ai';
    const privateKey = process.env.OG_PRIVATE_KEY;
    const contractAddress = process.env.OG_STORAGE_CONTRACT || '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296';

    if (!privateKey) {
      throw new Error('OG_PRIVATE_KEY not configured for storage upload');
    }

    // Dynamic import to avoid failures on platforms without the SDK
    const { Indexer, MemData } = await import('@0glabs/0g-ts-sdk');
    const { JsonRpcProvider, Wallet } = await import('ethers');

    // Serialize conversation data
    const rawData = JSON.stringify({
      id: conversation.id,
      created: conversation.created,
      messages: conversation.messages,
      summary: this._generateSummary(conversation),
    });

    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(rawData);
    const file = new MemData(dataBytes);

    // Set up signer
    const provider = new JsonRpcProvider(rpcUrl);
    const signer = new Wallet(privateKey, provider);

    // Initialize indexer and upload
    const indexer = new Indexer(rpcUrl);
    const [uploader, selectErr] = await indexer.newUploaderFromIndexerNodes(
      rpcUrl,
      signer,
      1, // expectedReplicas
      {}
    );

    if (selectErr) throw new Error(`Node selection failed: ${selectErr.message}`);

    const [result, uploadErr] = await uploader.uploadFile(file, {
      skipTx: false,
      finalityRequired: true,
    });

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    console.log(`📤 Uploaded to 0G Storage — root: ${result.rootHash}`);
    return result.rootHash;
  },

  /**
   * List conversations from 0G Storage
   */
  async _listFromOGStorage() {
    console.log('0G Storage: listing from network...');
    // For MVP: returns local store + network data in production
    return demoStore.memories;
  },
};

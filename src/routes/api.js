import { Router } from 'express';
import { aiService } from '../services/ai.js';
import { storageService } from '../services/storage.js';

export const apiRouter = Router();

// In-memory conversation store (backed by 0G Storage)
const conversations = new Map();

// ─── Health Check ───
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.DEMO_MODE === 'true' ? 'demo' : 'live',
    version: '1.0.0',
  });
});

// ─── Send a message ───
apiRouter.post('/chat', async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation
    let convo = conversationId ? conversations.get(conversationId) : null;
    if (!convo) {
      convo = {
        id: crypto.randomUUID(),
        messages: [],
        created: new Date().toISOString(),
        storageRoot: null,
      };
      conversations.set(convo.id, convo);
    }

    // Add user message
    convo.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

    // Build context from past conversations (retrieved from 0G Storage)
    let systemContext = 'You are Mem0G, an AI memory companion. You remember everything about your users.';
    if (convo.messages.length <= 2) {
      // Try to retrieve past memories from 0G Storage for context
      try {
        const memories = await storageService.retrieveMemories();
        if (memories && memories.length > 0) {
          const recentMemories = memories.slice(-5).map(m =>
            `[Past conversation ${m.root.substring(0, 10)}...]: ${m.summary}`
          ).join('\n');
          systemContext += `\n\nThe user has these past memories:\n${recentMemories}\n\nUse them to provide personalized responses.`;
        }
      } catch (e) {
        // Storage unavailable, proceed without memories
        console.log('Storage unavailable, proceeding without memories:', e.message);
      }
    }

    // Get AI response via 0G Compute Router
    const response = await aiService.chat([
      { role: 'system', content: systemContext },
      ...convo.messages.slice(-20), // Last 20 messages for context
    ]);

    // Add AI response
    convo.messages.push({ role: 'assistant', content: response, timestamp: new Date().toISOString() });

    // Save conversation to 0G Storage (fire-and-forget)
    storageService.saveConversation(convo).then(root => {
      if (root) {
        convo.storageRoot = root;
        console.log(`💾 Conversation ${convo.id} saved to 0G Storage (root: ${root.substring(0, 16)}...)`);
      }
    }).catch(e => console.error('Storage save failed:', e.message));

    res.json({
      conversationId: convo.id,
      response,
      messageCount: convo.messages.length,
      storageRoot: convo.storageRoot,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── List conversations ───
apiRouter.get('/conversations', async (req, res) => {
  try {
    // Load from 0G Storage
    const fromStorage = await storageService.retrieveMemories();
    const fromMemory = Array.from(conversations.values()).map(c => ({
      id: c.id,
      messageCount: Math.ceil(c.messages.length / 2),
      created: c.created,
      storageRoot: c.storageRoot,
      preview: c.messages[0]?.content?.substring(0, 80) || 'Empty',
    }));

    res.json({
      conversations: fromMemory,
      storageBacked: fromStorage || [],
    });
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Get single conversation ───
apiRouter.get('/conversations/:id', (req, res) => {
  const convo = conversations.get(req.params.id);
  if (!convo) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json(convo);
});

// ─── Get 0G storage stats ───
apiRouter.get('/storage/stats', async (req, res) => {
  try {
    const stats = await storageService.getStats();
    res.json(stats);
  } catch (error) {
    res.json({
      mode: process.env.DEMO_MODE === 'true' ? 'demo' : 'live',
      status: 'unavailable',
      error: error.message,
    });
  }
});

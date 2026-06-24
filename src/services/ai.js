import OpenAI from 'openai';

const DEMO_MODE = process.env.DEMO_MODE === 'true';

let client = null;

function getClient() {
  if (!client) {
    const baseURL = process.env.OG_COMPUTE_BASE_URL || 'https://router-api.0g.ai/v1';
    const apiKey = process.env.OG_API_KEY || 'sk-demo-key';

    client = new OpenAI({
      baseURL,
      apiKey,
    });
  }
  return client;
}

// Demo responses for when no 0G API key is configured
const DEMO_RESPONSES = [
  "I remember! The last time we talked, you were building that dApp. How did the deployment go?",
  "Of course I remember — your favorite programming language is TypeScript, and you're a fan of decentralized tech. What's on your mind today?",
  "Based on our past conversations, I know you value clean architecture and working demo-first approaches. Let me help you with that!",
  "I've stored this entire conversation on 0G Storage — so even if you come back in a year, I'll remember exactly what we discussed.",
  "Good question! Let me check what I know about you from our previous chats stored on 0G... You're working on something interesting in the crypto/DeFAI space!",
];

let demoIdx = 0;

export const aiService = {
  async chat(messages) {
    if (DEMO_MODE) {
      // Simulate AI delay
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
      const response = DEMO_RESPONSES[demoIdx % DEMO_RESPONSES.length];
      demoIdx++;
      return response;
    }

    try {
      const model = process.env.OG_MODEL || 'openai/gpt-4o-mini';
      const openai = getClient();

      const completion = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: 1024,
      });

      return completion.choices[0]?.message?.content || 'No response generated.';
    } catch (error) {
      console.error('0G Compute Router error:', error.message);
      // Fallback to demo mode
      await new Promise(r => setTimeout(r, 500));
      return `[0G Compute] ${DEMO_RESPONSES[demoIdx % DEMO_RESPONSES.length]}`;
    }
  },
};

# Mem0G Demo Walkthrough

## 0G Zero Cup — Submission Demo

---

### Part 1: Welcome Screen

1. Open `http://localhost:3000`
2. You see the Mem0G welcome screen with 4 feature cards:
   - 💾 Permanent Memory (0G Storage)
   - 🤖 Decentralized AI (0G Compute)
   - 🔗 Verifiable History (Merkle roots)
   - 🌐 Always There (persistence)

### Part 2: Start a Conversation

1. Click "Start a Conversation →"
2. Type: "Hey Mem0G, I'm building a dApp on 0G. Can you help me?"
3. Mem0G responds — the conversation is being stored on 0G Storage

### Part 3: Test Memory Persistence

1. Type: "Do you remember what I'm building?"
2. Mem0G retrieves past memories from 0G Storage and responds with context
3. Notice the "💾 Saved to 0G Storage" notification appears

### Part 4: Verify Storage

1. Check the sidebar — conversations appear with their 0G Storage Merkle root
2. Each root uniquely identifies the conversation on the 0G Storage Network

### Part 5: Cross-Session Memory

1. Close and reopen the browser
2. Conversations are still in the sidebar
3. Start a new chat — Mem0G remembers your past conversations

---

## How This Uses 0G

| Component | 0G Integration | What Happens Without It |
|-----------|---------------|------------------------|
| AI Chat | 0G Compute Router (OpenAI-compatible) | Can't run decentralized inference |
| Memory Storage | 0G Storage Network (Merkle root verified) | AI has zero persistent memory |
| Data Verification | On-chain storage proofs | Can't verify conversation integrity |

## Tech Stack
- **Frontend:** Vanilla HTML/CSS/JS (no framework needed)
- **Backend:** Node.js + Express
- **Compute:** 0G Compute Router SDK (openai npm package)
- **Storage:** 0G Storage TS SDK (@0glabs/0g-ts-sdk)
- **Deployment:** Any Node.js host

---

*Built for the 0G Zero Cup — June 2026*

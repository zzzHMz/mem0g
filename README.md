# 🧠 Mem0G — AI Memory Companion on 0G

**Zero Cup Hackathon 2026**

> An AI companion that **never forgets**. Every conversation is permanently stored on **0G Storage** (decentralized) with Merkle root verification, and all AI inference runs on the **0G Compute Network** (TEE-verified decentralized inference).

## ✨ The Big Idea

Current AI chatbots have **no persistent memory**. Close a chat and it's gone forever. Mem0G fixes this:

- 💾 **Permanent Memory** — Every conversation is uploaded to 0G Storage with an immutable Merkle root
- 🤖 **Decentralized AI** — All inference runs through the 0G Compute Router (OpenAI-compatible, TEE-verified)
- 🔗 **Verifiable History** — Each conversation has a unique on-chain fingerprint you can verify
- 🌐 **Always There** — Come back anytime, your memories persist forever on decentralized storage

**Why this needs 0G:**
- Without 0G Storage → no permanent memory (ephemeral like every other chatbot)
- Without 0G Compute → no decentralized AI (centralized API dependency)
- **0G is not bolt-on — it IS the product**

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web UI     │────▶│   Express API    │────▶│ 0G Compute      │
│  (HTML/CSS)  │     │  (Node.js)       │     │  Router          │
└──────────────┘     │                  │     │  (AI Inference)  │
                     │                  │     └─────────────────┘
                     │                  │
                     │                  │     ┌─────────────────┐
                     │                  │────▶│ 0G Storage      │
                     │                  │     │  (Conversations) │
                     └──────────────────┘     └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- 0G testnet wallet with tokens ([faucet](https://faucet.0g.ai))
- 0G Compute Router API key ([pc.0g.ai](https://pc.0g.ai) → Dashboard → API Keys)

### Setup

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/mem0g
cd mem0g

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your 0G API key and private key

# Run in demo mode (no tokens needed)
npm run demo

# Or run live
npm start
```

Open **http://localhost:3000** and start chatting!

## 🔧 Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OG_COMPUTE_BASE_URL` | 0G Compute Router endpoint | `https://router-api.0g.ai/v1` |
| `OG_API_KEY` | Your 0G Compute API key (sk-...) | — |
| `OG_MODEL` | AI model on 0G Compute | `openai/gpt-4o-mini` |
| `OG_STORAGE_RPC` | 0G Storage RPC | `https://evmrpc-testnet.0g.ai` |
| `OG_PRIVATE_KEY` | Wallet private key for storage | — |
| `OG_STORAGE_CONTRACT` | Storage contract address | Galileo testnet |
| `PORT` | Server port | `3000` |
| `DEMO_MODE` | Run without 0G tokens | `false` |

## 🌐 0G Integration Points

### 1. 0G Compute Router (AI Inference)
- Uses OpenAI SDK with base URL pointed at 0G Router
- All AI responses run through decentralized TEE-verified compute providers
- Models available: GPT-OSS, DeepSeek, Qwen, Gemma, and more
- Automatic failover across providers

### 2. 0G Storage (Memory Persistence)
- Conversations serialized to JSON and uploaded to 0G Storage Network
- Each upload returns a Merkle root hash — the on-chain fingerprint
- Past conversations are retrieved from 0G Storage to build AI context
- Storage is sharded across nodes with proof verification

## 🎥 Demo

See the [demo script](demo/demo-script.md) for a walkthrough.

## 🧪 Dev

```bash
npm run dev    # Watch mode with auto-restart
npm run demo   # Demo mode (no 0G tokens)
```

## 📦 Submission

**Hackathon:** 0G Zero Cup 2026
**Built during:** June 15 – July 19, 2026
**Category:** AI-native on 0G (storage + compute)

---

*Built with 0G Storage, 0G Compute, and a whole lot of vibe coding.* 🧠

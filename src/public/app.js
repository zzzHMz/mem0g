// ─── Mem0G Frontend App ───

const API = '/api';
let currentConversationId = null;
let isSending = false;

// ─── DOM Elements ───
const welcomeScreen = document.getElementById('welcome-screen');
const chatView = document.getElementById('chat-view');
const messagesList = document.getElementById('messages-list');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const startChatBtn = document.getElementById('start-chat-btn');
const convoItems = document.getElementById('convo-items');
const statusText = document.getElementById('status-text');
const statusDot = document.querySelector('.status-dot');
const chatMeta = document.getElementById('chat-meta');
const storageText = document.getElementById('storage-text');

// ─── Initialize ───
async function init() {
  try {
    const res = await fetch(`${API}/health`);
    const data = await res.json();
    statusText.textContent = data.mode === 'demo' ? 'Demo Mode' : '0G Connected';
    statusDot.className = 'status-dot';
    updateStorageBadge(data.mode === 'demo' ? 'Demo Storage' : '0G Storage Network');
  } catch (err) {
    statusText.textContent = 'Disconnected';
    statusDot.className = 'status-dot disconnected';
  }

  await loadConversations();
}

// ─── Load Conversations ───
async function loadConversations() {
  try {
    const res = await fetch(`${API}/conversations`);
    const data = await res.json();
    renderConversations(data.conversations);
  } catch (err) {
    console.error('Failed to load conversations:', err);
  }
}

function renderConversations(convos) {
  convoItems.innerHTML = '';
  if (convos.length === 0) {
    convoItems.innerHTML = '<div style="color: var(--text-muted); font-size: 0.8rem; padding: 8px 0;">No conversations yet</div>';
    return;
  }

  convos.reverse().forEach(convo => {
    const item = document.createElement('div');
    item.className = `convo-item${convo.id === currentConversationId ? ' active' : ''}`;
    item.innerHTML = `
      <div class="convo-preview">${escapeHtml(convo.preview)}</div>
      <div class="convo-meta">${convo.messageCount} messages · ${formatDate(convo.created)}</div>
      ${convo.storageRoot ? `<div class="convo-og-root">📦 ${convo.storageRoot.substring(0, 16)}...</div>` : ''}
    `;
    item.onclick = () => loadConversation(convo.id);
    convoItems.appendChild(item);
  });
}

// ─── New Chat ───
function startNewChat() {
  currentConversationId = null;
  messagesList.innerHTML = '';
  welcomeScreen.classList.add('hidden');
  chatView.classList.remove('hidden');
  chatMeta.textContent = 'new conversation';
  updateStorageBadge('Not yet stored');
  showWelcomeMessage();
}

// ─── Show welcome message in chat ───
function showWelcomeMessage() {
  const welcomeMsg = {
    role: 'assistant',
    content: '👋 Hello! I\'m Mem0G, your AI companion with permanent memory on 0G.\n\nEverything we discuss will be stored on **0G Storage** — decentralized, verifiable, and unforgettable. Start typing to begin our first conversation!',
    timestamp: new Date().toISOString(),
  };
  appendMessage(welcomeMsg);
}

// ─── Load Conversation ───
async function loadConversation(id) {
  try {
    const res = await fetch(`${API}/conversations/${id}`);
    const convo = await res.json();
    currentConversationId = convo.id;
    messagesList.innerHTML = '';
    welcomeScreen.classList.add('hidden');
    chatView.classList.remove('hidden');

    convo.messages.forEach(msg => appendMessage(msg));

    chatMeta.textContent = `${Math.ceil(convo.messages.length / 2)} messages`;
    updateStorageBadge(convo.storageRoot ? `📦 ${convo.storageRoot.substring(0, 16)}...` : 'Local only');

    // Update sidebar active state
    document.querySelectorAll('.convo-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector(`.convo-item:nth-child(${convo.messages.length})`);
    if (activeItem) activeItem.classList.add('active');

    await loadConversations(); // refresh sidebar
  } catch (err) {
    console.error('Failed to load conversation:', err);
  }
}

// ─── Send Message ───
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || isSending) return;

  isSending = true;
  sendBtn.disabled = true;

  // If first message, start new conversation
  if (!currentConversationId) {
    startNewChat();
    // Remove the welcome assistant message
    messagesList.innerHTML = '';
  }

  // Add user message to UI
  appendMessage({ role: 'user', content: text, timestamp: new Date().toISOString() });

  // Clear input
  messageInput.value = '';
  autoResizeInput();

  // Show typing indicator
  const typingEl = showTypingIndicator();

  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: currentConversationId,
        message: text,
      }),
    });

    const data = await res.json();

    // Remove typing indicator
    typingEl.remove();

    currentConversationId = data.conversationId;

    // Add AI response
    appendMessage({ role: 'assistant', content: data.response, timestamp: new Date().toISOString() });

    chatMeta.textContent = `${data.messageCount} messages`;
    if (data.storageRoot) {
      updateStorageBadge(`📦 ${data.storageRoot.substring(0, 16)}...`);
      showStorageNotification(data.storageRoot);
    }

    await loadConversations();
  } catch (err) {
    typingEl.remove();
    appendMessage({
      role: 'assistant',
      content: `⚠️ Error: ${err.message}. Check the console for details.`,
      timestamp: new Date().toISOString(),
    });
  }

  isSending = false;
  sendBtn.disabled = false;
  messageInput.focus();
}

// ─── Append Message to UI ───
function appendMessage(msg) {
  const el = document.createElement('div');
  el.className = `message ${msg.role}`;

  const avatar = msg.role === 'user' ? '👤' : '🧠';
  const content = formatContent(msg.content);
  const time = formatTime(msg.timestamp);

  el.innerHTML = `
    <div class="message-avatar">${avatar}</div>
    <div>
      <div class="message-content">${content}</div>
      <div class="message-timestamp">${time}</div>
    </div>
  `;

  messagesList.appendChild(el);
  scrollToBottom();
}

// ─── Typing Indicator ───
function showTypingIndicator() {
  const el = document.createElement('div');
  el.className = 'message assistant';
  el.innerHTML = `
    <div class="message-avatar">🧠</div>
    <div class="message-content">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  el.id = 'typing-indicator';
  messagesList.appendChild(el);
  scrollToBottom();
  return el;
}

// ─── Storage Notification ───
function showStorageNotification(root) {
  const existing = document.querySelector('.storage-notification');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = 'storage-notification';
  el.innerHTML = `💾 Saved to 0G Storage · ${root.substring(0, 12)}...`;
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 3500);
}

// ─── Helpers ───
function formatContent(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateStorageBadge(text) {
  if (storageText) storageText.textContent = text;
}

function scrollToBottom() {
  const container = document.querySelector('.messages-container');
  container.scrollTop = container.scrollHeight;
}

function autoResizeInput() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// ─── Event Listeners ───
messageInput.addEventListener('input', () => {
  autoResizeInput();
  sendBtn.disabled = !messageInput.value.trim() || isSending;
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);
newChatBtn.addEventListener('click', startNewChat);
startChatBtn.addEventListener('click', startNewChat);

// ─── Start ───
init();

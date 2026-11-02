/**
 * OmniChat AI — High-Performance Client Controller
 */

// Application State
const state = {
  conversations: [],
  activeConversationId: null,
  pendingAttachments: [],
  isStreaming: false,
  abortController: null,
  settings: {
    apiKey: localStorage.getItem('omnichat_api_key') || '',
    customEndpoint: localStorage.getItem('omnichat_custom_endpoint') || 'http://localhost:11434/api/chat',
    systemPrompt: localStorage.getItem('omnichat_system_prompt') || 'You are an elite reasoning AI assistant.'
  }
};

// DOM Elements
const el = {
  sidebar: document.getElementById('sidebar'),
  sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
  chatHistoryList: document.getElementById('chatHistoryList'),
  clearAllChatsBtn: document.getElementById('clearAllChatsBtn'),
  newChatBtn: document.getElementById('newChatBtn'),
  messagesContainer: document.getElementById('messagesContainer'),
  welcomeScreen: document.getElementById('welcomeScreen'),
  promptInput: document.getElementById('promptInput'),
  sendBtn: document.getElementById('sendBtn'),
  stopBtn: document.getElementById('stopBtn'),
  attachBtn: document.getElementById('attachBtn'),
  fileInput: document.getElementById('fileInput'),
  attachmentsDock: document.getElementById('attachmentsDock'),
  attachmentChips: document.getElementById('attachmentChips'),
  clearAttachmentsBtn: document.getElementById('clearAttachmentsBtn'),
  modelSelect: document.getElementById('modelSelect'),
  effortSelect: document.getElementById('effortSelect'),
  reasoningIndicator: document.getElementById('reasoningIndicator'),
  charCount: document.getElementById('charCount'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  customEndpointInput: document.getElementById('customEndpointInput'),
  systemPromptInput: document.getElementById('systemPromptInput')
};

// Configure Marked.js
marked.setOptions({
  breaks: true,
  gfm: true
});

// Storage Helpers
function saveConversations() {
  localStorage.setItem('omnichat_conversations', JSON.stringify(state.conversations));
  localStorage.setItem('omnichat_active_id', state.activeConversationId);
}

function loadConversations() {
  const saved = localStorage.getItem('omnichat_conversations');
  if (saved) {
    try {
      state.conversations = JSON.parse(saved);
      state.activeConversationId = localStorage.getItem('omnichat_active_id') || (state.conversations[0]?.id || null);
    } catch (e) {
      state.conversations = [];
    }
  }
  if (state.conversations.length === 0) {
    createNewConversation();
  }
}

// Conversation Management
function createNewConversation() {
  const newChat = {
    id: 'chat_' + Date.now(),
    title: 'New Conversation',
    createdAt: new Date().toISOString(),
    model: el.modelSelect.value,
    effort: el.effortSelect.value,
    messages: []
  };
  state.conversations.unshift(newChat);
  state.activeConversationId = newChat.id;
  saveConversations();
  renderSidebar();
  renderMessages();
  el.promptInput.focus();
}

function getActiveConversation() {
  return state.conversations.find(c => c.id === state.activeConversationId);
}

function deleteConversation(id, event) {
  event.stopPropagation();
  state.conversations = state.conversations.filter(c => c.id !== id);
  if (state.conversations.length === 0) {
    createNewConversation();
  } else if (state.activeConversationId === id) {
    state.activeConversationId = state.conversations[0].id;
  }
  saveConversations();
  renderSidebar();
  renderMessages();
}

function renderSidebar() {
  el.chatHistoryList.innerHTML = '';
  state.conversations.forEach(chat => {
    const isActive = chat.id === state.activeConversationId;
    const item = document.createElement('div');
    item.className = `group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition ${
      isActive ? 'bg-stone-800 text-stone-100 font-medium border border-anthropic-border' : 'text-stone-400 hover:bg-stone-900 hover:text-stone-200'
    }`;
    item.innerHTML = `
      <div class="flex items-center space-x-2 truncate flex-1">
        <svg class="w-3.5 h-3.5 text-stone-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
        <span class="truncate">${escapeHtml(chat.title)}</span>
      </div>
      <button class="delete-chat-btn opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-stone-500 transition" title="Delete conversation">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    `;
    item.addEventListener('click', () => {
      state.activeConversationId = chat.id;
      saveConversations();
      renderSidebar();
      renderMessages();
    });
    item.querySelector('.delete-chat-btn').addEventListener('click', (e) => deleteConversation(chat.id, e));
    el.chatHistoryList.appendChild(item);
  });
}

function renderMessages() {
  const chat = getActiveConversation();
  if (!chat || chat.messages.length === 0) {
    el.messagesContainer.innerHTML = '';
    el.messagesContainer.appendChild(el.welcomeScreen);
    return;
  }

  el.messagesContainer.innerHTML = '';
  chat.messages.forEach(msg => {
    appendMessageToDOM(msg, false);
  });
  scrollToBottom();
}

function appendMessageToDOM(msg, shouldScroll = true) {
  const isUser = msg.role === 'user';
  const row = document.createElement('div');
  row.className = `flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`;

  let contentHtml = '';

  if (isUser) {
    let attachmentsHtml = '';
    if (msg.attachments && msg.attachments.length > 0) {
      attachmentsHtml = `<div class="flex flex-wrap gap-1.5 mb-2">` +
        msg.attachments.map(att => `
          <div class="flex items-center gap-1 bg-stone-900 border border-anthropic-border rounded-lg px-2 py-1 text-[11px] text-stone-300">
            <svg class="w-3 h-3 text-anthropic-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            <span class="max-w-[140px] truncate">${escapeHtml(att.name)}</span>
            <span class="text-[9px] text-stone-500">(${formatBytes(att.size)})</span>
          </div>
        `).join('') + `</div>`;
    }

    contentHtml = `
      <div class="max-w-2xl bg-stone-900 border border-anthropic-border/80 rounded-2xl rounded-tr-sm p-4 shadow-md text-stone-100 text-sm">
        ${attachmentsHtml}
        <div class="whitespace-pre-wrap leading-relaxed">${escapeHtml(msg.content)}</div>
      </div>
      <div class="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-xs font-bold text-stone-300 shrink-0">
        You
      </div>
    `;
  } else {
    let thoughtHtml = '';
    if (msg.thought) {
      thoughtHtml = `
        <details class="thinking-block" open>
          <summary class="thinking-summary">
            <span class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Thinking Process (${msg.effort || 'Maximum'})
            </span>
            <span class="text-[10px] text-stone-500 font-mono">click to toggle</span>
          </summary>
          <div class="thinking-content">${escapeHtml(msg.thought)}</div>
        </details>
      `;
    }

    contentHtml = `
      <div class="w-8 h-8 rounded-full bg-anthropic-coral text-black flex items-center justify-center text-sm font-bold shrink-0 shadow">
        ✦
      </div>
      <div class="max-w-3xl flex-1 overflow-hidden">
        <div class="text-[11px] text-stone-400 font-medium mb-1.5 flex items-center gap-2">
          <span>${msg.model || 'Claude'}</span>
          <span class="w-1 h-1 rounded-full bg-stone-600"></span>
          <span class="text-anthropic-coral">${(msg.effort || 'max').toUpperCase()} Effort</span>
        </div>
        ${thoughtHtml}
        <div class="prose-ai">${marked.parse(msg.content || '')}</div>
      </div>
    `;
  }

  row.innerHTML = contentHtml;
  el.messagesContainer.appendChild(row);

  // Attach copy code handlers
  row.querySelectorAll('pre code').forEach(block => {
    hljs.highlightElement(block);
    const pre = block.parentElement;
    if (!pre.querySelector('.copy-code-btn')) {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code-btn';
      copyBtn.innerText = 'Copy';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(block.innerText);
        copyBtn.innerText = 'Copied!';
        setTimeout(() => copyBtn.innerText = 'Copy', 2000);
      });
      pre.appendChild(copyBtn);
    }
  });

  if (shouldScroll) scrollToBottom();
  return row;
}

// File Attachment Handling
function handleFiles(files) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    const isImage = file.type.startsWith('image/');

    reader.onload = (e) => {
      state.pendingAttachments.push({
        name: file.name,
        size: file.size,
        type: file.type,
        data: e.target.result,
        isImage: isImage
      });
      renderAttachmentsDock();
    };

    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
  el.fileInput.value = '';
}

function removeAttachment(index) {
  state.pendingAttachments.splice(index, 1);
  renderAttachmentsDock();
}

function renderAttachmentsDock() {
  if (state.pendingAttachments.length === 0) {
    el.attachmentsDock.classList.add('hidden');
    el.attachmentChips.innerHTML = '';
    return;
  }

  el.attachmentsDock.classList.remove('hidden');
  el.attachmentChips.innerHTML = '';

  state.pendingAttachments.forEach((att, idx) => {
    const chip = document.createElement('div');
    chip.className = 'attachment-chip';
    chip.innerHTML = `
      <span class="text-anthropic-coral text-xs">${att.isImage ? '🖼️' : '📄'}</span>
      <span class="filename" title="${escapeHtml(att.name)}">${escapeHtml(att.name)}</span>
      <span class="text-[10px] text-stone-500">(${formatBytes(att.size)})</span>
      <button class="text-stone-400 hover:text-red-400 ml-1 text-xs">✕</button>
    `;
    chip.querySelector('button').addEventListener('click', () => removeAttachment(idx));
    el.attachmentChips.appendChild(chip);
  });
}

// Sending Messages & Streaming
async function sendMessage() {
  const text = el.promptInput.value.trim();
  if (!text && state.pendingAttachments.length === 0) return;
  if (state.isStreaming) return;

  const chat = getActiveConversation();
  if (!chat) return;

  // Add User Message
  const attachmentsToSend = [...state.pendingAttachments];
  const userMsg = {
    role: 'user',
    content: text,
    attachments: attachmentsToSend,
    createdAt: new Date().toISOString()
  };

  chat.messages.push(userMsg);
  if (chat.title === 'New Conversation' && text) {
    chat.title = text.slice(0, 32) + (text.length > 32 ? '...' : '');
  }

  // Clear input & pending attachments
  el.promptInput.value = '';
  el.promptInput.style.height = 'auto';
  el.charCount.innerText = '0 chars';
  state.pendingAttachments = [];
  renderAttachmentsDock();
  saveConversations();
  renderSidebar();

  // If welcome screen is visible, clear it
  if (el.messagesContainer.contains(el.welcomeScreen)) {
    el.messagesContainer.innerHTML = '';
  }

  appendMessageToDOM(userMsg);

  // Prepare Assistant Placeholder
  const assistantMsg = {
    role: 'assistant',
    model: el.modelSelect.value,
    effort: el.effortSelect.value,
    thought: '',
    content: '',
    createdAt: new Date().toISOString()
  };

  chat.messages.push(assistantMsg);

  // Assistant DOM Row
  const row = document.createElement('div');
  row.className = 'flex gap-4 justify-start';
  row.innerHTML = `
    <div class="w-8 h-8 rounded-full bg-anthropic-coral text-black flex items-center justify-center text-sm font-bold shrink-0 shadow">
      ✦
    </div>
    <div class="max-w-3xl flex-1 overflow-hidden">
      <div class="text-[11px] text-stone-400 font-medium mb-1.5 flex items-center gap-2">
        <span>${assistantMsg.model}</span>
        <span class="w-1 h-1 rounded-full bg-stone-600"></span>
        <span class="text-anthropic-coral">${assistantMsg.effort.toUpperCase()} Effort</span>
        <span class="status-badge text-[10px] text-stone-500 italic">Initializing...</span>
      </div>
      <details class="thinking-block" open>
        <summary class="thinking-summary">
          <span class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Reasoning Engine (${assistantMsg.effort.toUpperCase()})
          </span>
          <span class="text-[10px] text-stone-500 font-mono">click to collapse</span>
        </summary>
        <div class="thinking-content">Thinking...\n</div>
      </details>
      <div class="prose-ai typing-cursor"></div>
    </div>
  `;
  el.messagesContainer.appendChild(row);
  scrollToBottom();

  const thinkingBlock = row.querySelector('.thinking-block');
  const thinkingContent = row.querySelector('.thinking-content');
  const proseDiv = row.querySelector('.prose-ai');
  const statusBadge = row.querySelector('.status-badge');

  // Toggle buttons
  state.isStreaming = true;
  state.abortController = new AbortController();
  el.sendBtn.classList.add('hidden');
  el.stopBtn.classList.remove('hidden');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: state.abortController.signal,
      body: JSON.stringify({
        messages: chat.messages.slice(0, -1),
        model: assistantMsg.model,
        reasoningEffort: assistantMsg.effort,
        attachments: attachmentsToSend,
        apiKey: state.settings.apiKey,
        customEndpoint: state.settings.customEndpoint
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = 'message';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (currentEvent === 'status' && data.message) {
              statusBadge.innerText = data.message;
            } else if (currentEvent === 'thought' && data.delta) {
              assistantMsg.thought += data.delta;
              thinkingContent.innerText = assistantMsg.thought;
              scrollToBottom();
            } else if (currentEvent === 'token' && data.delta) {
              assistantMsg.content += data.delta;
              proseDiv.innerHTML = marked.parse(assistantMsg.content);
              scrollToBottom();
            } else if (currentEvent === 'done') {
              statusBadge.innerText = 'Completed';
            }
          } catch (e) {}
        }
      }
    }

  } catch (err) {
    if (err.name === 'AbortError') {
      statusBadge.innerText = 'Stopped by user';
    } else {
      statusBadge.innerText = 'Error';
      assistantMsg.content += `\n\n> ⚠️ **Error**: ${err.message}`;
      proseDiv.innerHTML = marked.parse(assistantMsg.content);
    }
  } finally {
    state.isStreaming = false;
    state.abortController = null;
    proseDiv.classList.remove('typing-cursor');
    el.sendBtn.classList.remove('hidden');
    el.stopBtn.classList.add('hidden');

    // Syntax highlight all generated code blocks
    row.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
      const pre = block.parentElement;
      if (!pre.querySelector('.copy-code-btn')) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-code-btn';
        copyBtn.innerText = 'Copy';
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(block.innerText);
          copyBtn.innerText = 'Copied!';
          setTimeout(() => copyBtn.innerText = 'Copy', 2000);
        });
        pre.appendChild(copyBtn);
      }
    });

    saveConversations();
  }
}

// Utility Helpers
function scrollToBottom() {
  el.messagesContainer.scrollTop = el.messagesContainer.scrollHeight;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Event Listeners
function initEventListeners() {
  // Sidebar Toggle
  el.sidebarToggleBtn.addEventListener('click', () => {
    el.sidebar.classList.toggle('-translate-x-full');
  });

  // New Chat
  el.newChatBtn.addEventListener('click', createNewConversation);

  // Clear All
  el.clearAllChatsBtn.addEventListener('click', () => {
    if (confirm('Clear all conversation history?')) {
      state.conversations = [];
      createNewConversation();
    }
  });

  // Prompt Auto-resize & Char count
  el.promptInput.addEventListener('input', () => {
    el.promptInput.style.height = 'auto';
    el.promptInput.style.height = Math.min(el.promptInput.scrollHeight, 180) + 'px';
    el.charCount.innerText = `${el.promptInput.value.length} chars`;
  });

  // Keybindings: Enter to send, Shift+Enter for new line
  el.promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Send & Stop Buttons
  el.sendBtn.addEventListener('click', sendMessage);
  el.stopBtn.addEventListener('click', () => {
    if (state.abortController) {
      state.abortController.abort();
    }
  });

  // File Attachments Pick & Drag
  el.attachBtn.addEventListener('click', () => el.fileInput.click());
  el.fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
  el.clearAttachmentsBtn.addEventListener('click', () => {
    state.pendingAttachments = [];
    renderAttachmentsDock();
  });

  // Drag and Drop files onto window
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  // Effort Selector
  el.effortSelect.addEventListener('change', () => {
    const val = el.effortSelect.value;
    el.reasoningIndicator.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full bg-anthropic-coral animate-ping"></span>
      Effort: ${val.charAt(0).toUpperCase() + val.slice(1)}
    `;
  });

  // Welcome screen prompt suggestions
  document.querySelectorAll('.welcome-card').forEach(card => {
    card.addEventListener('click', () => {
      const title = card.querySelector('span.font-semibold').innerText;
      el.promptInput.value = `Explain and demonstrate: ${title}`;
      el.promptInput.focus();
    });
  });

  // Settings Modal
  el.settingsBtn.addEventListener('click', () => {
    el.apiKeyInput.value = state.settings.apiKey;
    el.customEndpointInput.value = state.settings.customEndpoint;
    el.systemPromptInput.value = state.settings.systemPrompt;
    el.settingsModal.classList.remove('hidden');
  });

  el.closeSettingsBtn.addEventListener('click', () => {
    el.settingsModal.classList.add('hidden');
  });

  el.saveSettingsBtn.addEventListener('click', () => {
    state.settings.apiKey = el.apiKeyInput.value.trim();
    state.settings.customEndpoint = el.customEndpointInput.value.trim();
    state.settings.systemPrompt = el.systemPromptInput.value.trim();

    localStorage.setItem('omnichat_api_key', state.settings.apiKey);
    localStorage.setItem('omnichat_custom_endpoint', state.settings.customEndpoint);
    localStorage.setItem('omnichat_system_prompt', state.settings.systemPrompt);

    el.settingsModal.classList.add('hidden');
  });
}

// Initialize Application
loadConversations();
renderSidebar();
renderMessages();
initEventListeners();


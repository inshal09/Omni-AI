# OmniChat AI — Free & Unlimited AI Suite

An independent, full-stack, customizable conversational AI application built with frontier architecture, support for multi-model switching (Opus 5.5, Sonnet 5.5, Haiku 5.5, and Local Ollama models), Maximum High reasoning effort, a responsive auto-expanding typing dock, and multi-format file attachment processing.

---

## 🌟 Key Features

1. **100% Free & Unlimited Access**:
   - Out-of-the-box offline/simulation intelligence engine with zero subscriptions and zero cost.
   - Compatible with local LLMs (e.g., DeepSeek-R1, Llama 3.3 via Ollama at `http://localhost:11434`).
   - Optional direct frontier API key support (Anthropic / OpenAI).

2. **Model Switcher**:
   - **Claude Opus 5.5**: Maximum intelligence & architecture preset.
   - **Claude Sonnet 5.5**: High performance & coding specialist.
   - **Claude Haiku 5.5**: Ultra-fast, lightweight streaming.
   - **DeepSeek-R1 / Llama 3.3**: Unlimited local privacy-first offline models.

3. **Maximum High Reasoning Effort**:
   - Configurable thinking token budget: **Maximum High (32k)**, **High (16k)**, **Medium (4k)**, and **Standard (1k)**.
   - Live collapsible `<details>` thinking disclosure widget showing the model's step-by-step reasoning tokens before displaying the final response.

4. **Modern Typing Bar**:
   - Auto-expanding multiline input dock (resizes up to 180px).
   - Character count and reasoning indicator pill.
   - Hotkeys: `Enter` to send, `Shift + Enter` for line breaks.
   - Generation controls: real-time streaming with live Stop button.

5. **File Attachments System**:
   - Supports drag-and-drop or file picker for source code (`.py`, `.js`, `.ts`, `.html`), data (`.json`, `.csv`), documents (`.txt`, `.md`, `.pdf`), and images (`.png`, `.jpg`, `.webp`).
   - File attachment dock with file size indicators, thumbnail icons, and one-click removal.

6. **Rich Markdown & Code Rendering**:
   - GFM markdown parsing.
   - Syntax-highlighted code blocks with built-in one-click **Copy Code** buttons.
   - Persistent chat sessions saved in browser storage.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or later (tested on Node.js v24).

### Running the Application

1. Navigate to the project directory:
   ```powershell
   cd "C:\Users\M Inshal Ali Taskeen\.gemini\antigravity\scratch\ai-chat-app"
   ```

2. Start the server:
   ```powershell
   node server.js
   ```

3. Open your browser and go to:
   ```
   http://localhost:3000
   ```

---

## 📁 Project Structure

```
ai-chat-app/
├── package.json          # Project metadata & npm scripts
├── server.js             # Standalone Node.js HTTP & SSE streaming backend
├── README.md             # Documentation & setup instructions
└── public/
    ├── index.html        # Modern frontend with Tailwind CSS & marked
    ├── styles.css        # Sleek dark theme, animations, and scrollbars
    └── app.js            # Reactive client controller & state management
```


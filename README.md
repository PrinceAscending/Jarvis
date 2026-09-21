# J.A.R.V.I.S. — Personal AI Assistant for Windows 11

![JARVIS Banner](assets/app_icon.ico)

> **Autonomous, Futuristic Personal Intelligence Operating Layer for Windows 11**  
> Inspired by cinematic AI systems, engineered as a commercial-grade, multi-model desktop platform with local offline intelligence, real-time voice streaming, deep Windows automation, persistent vector memory, and high-FPS glassmorphic visuals.

---

## 🌟 Primary Capabilities

### 1. Dual-Mode Multi-Model Intelligence Matrix
- **Local Offline Mode (100% Private)**: Direct integration with **Ollama** (`llama3`, `deepseek-r1`, `mistral`, `qwen2.5-coder`). Runs completely on-device without internet access or external data transmission.
- **Online Free Providers**:
  - **Google Gemini**: High-speed reasoning with Google's generous free tier (`gemini-2.5-flash`).
  - **Groq Cloud**: Ultra-low-latency real-time inference with free Llama 3.3 70B & 8B models.
  - **OpenRouter**: Access to a broad ecosystem of free models (`meta-llama/llama-3.3-70b-instruct:free`, `google/gemini-2.0-flash-exp:free`, `qwen-2.5-coder:free`).
- **Commercial Flagship Providers**: OpenAI (`gpt-4o`, `gpt-4o-mini`), Anthropic (`claude-3-5-sonnet`).
- **Automatic Fallback & Task Routing**: Automatically routes tasks to specialized models (e.g. ultra-fast voice responses to Groq, deep reasoning to Gemini, code to OpenRouter, offline tasks to Ollama) with transparent automatic fallback if an API is unavailable.

### 2. High-Fidelity Voice Pipeline
- **Zero-Cost Neural Text-to-Speech**: Edge TTS integration supporting 400+ Microsoft Neural voices (e.g., `en-US-ChristopherNeural`, `en-US-GuyNeural`, `en-GB-RyanNeural`).
- **Real-Time MP3 Chunk Streaming**: Streams audio directly to the browser frontend via WebSockets for zero-latency, gapless playback.
- **Instant Voice Barge-In**: Silences voice synthesis and aborts execution the millisecond the user speaks or clicks stop.
- **Push-to-Talk & Continuous Listening**: Flexible voice trigger modes.

### 3. Deep Windows 11 Computer Control & Automation
- **Autonomous File Management**: Intelligently organizes cluttered directories (`Downloads`, `Desktop`), categorizing files into Documents, Media, Archives, Code, and Installers while preventing name collisions.
- **System Telemetry & Health Audit**: Real-time monitoring of CPU usage, logical cores, RAM allocations, Disk usage, Network I/O, and battery status.
- **Process Management**: Inspects top resource-consuming Windows tasks and allows safe termination of unresponsive processes.
- **Application & URL Launcher**: Launches native Windows apps (`calc`, `notepad`, `chrome`, `explorer`, `code`) and web destinations.
- **PowerShell / CMD Execution**: Secure subprocess execution with blacklisted destructive command filters, timeout guards, and captured stdout/stderr.
- **Real-Time Live Web Search**: Live internet search via DuckDuckGo with zero API keys required.
- **Desktop Automation**: Captures high-res primary display screenshots, minimizes all windows to reveal desktop, adjusts volume, and locks workstation.
- **Sandboxed Python Code Execution**: Runs dynamic Python scripts in isolated subprocesses with timeout protection.

### 4. Persistent Memory Core & User Preferences
- **Multi-Layered Memory Architecture**:
  - **Conversational Context**: Short-term sliding window with SQLite persistence.
  - **Long-Term Knowledge Core**: User preferences, projects, and critical facts retained across application restarts and injected dynamically into reasoning prompts.
- **User Controllable**: Full visibility to inspect, search, add, and delete memories directly from the UI.

### 5. Security Guardrails & Audit Trail
- **Granular Permission Modes**:
  - `Strict`: Operator confirmation required for any modifying action.
  - `Interactive` *(Default)*: Safe read-only and harmless operations run automatically; destructive or shell actions request permission.
  - `Autonomous`: Autonomous workflow execution, only pausing for critical security actions.
- **Credential Storage**: API keys stored in Windows Credential Manager via `keyring`.
- **Audit Logging**: Immutable SQLite audit trail logging every tool executed, arguments, return status, and timestamp.

### 6. Cinematic Glassmorphic User Interface
- **Frameless Borderless Window**: Native Windows 11 window with custom drag regions (`-webkit-app-region: drag`), always-on-top pin toggle, and smooth minimize/close controls.
- **Audio Visualizer Orb**: 60 FPS HTML5 Canvas core with multi-ring orbital geometry and state-reactive waveforms (`idle`, `listening`, `thinking`, `tool_executing`, `speaking`).
- **Dynamic Views**:
  - 💬 **Command Core**: Streaming markdown chat with real-time tool execution badges and prompt suggestion chips.
  - 📊 **Telemetry**: Live circular hardware load meters, memory gauges, and process management table.
  - 🧠 **Memory Core**: Searchable and editable persistent memory cards.
  - ⚡ **Workflows**: 1-click autonomous multi-step sequences.
  - ⚙️ **Neural Matrix**: Provider switcher, model parameters, API key configuration, and voice persona selector.
  - 🛡️ **Security Audit**: Live ledger of all executed tools and commands.

---

## 🚀 Installation & Running

### Option 1: Professional Windows 11 Installer (Recommended for End Users)
The project compiles into a single-file, professional setup installer wizard that requires no terminal or dev tools:
```
installer/output/JarvisAssistant_Setup.exe
```
1. Run `JarvisAssistant_Setup.exe`.
2. Follow the setup wizard (creates Start Menu & Desktop shortcuts in your user profile).
3. Launch **JARVIS AI Assistant** directly from the Start Menu or Desktop!

### Option 2: Run Standalone Packaged Executable
The standalone portable package is located at:
```
dist/JarvisApp/JarvisApp.exe
```
Double-click `JarvisApp.exe` to run immediately without installation.

### Option 3: Run From Source (Developers)

#### Prerequisites
- Windows 10/11
- Python 3.11+
- Node.js 18+

#### 1. Setup Python Backend
```powershell
python -m pip install -r requirements.txt
```

#### 2. Build or Run Frontend UI
```powershell
# Build production bundle
cd ui
npm install
npm run build
cd ..
```

#### 3. Launch Application
```powershell
# Production mode (using compiled UI)
python main.py

# Dev mode (with Vite Hot-Module Replacement)
# Terminal 1:
cd ui && npm run dev
# Terminal 2:
$env:JARVIS_DEV="1"; python main.py
```

---

## 🛠️ Build Pipeline (`build.py`)

To build the entire project from scratch (React frontend, PyInstaller binary packaging, and Inno Setup installer compilation):
```powershell
python build.py
```
Output:
- `ui/dist/` — Compiled React + Tailwind bundle
- `dist/JarvisApp/` — Standalone portable Windows package
- `installer/output/JarvisAssistant_Setup.exe` — Single-file Windows 11 setup installer (~37.5 MB)

---

## 🧩 Architectural Layout

```
jarvis/
├── main.py                         # Application lifecycle & pywebview desktop host
├── build.py                        # Master production build pipeline
├── JarvisApp.spec                  # PyInstaller packaging specification
├── requirements.txt                # Python backend dependencies
│
├── config/
│   ├── defaults.py                 # Default settings and system prompt
│   └── settings.py                 # Pydantic settings manager with JSON persistence
│
├── ai/
│   ├── base.py                     # Provider abstraction & message dataclasses
│   ├── manager.py                  # Dynamic provider router & fallback manager
│   └── providers/
│       ├── openai_compatible.py    # Generic high-performance async client
│       ├── ollama_provider.py      # Local offline Ollama provider
│       ├── groq_provider.py        # Ultra-fast Groq Cloud provider
│       ├── openrouter_provider.py  # OpenRouter free & community models
│       ├── gemini_provider.py      # Google Gemini provider
│       ├── openai_provider.py      # OpenAI GPT-4o provider
│       └── anthropic_provider.py   # Anthropic Claude provider
│
├── core/
│   ├── orchestrator.py             # Central intelligence & tool loop engine
│   └── workflows.py                # Multi-step autonomous workflows
│
├── tools/
│   ├── base.py                     # BaseTool class & permission levels
│   ├── registry.py                 # Tool discovery & execution dispatcher
│   ├── file_ops.py                 # File & folder organization tools
│   ├── system_info.py              # Diagnostics, CPU/RAM/Disk, processes
│   ├── app_launcher.py             # Windows apps & browser URL launcher
│   ├── shell.py                    # PowerShell & CMD runner
│   ├── web_search.py               # DuckDuckGo live web search
│   ├── clipboard.py                # Clipboard reading & writing
│   ├── windows_control.py          # Screenshot, volume, window controls
│   └── code_exec.py                # Sandboxed Python execution
│
├── voice/
│   ├── tts.py                      # Edge TTS neural voice streaming engine
│   └── pipeline.py                 # Voice event dispatcher & barge-in handler
│
├── memory/
│   ├── database.py                 # SQLite tables (conversations, memories, audit)
│   └── manager.py                  # Memory context injection & recall
│
├── security/
│   ├── permissions.py              # Autonomy & permission levels
│   └── credentials.py              # Windows Credential Manager integration
│
├── automation/
│   └── proactive.py                # Background proactive intelligence alerts
│
├── server/
│   ├── app.py                      # FastAPI app with static file serving
│   ├── routes.py                   # REST API routes
│   └── websocket.py                # Thread-safe real-time WebSocket manager
│
├── ui/                             # React 18 + TypeScript + Vite + Tailwind UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── audio/              # Canvas 60 FPS Reactor Orb visualizer
│   │   │   ├── layout/             # Window header & navigation sidebar
│   │   │   ├── chat/               # Chat stream, tool cards, console input
│   │   │   ├── dashboard/          # Hardware telemetry & process manager
│   │   │   ├── memory/             # Persistent memory browser
│   │   │   ├── automations/        # Autonomous 1-click workflows
│   │   │   ├── settings/           # Neural matrix & voice config
│   │   │   └── audit/              # Security audit trail
│   │   ├── store/useAppStore.ts    # Zustand reactive global state
│   │   └── hooks/useJarvisSocket.ts# WebSocket streaming & audio chunk decoder
│
└── installer/
    ├── jarvis_installer.iss        # Inno Setup 6 compilation script
    ├── assets/app_icon.ico         # Application icon
    └── output/                     # Final output directory for setup executable
```

---

## ⚖️ License
Released under the MIT License. Built for Windows 11.

# 🌌 Nebula Node

> A financial intelligence operator console for detecting market-moving events, propagating impact through dependency graphs, and generating trade candidates with integrated risk management — all visualized through a real-time dark terminal interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite)
![D3.js](https://img.shields.io/badge/D3.js-7.x-F9A03C?logo=d3.js)

---

## 📖 Overview

**Nebula Node** is a full-stack financial intelligence platform prototype built with React, TypeScript, D3.js, and Zustand. It simulates a professional trading operations console where:

- **Geopolitical and macroeconomic events** are ingested as signals
- A **BFS-based propagation engine** calculates multi-hop market impact across a dependency graph of 30+ interconnected assets
- A **trade construction pipeline** identifies actionable candidates with entry/stop/target zones and Kelly-sized position sizing
- A **risk engine** enforces hard limits, correlation guards, and drawdown thresholds
- Everything is delivered through a **5-panel real-time console UI** with authentication, an alert ticker, D3 force-directed graphs, sparkline watchlists, and a sector heatmap

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **3-Step Authentication** | Word Key → Challenge Acknowledge → Passkey with exponential lockout |
| 📡 **Signal Feed** | Ranked, filterable, sortable event signals with score/confidence metrics |
| 🕸️ **Propagation Graph** | D3 force-directed graph with BFS traversal depth controls and impact filters |
| 📈 **Trade Candidates** | Auto-generated trade cards with entry zones, R/R ratio, and expandable AI thesis |
| ⚖️ **Risk Engine** | Kelly position sizing, correlation guards, sector exposure limits, drawdown monitors |
| 📊 **Sector Heatmap** | TreeMap-style color-coded heatmap grouped by sector |
| 🕯️ **Watchlist Sparklines** | Real-time canvas-rendered sparklines for 18 tracked assets |
| 🔔 **Alert System** | 4-level (L1–L4) scrolling alert ticker with multi-channel delivery stubs |
| 🤖 **AI Thesis Generation** | Ollama LLM integration (Mistral 7B / Llama3 8B) with built-in fallback library |
| 🔗 **Inter-Node Messaging** | Redis Pub/Sub + gRPC architecture stubs for distributed node expansion |

---

## 🖥️ Screenshots

> **Authentication Flow** — 3-step lock screen with monospace dark terminal aesthetic

> **Main Console** — 5-panel operator interface with live propagation graph, signal feed, trade candidates, and watchlist

> **Signal Selection** — Clicking a signal (e.g. NVDA/Taiwan Crisis) propagates impact through 10+ dependency nodes with directional indicators

---

## 🗂️ Project Structure

```
src/
├── core/                              # Engine layer (no UI dependencies)
│   ├── config.ts                      # Master constants — risk limits, weights, tokens
│   ├── types.ts                       # Full TypeScript interfaces
│   ├── seedData.ts                    # 30 graph nodes, 30+ edges, 6 events, 5 signals
│   ├── propagation/
│   │   └── PropagationEngine.ts       # BFS + time decay + hop attenuation (Section 1)
│   ├── trades/
│   │   └── TradeConstructionEngine.ts # 5-function trade pipeline (Section 2)
│   ├── risk/
│   │   └── RiskEngine.ts              # Kelly sizing + drawdown guards (Section 3)
│   ├── models/
│   │   └── ModelRouter.ts             # Ollama integration + fallback thesis (Section 7)
│   ├── alerts/
│   │   └── AlertEngine.ts             # 4-level multi-channel alerts (Section 9)
│   └── node/
│       └── NodeInterface.ts           # TSR inter-node messaging (Section 10)
├── store/
│   └── nebulaStore.ts                 # Zustand central state management
├── components/
│   ├── auth/
│   │   └── LockScreen.tsx             # 3-step authentication UI
│   └── panels/
│       ├── TopPanel.tsx               # Scrolling alert ticker + status bar
│       ├── LeftPanel.tsx              # Signal feed (ranked, filtered, sorted)
│       ├── CenterPanel.tsx            # D3 force-directed propagation graph
│       ├── RightPanel.tsx             # Trade cards + Risk dashboard
│       └── BottomPanel.tsx            # Watchlist sparklines + Heatmap
├── App.tsx
├── main.tsx
└── index.css                          # Dark terminal theme + CSS Grid layout
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/Vednatladde/Nebula-Node.git
cd Nebula-Node

# Install dependencies
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

### Authentication

The default credentials for the lock screen are:

| Step | Value |
|------|-------|
| **Word Key** | `orion 731 helios` |
| **Challenge** | Acknowledge the system challenge |
| **Passkey** | `nebula01` |

> ⚠️ These are prototype credentials. For production deployment, replace with a proper secrets management system.

### Build for Production

```bash
npm run build
```

---

## 🧠 Core Engine Architecture

### 1. Propagation Engine
Implements BFS traversal over the financial dependency graph with:
- **Time decay** across 4 delay categories (instant, hour, day, week)
- **Multi-hop attenuation** with configurable hop factor
- **Directional propagation** (bullish green / bearish red flow)

### 2. Trade Construction Engine (5-Stage Pipeline)
1. `identify_affected_assets()` — filter and rank impacted assets
2. `calculate_expected_move()` — volatility regime + beta adjustment
3. `calculate_trade_risk()` — entry zones, stops, R/R targets
4. `build_trade_structure()` — full `TradeCandidate` construction
5. `rank_and_filter_candidates()` — hard filters + soft scoring

### 3. Risk Engine
- **Kelly Position Sizing** (half-Kelly safety factor)
- **Correlation Guard** — sector overlap checks
- **Drawdown Guard** — 4-threshold level system
- **Daily Risk Monitor** — real-time exposure tracking

### 4. Model Router (AI Layer)
Interfaces with local **Ollama** models (Mistral 7B, Llama3 8B) for:
- Trade thesis generation
- Risk factor analysis
- Chain impact narrative

Falls back to a curated built-in thesis library when Ollama is unavailable — the app works fully out-of-the-box without any LLM installation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 + TypeScript 6 |
| **Build Tool** | Vite 8 |
| **State Management** | Zustand 5 |
| **Graph Visualization** | D3.js 7 (force-directed) |
| **Database** | SQLite via `better-sqlite3` (PostgreSQL-compatible schema) |
| **Styling** | Vanilla CSS with CSS Custom Properties |
| **ID Generation** | `uuid` |

---

## 🗺️ Roadmap

- [ ] Live market data integration (WebSocket feeds)
- [ ] PostgreSQL migration for production
- [ ] Ollama auto-detection and model pull on first run
- [ ] Telegram / Pushover alert delivery
- [ ] Multi-node distributed architecture via gRPC
- [ ] Biometric authentication stubs → real integration
- [ ] Historical backtesting module

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">Built with ⚡ by Vedant Ladde and Nebula Node contributors</p>

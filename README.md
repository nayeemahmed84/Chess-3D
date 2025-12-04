# 3D Chess Game 🎮♟️

An immersive 3D chess experience built with React, Three.js, and TypeScript, featuring stunning glassmorphic pieces, AI opponent, game analysis, and an elegant UI.

![Chess Game](https://img.shields.io/badge/TypeScript-5.6-blue) ![React](https://img.shields.io/badge/React-18.3-61dafb) ![Three.js](https://img.shields.io/badge/Three.js-0.181-black) ![Vite](https://img.shields.io/badge/Vite-5.4-646cff)

---

## ✨ Features

### 🎨 Visual & Interactive
- **Glassmorphic Chess Pieces** – Beautiful glass-like renderings with realistic physics materials
- **Smooth Animations** – Elegant piece movements with trailing effects and capture animations
- **Interactive Drag & Drop** – Intuitive piece movement with visual cursor feedback (grab/grabbing)
- **Move Highlighting** – Visual feedback for valid moves, check, last move, and hints
- **Dynamic Camera** – Automatic camera rotation when playing as Black

### 🌐 Online Multiplayer
- **Peer-to-Peer** – Direct connection with friends using PeerJS (no server required)
- **Real-time Updates** – Instant move transmission and board state synchronization
- **Connection Status** – Visual indicators for connection state (Permanent & Popup notifications)
- **Activity Indicators** – See opponent's piece selection and interactions in real-time
- **Chat & Interaction** – (Coming soon)

### 🤖 AI & Gameplay
- **AI Opponent** – Play against Stockfish-powered AI with 3 difficulty levels (Easy, Medium, Hard)
- **Local Multiplayer** – Hotseat mode for two players on the same device
- **Play as White or Black** – Choose your side with automatic perspective switching
- **Smart Hints** – Get move suggestions powered by the AI engine
- **Threat Visualization** – Toggle display of attacked squares

### ⏱️ Game Management
- **Configurable Time Controls** – Choose from Bullet (1 min) to Classical (60 min)
- **Multiple Save Slots** – Save and load up to 5 games with metadata preview
- **Undo/Redo** – Navigate through move history freely
- **PGN Import/Export** – Share and analyze games in standard chess notation
- **Move Navigation** – Jump to any point in the game history

### 📊 Analysis & Stats
- **Enhanced Game Analysis** – Post-game analysis with move classification (brilliant, good, inaccuracy, mistake, blunder)
- **Evaluation Graph** – Visual representation of position evaluation over time
- **Critical Moments** – Automatically highlighted turning points in the game
- **Accuracy Percentage** – Player performance metrics based on centipawn loss
- **Captured Pieces Display** – Track material with piece icons and advantage score
- **Position Evaluation** – Real-time evaluation bar showing game state

### 🎮 Modern UI
- **Glassmorphism Design** – Clean, modern UI with transparency effects
- **Scrollable Control Panel** – Fixed-height panel with all game controls
- **Responsive Layout** – Optimized for desktop browsers
- **Sound Effects** – Audio feedback for moves, captures, and checkmate

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or later) – [Download here](https://nodejs.org/)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation & Play

1. **Clone the repository**
   ```bash
   git clone https://github.com/nayeemahmed84/Chess-3D.git
   cd Chess-3D
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the game**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173`
   - Start playing! 🎉

### How to Play

#### Basic Controls
- **Left Click** to select a piece and see available moves
- **Drag & Drop** pieces to move them (cursor changes to hand)
- **Right Click/Drag** to rotate the camera view

#### Game Modes
1. **vs AI** – Play against the computer with adjustable difficulty
2. **vs Friend** – Local hotseat multiplayer on the same device

#### Features
- **Hints** – Click the hint button (💡) to see the best move
- **Threats** – Toggle to see which squares are under attack
- **Time Control** – Select your preferred time limit before starting
- **Save/Load** – Save your game to one of 5 slots and resume later
- **Analysis** – Click "Analyze Game" after finishing to see detailed statistics

---

## 🛠️ Developer Guide

### Project Structure

```
Chess-3D/
├── src/
│   ├── components/
│   │   ├── Board.tsx             # Chess board rendering & interaction
│   │   ├── Piece.tsx             # 3D piece models with glassmorphic materials
│   │   ├── Scene.tsx             # Three.js scene setup (lighting, camera)
│   │   ├── Game.tsx              # Main game component with UI overlay
│   │   ├── GameAnalysis.tsx      # Post-game analysis modal
│   │   ├── SaveLoadModal.tsx     # Save/Load game interface
│   │   └── PGNModal.tsx          # PGN import/export
│   ├── hooks/
│   │   └── useChessGame.ts       # Chess logic & state management
│   ├── workers/
│   │   └── ai.worker.ts          # Stockfish AI integration
│   ├── assets/
│   │   └── sounds/               # Game sound effects
│   ├── App.tsx                   # Error boundary & app wrapper
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Global styles
├── public/
│   ├── stockfish.js              # Stockfish engine
│   └── stockfish.wasm.js         # WASM version
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
└── README.md                     # This file
```

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3 | UI framework & component architecture |
| **TypeScript** | 5.6 | Type-safe development |
| **Three.js** | 0.181 | 3D rendering engine |
| **@react-three/fiber** | 8.18 | React renderer for Three.js |
| **@react-three/drei** | 9.122 | Useful Three.js helpers |
| **chess.js** | 1.4 | Chess game logic & validation |
| **Vite** | 5.4 | Fast build tool & dev server |
| **lucide-react** | 0.555 | Icon library |
| **Stockfish** | Latest | Chess engine for AI & analysis |

### Available Scripts

```bash
npm run dev      # Start development server (localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint for code quality
```

### Key Components

#### `useChessGame.ts`
Comprehensive chess state management:
- Game initialization with chess.js
- Move validation and execution
- AI move calculation via Web Worker
- Turn and timer management
- Game modes (AI vs Local multiplayer)
- Save/load functionality with 5 slots
- Undo/redo with proper state restoration
- PGN import/export
- Hint generation
- Captured pieces tracking
- Material advantage calculation

#### `Board.tsx`
Interactive chess board:
- 64 clickable squares with visual effects
- Move highlighting (selected, valid, check, last move, hints)
- Drag and drop support
- Threat visualization

#### `Piece.tsx`
Advanced 3D piece rendering:
- GLTF model loading for realistic pieces
- Glassmorphic materials (transmission, clearcoat)
- Smooth move animations with easing
- Capture animations with physics
- Drag state with cursor feedback

#### `GameAnalysis.tsx`
Post-game analysis:
- Sequential position evaluation
- Move classification system
- Accuracy calculation
- Evaluation graph visualization
- Critical moment detection
- Interactive move navigation

#### `ai.worker.ts`
Web Worker for AI:
- Stockfish integration
- Position analysis
- Best move calculation
- Move annotation
- Difficulty-based depth configuration

### Development Tips

1. **AI Behavior**: Adjust difficulty in `ai.worker.ts` by modifying depth values
2. **UI Customization**: Edit glassmorphism styles in `Game.tsx`
3. **Piece Models**: Swap GLTF model URL in `Piece.tsx` for different styles
4. **Time Controls**: Add new presets in `Game.tsx` time control selector
5. **Analysis Depth**: Modify analysis depth in `GameAnalysis.tsx` for speed/accuracy trade-off

### Building for Production

```bash
npm run build
```

Creates an optimized build in `dist/` folder, ready for deployment to static hosting (Vercel, Netlify, GitHub Pages).

### Building Desktop App (Optional)

```bash
npm run tauri build
```

Creates a portable executable for Windows/macOS/Linux using Tauri.

---

## 🎮 Complete Controls Guide

| Action | Control |
|--------|---------|
| Select Piece | Left Click |
| Move Piece | Drag & Drop or Click destination |
| Rotate Camera | Right Click + Drag |
| Reset Game | "Reset Game" button |
| Undo Move | Undo button (↶) |
| Redo Move | Redo button (↷) |
| Get Hint | Hint button (💡) |
| Toggle Threats | "Show Threats" button |
| Save Game | Save button → Select slot |
| Load Game | Load button → Select slot |
| Analyze Game | "Analyze Game" button (after game ends) |

---

## 🧩 Features Breakdown

### Game Modes
- **AI Mode**: Play against Stockfish with Easy, Medium, or Hard difficulty
- **Local Mode**: Two players on the same device (hotseat)

### Time Controls
- 1 minute (Bullet)
- 3 minutes (Blitz)
- 5 minutes (Blitz)
- 10 minutes (Rapid) - Default
- 30 minutes (Classical)
- 60 minutes

### Analysis Features
- Move-by-move evaluation
- Brilliant moves (‼), Good (!), Inaccuracies (?!), Mistakes (?), Blunders (??)
- Accuracy percentage for both sides
- Evaluation graph with critical moments marked
- Best move suggestions for mistakes

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and passes `npm run lint`.

---

## 📝 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Stockfish** for the powerful chess engine
- **chess.js** for robust chess logic
- **Three.js** community for 3D rendering excellence
- **React Three Fiber** for seamless React integration

**Enjoy playing! ♟️✨**

Made with 💖 by [Nayeem](https://www.facebook.com/LegendCoder)
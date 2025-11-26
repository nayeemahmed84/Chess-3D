# 3D Chess Game 🎮♟️

An immersive 3D chess experience built with React, Three.js, and TypeScript, featuring stunning glassmorphic pieces, smooth animations, and an elegant UI.

![Chess Game](https://img.shields.io/badge/TypeScript-5.6-blue) ![React](https://img.shields.io/badge/React-18.3-61dafb) ![Three.js](https://img.shields.io/badge/Three.js-0.181-black) ![Vite](https://img.shields.io/badge/Vite-5.4-646cff)

---

## ✨ Features

- **🎨 Glassmorphic Chess Pieces** – Beautiful glass-like renderings with realistic physics materials
- **🎬 Smooth Animations** – Elegant piece movements with trailing effects
- **💡 Move Highlighting** – Visual feedback for valid moves and selected pieces
- **🎯 Interactive Board** – Click to select and move pieces with intuitive controls
- **📊 Game State Management** – Full chess logic powered by chess.js
- **🎭 Modern UI** – Clean glassmorphism-style overlay showing game status
- **🔄 Reset Functionality** – Restart games with a single click
- **📱 Responsive Design** – Works beautifully on desktop browsers

---

## 🚀 Quick Start (For Users)

Want to play the game? Follow these simple steps:

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
- **Left Click** to select a piece and see available moves
- **Left Click** again on a highlighted square to move
- **Right Click/Drag** to rotate the camera view
- Watch the game status in the glassmorphic overlay
- Click "Play Again" to reset the game

---

## 🛠️ Developer Guide

For developers who want to modify or extend the project:

### Project Structure

```
Chess-3D/
├── src/
│   ├── components/
│   │   ├── Board.tsx         # Chess board rendering & interaction
│   │   ├── Piece.tsx         # 3D piece models with glassmorphic materials
│   │   ├── Scene.tsx         # Three.js scene setup (lighting, camera)
│   │   └── Game.tsx          # Main game component with UI overlay
│   ├── hooks/
│   │   └── useChessGame.ts   # Chess logic & state management
│   ├── App.tsx               # Error boundary & app wrapper
│   ├── main.tsx              # React entry point
│   └── index.css             # Global styles
├── index.html                # HTML template
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite configuration
└── README.md                 # This file
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

### Available Scripts

```bash
npm run dev      # Start development server (localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint for code quality
```

### Key Components

#### `useChessGame.ts`
Custom hook managing chess state:
- Game initialization with chess.js
- Move validation and execution
- Turn management
- Win/draw detection
- Reset functionality

#### `Board.tsx`
Renders the chess board:
- 64 interactive squares with click handlers
- Move highlighting (selected, possible moves)
- Piece positioning based on FEN notation
- Board frame and styling

#### `Piece.tsx`
3D chess piece rendering:
- Lathe geometry for traditional piece shapes
- Glassmorphic materials (transmission, clearcoat)
- Smooth move animations with trails
- Color differentiation (white/black)

#### `Scene.tsx`
Three.js scene configuration:
- Ambient and directional lighting
- Camera orbit controls
- Shadow mapping setup

### Development Tips

1. **Adding New Piece Types**: Modify the `points` generation in `Piece.tsx`
2. **Changing Board Colors**: Update color values in `Board.tsx` squares mapping
3. **Adjusting Animations**: Tweak `progress` and `delta` multipliers in `Piece.tsx`
4. **UI Customization**: Edit glassmorphism styles in `Game.tsx` overlay
5. **Game Rules**: Extend `useChessGame.ts` for custom chess variants

### Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder, ready for deployment to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

---

## 🎮 Controls

| Action | Control |
|--------|---------|
| Select/Move Piece | Left Click |
| Rotate Camera | Right Click + Drag |
| Reset Game | Click "Play Again" button |

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

- **chess.js** for robust chess logic
- **Three.js** community for 3D rendering excellence
- **React Three Fiber** for seamless React integration

---

**Enjoy playing! ♟️✨**
new
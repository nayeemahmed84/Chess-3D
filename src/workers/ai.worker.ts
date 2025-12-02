import { Chess } from 'chess.js';

// Stockfish.js exports a Worker, not a function
// Use public directory path for both dev and production (Tauri) builds
const wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));

// @ts-ignore
// Use public directory path - works in both Vite dev server and Tauri builds
const stockfish = new Worker(
    wasmSupported
        ? '/stockfish.wasm.js'
        : '/stockfish.js'
);

console.log('[Worker] Stockfish instance created');

// State for analysis
interface AnalysisState {
    fen: string;
    playedMove: string; // UCI
    playedMoveSan: string; // SAN for reporting back
    bestMove?: string;
    bestScore?: number; // centipawns
    playedScore?: number;
    step: 'find_best' | 'eval_played';
}

let pendingAnalysis: AnalysisState | null = null;
let pendingRequestType: 'move' | 'hint' | null = null; // Track what kind of request we're handling

// Synchronization state
let isFlushing = false;
let queuedCommand: (() => void) | null = null;

const parseScore = (line: string): number | null => {
    const parts = line.split(' ');
    const scoreIndex = parts.indexOf('score');
    if (scoreIndex !== -1) {
        const type = parts[scoreIndex + 1];
        const val = parseInt(parts[scoreIndex + 2]);
        if (type === 'cp') return val;
        if (type === 'mate') return val > 0 ? 10000 : -10000;
    }
    return null;
};

const parseAnalysisInfo = (line: string) => {
    if (!pendingAnalysis) return;

    const score = parseScore(line);
    if (score !== null) {
        if (pendingAnalysis.step === 'find_best') {
            pendingAnalysis.bestScore = score;
        } else {
            pendingAnalysis.playedScore = score;
        }
    }
};

const handleBestMove = (line: string) => {
    const parts = line.split(' ');
    const move = parts[1]; // UCI move (e.g. e2e4)

    if (pendingAnalysis) {
        if (pendingAnalysis.step === 'find_best') {
            pendingAnalysis.bestMove = move;
            pendingAnalysis.step = 'eval_played';

            if (pendingAnalysis.playedMove === move) {
                pendingAnalysis.playedScore = pendingAnalysis.bestScore;
                finishAnalysis();
                return;
            }

            stockfish.postMessage(`position fen ${pendingAnalysis.fen}`);
            stockfish.postMessage(`go depth 10 searchmoves ${pendingAnalysis.playedMove}`);
        } else {
            finishAnalysis();
        }
        return;
    }

    // Normal move/hint request
    const responseType = pendingRequestType || 'move';
    console.log('[Worker] Sending response type:', responseType, 'move:', move);
    self.postMessage({ type: responseType, move });
    pendingRequestType = null; // Reset after sending
};

const finishAnalysis = () => {
    if (!pendingAnalysis) return;

    const { bestScore, playedScore, playedMoveSan } = pendingAnalysis;

    let annotation = '';
    if (bestScore !== undefined && playedScore !== undefined) {
        const diff = bestScore - playedScore;

        if (diff > 300) {
            annotation = '??';
        } else if (diff > 100) {
            annotation = '?';
        } else if (diff > 50) {
            annotation = '?!';
        }
    }

    self.postMessage({
        type: 'analysis',
        moveSan: playedMoveSan,
        annotation
    });

    pendingAnalysis = null;
};

// Listen to Stockfish output
stockfish.addEventListener('message', (e) => {
    const line = e.data;

    // Synchronization: Wait for readyok before processing new commands
    if (line === 'readyok') {
        isFlushing = false;
        if (queuedCommand) {
            queuedCommand();
            queuedCommand = null;
        }
        return;
    }

    // Ignore any output (like bestmove from cancelled search) while flushing
    if (isFlushing) return;

    // console.log('[Worker] Stockfish output:', line);

    if (line.startsWith('info') && pendingAnalysis) {
        parseAnalysisInfo(line);
    }

    if (line.startsWith('bestmove')) {
        handleBestMove(line);
    }
});

// Initialize Stockfish
console.log('[Worker] Sending UCI init command');
stockfish.postMessage('uci');

// Listen to messages from main thread
self.onmessage = (e: MessageEvent) => {
    console.log('[Worker] Received message from main thread:', e.data.type);
    const { type, fen, move, difficulty } = e.data;

    if (type === 'init') {
        return;
    }

    // Prepare the command to run after flushing
    const command = () => {
        if (type === 'move' || type === 'hint') {
            pendingAnalysis = null; // Clear any stale analysis state
            pendingRequestType = type;

            stockfish.postMessage(`position fen ${fen}`);

            let depth = 10;
            if (difficulty === 'Easy') depth = 1;
            if (difficulty === 'Medium') depth = 5;
            if (difficulty === 'Hard') depth = 15;

            console.log('[Worker] Requesting', type, 'at depth', depth);
            stockfish.postMessage(`go depth ${depth}`);
        }

        if (type === 'analyze') {
            pendingRequestType = null; // Clear any stale request type

            const game = new Chess(fen);
            let uciMove = move;
            try {
                const m = game.move(move);
                if (m) {
                    uciMove = m.from + m.to + (m.promotion || '');
                }
            } catch (e) {
                console.error('[Worker] Failed to convert move to UCI:', e);
            }

            pendingAnalysis = {
                fen,
                playedMove: uciMove,
                playedMoveSan: move,
                step: 'find_best'
            };

            console.log('[Worker] Starting analysis for move:', move);
            stockfish.postMessage(`position fen ${fen}`);
            stockfish.postMessage(`go depth 10`);
        }
    };

    // Trigger the flush sequence
    queuedCommand = command;
    isFlushing = true;
    stockfish.postMessage('stop');
    stockfish.postMessage('isready');
};

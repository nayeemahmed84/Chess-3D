/* eslint-disable no-restricted-globals */
/// <reference lib="webworker" />

let engine: Worker | null = null;

self.onmessage = (e: MessageEvent) => {
    const { type, data } = e.data;

    console.log('[Stockfish Worker] Received message:', type, data);

    switch (type) {
        case 'init':
            initializeEngine();
            break;
        case 'position':
            if (engine) {
                engine.postMessage(`position ${data}`);
            } else {
                console.error('[Stockfish Worker] Engine not initialized for position command');
            }
            break;
        case 'go':
            if (engine) {
                engine.postMessage(`go ${data}`);
            } else {
                console.error('[Stockfish Worker] Engine not initialized for go command');
            }
            break;
        case 'stop':
            if (engine) {
                engine.postMessage('stop');
            }
            break;
        case 'quit':
            if (engine) {
                engine.postMessage('quit');
                engine.terminate();
                engine = null;
            }
            break;
    }
};

function initializeEngine() {
    if (engine) return;

    try {
        console.log('[Stockfish Worker] Initializing Stockfish nested worker...');
        // Use stockfish.wasm.js directly as a nested worker
        engine = new Worker('/stockfish/stockfish.wasm.js');

        engine.onerror = (err) => {
            console.error('[Stockfish Worker] Nested worker error:', err);
            self.postMessage({ type: 'error', error: 'Stockfish worker error' });
        };

        engine.onmessage = (e: MessageEvent) => {
            const line = e.data;
            // console.log('[Stockfish Engine]', line); // Uncomment for verbose logs

            if (typeof line !== 'string') return;

            if (line.startsWith('bestmove')) {
                const move = line.split(' ')[1];
                self.postMessage({ type: 'bestmove', move });
            } else if (line.startsWith('info') && line.includes('score')) {
                parseEvaluation(line);
            } else if (line.includes('uciok')) {
                self.postMessage({ type: 'ready' });
            }
        };

        engine.postMessage('uci');
    } catch (error) {
        console.error('[Stockfish Worker] Failed to initialize nested worker:', error);
        self.postMessage({ type: 'error', error: 'Failed to create Stockfish worker' });
    }
}

function parseEvaluation(line: string) {
    const parts = line.split(' ');
    let scoreIndex = parts.indexOf('score');

    if (scoreIndex !== -1) {
        const type = parts[scoreIndex + 1]; // 'cp' or 'mate'
        const value = parseInt(parts[scoreIndex + 2]);

        self.postMessage({
            type: 'evaluation',
            data: {
                type,
                value,
                raw: line
            }
        });
    }
}

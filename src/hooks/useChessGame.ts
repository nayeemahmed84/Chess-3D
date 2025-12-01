import { useState, useCallback, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';

export interface PieceState {
    id: string;
    type: string;
    color: 'w' | 'b';
    square: Square;
    isCaptured?: boolean;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

const PIECE_VALUES: Record<string, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0, // King value not needed for material sum usually, or set high
};

const evaluateBoard = (game: Chess): number => {
    let score = 0;
    const board = game.board();
    for (const row of board) {
        for (const piece of row) {
            if (piece) {
                const value = PIECE_VALUES[piece.type] || 0;
                score += piece.color === 'w' ? value : -value;
            }
        }
    }
    return score;
};



export const useChessGame = () => {
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState(game.fen());
    const [turn, setTurn] = useState(game.turn());
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [pieces, setPieces] = useState<PieceState[]>([]);
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const [history, setHistory] = useState<string[]>([]);
    const [undoneMoves, setUndoneMoves] = useState<string[]>([]); // Stack for redo
    const [evaluation, setEvaluation] = useState(0);

    // Gameplay improvements state
    const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square; color: 'w' | 'b' } | null>(null);
    const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
    const [checkSquare, setCheckSquare] = useState<Square | null>(null);

    // Timer state (in seconds) - Default 10 minutes
    const [whiteTime, setWhiteTime] = useState(600);
    const [blackTime, setBlackTime] = useState(600);
    const [timerActive, setTimerActive] = useState(false);

    // Play as Black state
    const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
    const [worker, setWorker] = useState<Worker | null>(null);

    // Initialize Web Worker
    useEffect(() => {
        const newWorker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), { type: 'module' });
        setWorker(newWorker);
        return () => newWorker.terminate();
    }, []);

    // Audio assets
    const moveSoundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-quick-win-video-game-notification-269.wav';
    const captureSoundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-226.wav';
    const checkmateSoundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-over-213.wav';
    const checkSoundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-game-notification-wave-alarm-987.wav';

    const playSound = (url: string) => {
        const audio = new Audio(url);
        audio.volume = 0.5;
        audio.play().catch(() => { });
    };

    // Initialize pieces with stable IDs
    useEffect(() => {
        const initialPieces: PieceState[] = [];
        const board = game.board();
        let idCounter = 0;
        board.forEach((row) => {
            row.forEach((piece) => {
                if (piece) {
                    initialPieces.push({
                        id: `${piece.type}-${piece.color}-${idCounter++}`,
                        type: piece.type,
                        color: piece.color,
                        square: piece.square,
                    });
                }
            });
        });
        setPieces(initialPieces);
        setEvaluation(evaluateBoard(game));
    }, []);

    // Timer Logic
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        let lastTime = Date.now();

        if (timerActive && !isGameOver) {
            interval = setInterval(() => {
                const now = Date.now();
                const delta = (now - lastTime) / 1000;
                lastTime = now;

                if (turn === 'w') {
                    setWhiteTime((prev) => {
                        const newVal = prev - delta;
                        if (newVal <= 0) {
                            setIsGameOver(true);
                            setWinner('Black');
                            setTimerActive(false);
                            return 0;
                        }
                        return newVal;
                    });
                } else {
                    setBlackTime((prev) => {
                        const newVal = prev - delta;
                        if (newVal <= 0) {
                            setIsGameOver(true);
                            setWinner('White');
                            setTimerActive(false);
                            return 0;
                        }
                        return newVal;
                    });
                }
            }, 100);
        }
        return () => clearInterval(interval);
    }, [timerActive, turn, isGameOver]);

    // Update pieces helper (reused for move, undo, redo)
    const syncPiecesWithBoard = (currentBoard: ReturnType<Chess['board']>) => {
        setPieces(() => {
            const newPieces: PieceState[] = [];
            let idCounter = 0;
            currentBoard.forEach((row) => {
                row.forEach((piece) => {
                    if (piece) {
                        newPieces.push({
                            id: `${piece.type}-${piece.color}-${idCounter++}`,
                            type: piece.type,
                            color: piece.color,
                            square: piece.square,
                        });
                    }
                });
            });
            return newPieces;
        });
    };

    const updatePieces = (move: Move) => {
        setPieces((prevPieces) => {
            const newPieces = [...prevPieces];

            // 1. Handle Capture
            if (move.captured) {
                let capturedSquare = move.to;
                if (move.flags.includes('e')) { // En passant
                    const file = move.to[0];
                    const rank = move.from[1];
                    capturedSquare = (file + rank) as Square;
                }

                const capturedIndex = newPieces.findIndex(p => p.square === capturedSquare && !p.isCaptured);
                if (capturedIndex !== -1) {
                    newPieces[capturedIndex] = { ...newPieces[capturedIndex], isCaptured: true };
                    setTimeout(() => {
                        setPieces(current => current.filter(p => p.id !== newPieces[capturedIndex].id));
                    }, 500);
                }
            }

            // 2. Move the piece
            const pieceIndex = newPieces.findIndex(p => p.square === move.from && !p.isCaptured);
            if (pieceIndex !== -1) {
                newPieces[pieceIndex] = {
                    ...newPieces[pieceIndex],
                    square: move.to,
                    type: move.promotion ? move.promotion : newPieces[pieceIndex].type
                };
            }

            // 3. Handle Castling
            if (move.flags.includes('k') || move.flags.includes('q')) {
                let rookFrom: Square | null = null;
                let rookTo: Square | null = null;

                if (move.color === 'w') {
                    if (move.flags.includes('k')) { rookFrom = 'h1'; rookTo = 'f1'; }
                    if (move.flags.includes('q')) { rookFrom = 'a1'; rookTo = 'd1'; }
                } else {
                    if (move.flags.includes('k')) { rookFrom = 'h8'; rookTo = 'f8'; }
                    if (move.flags.includes('q')) { rookFrom = 'a8'; rookTo = 'd8'; }
                }

                if (rookFrom && rookTo) {
                    const rookIndex = newPieces.findIndex(p => p.square === rookFrom && !p.isCaptured);
                    if (rookIndex !== -1) {
                        newPieces[rookIndex] = {
                            ...newPieces[rookIndex],
                            square: rookTo
                        };
                    }
                }
            }

            return newPieces;
        });
    };

    const handleMoveSound = (move: Move, newGame: Chess) => {
        if (newGame.isCheckmate()) {
            playSound(checkmateSoundUrl);
        } else if (newGame.isCheck()) {
            playSound(checkSoundUrl);
        } else if (move.captured) {
            playSound(captureSoundUrl);
        } else {
            playSound(moveSoundUrl);
        }
    };

    const makeMove = useCallback((from: Square, to: Square, promotion: string = 'q', isAI = false) => {
        try {
            const gameCopy = new Chess();
            gameCopy.loadPgn(game.pgn());

            // Check for promotion
            const piece = gameCopy.get(from);
            if (
                !isAI &&
                piece?.type === 'p' &&
                ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'))
            ) {
                setPromotionPending({ from, to, color: piece.color });
                return false; // Wait for user selection
            }

            const move = gameCopy.move({ from, to, promotion });

            if (move) {
                updatePieces(move);
                setGame(gameCopy);
                setFen(gameCopy.fen());
                setTurn(gameCopy.turn());
                console.log("[MakeMove] Turn changed to:", gameCopy.turn());
                setHistory(gameCopy.history());
                setUndoneMoves([]); // Clear redo stack on new move
                setEvaluation(evaluateBoard(gameCopy));
                setTimerActive(true); // Start timer on first move

                // Update visual hints
                setLastMove({ from, to });
                setCheckSquare(gameCopy.inCheck() ? gameCopy.board().flat().find(p => p?.type === 'k' && p.color === gameCopy.turn())?.square as Square : null);

                handleMoveSound(move, gameCopy);

                if (gameCopy.isGameOver()) {
                    setIsGameOver(true);
                    setTimerActive(false);
                    if (gameCopy.isCheckmate()) {
                        setWinner(gameCopy.turn() === 'w' ? 'Black' : 'White');
                    } else {
                        setWinner('Draw');
                    }
                }
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }, [game]);

    const onPromotionSelect = useCallback((pieceType: string) => {
        if (promotionPending) {
            makeMove(promotionPending.from, promotionPending.to, pieceType, true); // Treat as AI move to bypass check
            setPromotionPending(null);
        }
    }, [promotionPending, makeMove]);

    const undoMove = useCallback(() => {
        console.log("Undo called. Current turn:", game.turn(), "History:", game.history().length);
        const gameCopy = new Chess();
        gameCopy.loadPgn(game.pgn());
        const move1 = gameCopy.undo();
        console.log("Undo 1 result:", move1);
        let move2: Move | null = null;

        if (move1) {
            // If we just undid an AI move, we must also undo Player's move
            if (move1.color !== playerColor) {
                move2 = gameCopy.undo();
                console.log("Undo 2 result (AI compensation):", move2);
            }

            setGame(gameCopy);
            setFen(gameCopy.fen());
            setTurn(gameCopy.turn());
            setHistory(gameCopy.history());

            setUndoneMoves(prev => {
                const newMoves = [...prev];
                if (move1) newMoves.unshift(move1.san);
                if (move2) newMoves.unshift(move2.san);
                return newMoves;
            });

            setEvaluation(evaluateBoard(gameCopy));
            syncPiecesWithBoard(gameCopy.board());

            // Update visual hints
            const hist = gameCopy.history({ verbose: true });
            if (hist.length > 0) {
                const lastHistMove = hist[hist.length - 1];
                setLastMove({ from: lastHistMove.from, to: lastHistMove.to });
            } else {
                setLastMove(null);
            }
            setCheckSquare(gameCopy.inCheck() ? gameCopy.board().flat().find(p => p?.type === 'k' && p.color === gameCopy.turn())?.square as Square : null);

            if (isGameOver) {
                setIsGameOver(false);
                setWinner(null);
                setTimerActive(true);
            }
        }
    }, [game, isGameOver, playerColor]);

    const redoMove = useCallback(() => {
        console.log("Redo called. Stack:", undoneMoves);
        if (undoneMoves.length === 0) return;

        const moveSan = undoneMoves[0];
        console.log("Redoing move:", moveSan);
        const gameCopy = new Chess();
        gameCopy.loadPgn(game.pgn());
        const move = gameCopy.move(moveSan);

        if (move) {
            // Double redo logic
            if (move.color === playerColor && undoneMoves.length > 1) {
                const nextMoveSan = undoneMoves[1];
                const move2 = gameCopy.move(nextMoveSan);
                if (move2) {
                    setUndoneMoves(prev => prev.slice(2));
                } else {
                    setUndoneMoves(prev => prev.slice(1));
                }
            } else {
                setUndoneMoves(prev => prev.slice(1));
            }

            setGame(gameCopy);
            setFen(gameCopy.fen());
            setTurn(gameCopy.turn());
            setHistory(gameCopy.history());
            setEvaluation(evaluateBoard(gameCopy));
            syncPiecesWithBoard(gameCopy.board());
            handleMoveSound(move, gameCopy);
        }
    }, [game, undoneMoves, playerColor]);

    const makeAIMove = useCallback(() => {
        if (game.turn() === playerColor || isGameOver || !worker) return;

        // Post message to worker
        worker.postMessage({
            fen: game.fen(),
            pgn: game.pgn(),
            difficulty
        });

        // Handle response
        worker.onmessage = (e) => {
            const bestMove = e.data;
            if (bestMove) {
                if (typeof bestMove === 'object') {
                    makeMove(bestMove.from, bestMove.to, bestMove.promotion || 'q', true);
                } else if (typeof bestMove === 'string') {
                    const move = game.move(bestMove);
                    game.undo();
                    if (move) {
                        makeMove(move.from, move.to, move.promotion, true);
                    }
                }
            }
        };
    }, [game, playerColor, isGameOver, worker, difficulty, makeMove]);

    // AI Move Effect - White always moves first (standard chess)
    useEffect(() => {
        const isAITurn = !isGameOver && game.turn() !== playerColor;
        const canAIMove = game.history().length > 0 || (playerColor === 'b' && game.history().length === 0);

        if (isAITurn && canAIMove) {
            const timer = setTimeout(makeAIMove, 500);
            return () => clearTimeout(timer);
        }
    }, [game, isGameOver, playerColor, makeAIMove]);

    const resetGame = useCallback(() => {
        const newGame = new Chess();
        setGame(newGame);
        setFen(newGame.fen());
        setTurn(newGame.turn());
        setIsGameOver(false);
        setWinner(null);
        setHistory([]);
        setUndoneMoves([]);
        setEvaluation(0);
        setLastMove(null);
        setCheckSquare(null);
        setPromotionPending(null);
        setWhiteTime(600);
        setBlackTime(600);
        setTimerActive(false);

        const initialPieces: PieceState[] = [];
        const board = newGame.board();
        let idCounter = 0;
        board.forEach((row) => {
            row.forEach((piece) => {
                if (piece) {
                    initialPieces.push({
                        id: `${piece.type}-${piece.color}-${idCounter++}`,
                        type: piece.type,
                        color: piece.color,
                        square: piece.square,
                    });
                }
            });
        });
        setPieces(initialPieces);

    }, []);

    const getPossibleMoves = useCallback((square: Square) => {
        return game.moves({ square, verbose: true }).map((move) => move.to);
    }, [game]);

    return {
        game,
        fen,
        turn,
        isGameOver,
        winner,
        pieces,
        difficulty,
        history,
        evaluation,
        whiteTime,
        blackTime,
        promotionPending,
        lastMove,
        checkSquare,
        setDifficulty,
        makeMove,
        onPromotionSelect,
        undoMove,
        redoMove,
        resetGame,
        getPossibleMoves,
        playerColor,
        setPlayerColor,
    };
};

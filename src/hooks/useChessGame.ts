import { useState, useCallback, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import moveSoundUrl from '../assets/sounds/move.mp3';
import captureSoundUrl from '../assets/sounds/capture.mp3';
import checkmateSoundUrl from '../assets/sounds/checkmate.mp3';

export interface PieceState {
    id: string;
    type: string;
    color: 'w' | 'b';
    square: Square;
    isCaptured?: boolean;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface SavedGame {
    fen: string;
    pgn: string; // To restore history properly
    turn: 'w' | 'b';
    isGameOver: boolean;
    winner: string | null;
    difficulty: Difficulty;
    history: string[];
    undoneMoves: string[];
    evaluation: number;
    whiteTime: number;
    blackTime: number;
    playerColor: 'w' | 'b';
    volume: number;
    isMuted: boolean;
}

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
    const [hintMove, setHintMove] = useState<{ from: Square; to: Square } | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [showThreats, setShowThreats] = useState(false);
    const [attackedSquares, setAttackedSquares] = useState<Square[]>([]);
    const [hasSavedGame, setHasSavedGame] = useState(false);
    const [annotations, setAnnotations] = useState<Record<number, string>>({});

    // Volume state
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

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



    // Audio assets are imported at the top of the file

    const playSound = (url: string) => {
        if (isMuted) return;
        const audio = new Audio(url);
        audio.volume = volume;
        audio.play().catch(() => { });
    };

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

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

        // Check for saved games in any slot on mount
        const hasAnySave = Array.from({ length: 5 }, (_, i) =>
            localStorage.getItem(`chess_save_slot_${i}`)
        ).some(save => save !== null);
        setHasSavedGame(hasAnySave);
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
            playSound(moveSoundUrl); // Using move sound for check
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

                if (worker) {
                    worker.postMessage({
                        fen: game.fen(), // State before move
                        move: move.san,
                        type: 'analyze'
                    });
                }

                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }, [game, worker]);

    const handleWorkerMessage = useCallback((e: MessageEvent) => {
        console.log('Main thread received from worker:', e.data);
        const { type, move: bestMove, moveSan, annotation } = e.data;

        if (type === 'analysis') {
            if (moveSan && annotation) {
                setAnnotations(prev => ({
                    ...prev,
                    [game.history().length - 1]: annotation
                }));
            }
            return;
        }

        if (type === 'hint') {
            if (bestMove) {
                let from: Square | undefined;
                let to: Square | undefined;

                if (typeof bestMove === 'string') {
                    if (bestMove.length >= 4) {
                        from = bestMove.substring(0, 2) as Square;
                        to = bestMove.substring(2, 4) as Square;
                    }
                } else if (typeof bestMove === 'object') {
                    from = bestMove.from;
                    to = bestMove.to;
                }

                if (from && to) {
                    // Validate that the hint is legal for the current board state
                    // This prevents stale hints from showing up
                    const piece = game.get(from);
                    if (piece && piece.color === game.turn()) {
                        setHintMove({ from, to });
                    } else {
                        console.warn('[Hook] Ignored invalid hint:', from, to, 'Piece:', piece);
                    }
                }
            }
            return;
        }

        if (type === 'move') {
            if (bestMove) {
                // Only process AI moves when it's actually the AI's turn
                // This prevents the AI from playing both sides
                if (game.turn() === playerColor) {
                    console.log('[Hook] Ignoring AI move - it is the player\'s turn');
                    return;
                }

                let from: Square | undefined;
                let to: Square | undefined;
                let promotion = 'q';

                if (typeof bestMove === 'string') {
                    if (bestMove.length >= 4) {
                        from = bestMove.substring(0, 2) as Square;
                        to = bestMove.substring(2, 4) as Square;
                        if (bestMove.length === 5) {
                            promotion = bestMove[4];
                        }
                    }
                } else if (typeof bestMove === 'object') {
                    from = bestMove.from;
                    to = bestMove.to;
                    promotion = bestMove.promotion || 'q';
                }

                if (from && to) {
                    console.log('[Hook] Making AI move:', from, to);
                    makeMove(from, to, promotion, true);
                }
            }
        }
    }, [game, makeMove]);

    useEffect(() => {
        if (worker) {
            worker.onmessage = handleWorkerMessage;
        }
    }, [worker, handleWorkerMessage]);

    // Calculate attacked squares whenever game state changes or showThreats changes
    useEffect(() => {
        if (!showThreats) {
            setAttackedSquares([]);
            return;
        }

        const squares: Square[] = [];
        const opponentColor = game.turn() === 'w' ? 'b' : 'w';

        // Iterate over all squares to check if they are attacked by opponent
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        for (let rank = 1; rank <= 8; rank++) {
            for (const file of files) {
                const square = `${file}${rank}` as Square;
                try {
                    // @ts-ignore
                    if (game.isAttacked(square, opponentColor)) {
                        squares.push(square);
                    }
                } catch (e) {
                    // Fallback or ignore if method doesn't exist
                }
            }
        }
        setAttackedSquares(squares);
    }, [game, showThreats, fen]);

    const requestHint = useCallback(() => {
        setShowHint(prev => !prev);
    }, []);

    // Auto-update hint when game state changes or showHint is toggled
    useEffect(() => {
        if (showHint && !isGameOver && worker && game.turn() === playerColor) {
            worker.postMessage({
                fen: game.fen(),
                pgn: game.pgn(),
                difficulty: 'Hard',
                type: 'hint'
            });
        } else {
            setHintMove(null);
        }
    }, [showHint, game, isGameOver, worker, playerColor]);

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
            difficulty,
            type: 'move'
        });
    }, [game, playerColor, isGameOver, worker, difficulty]);

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
        setHintMove(null);
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

    const saveGame = useCallback((slotIndex: number = 0) => {
        const gameState: SavedGame = {
            fen: game.fen(),
            pgn: game.pgn(),
            turn: game.turn(),
            isGameOver,
            winner,
            difficulty,
            history,
            undoneMoves,
            evaluation,
            whiteTime,
            blackTime,
            playerColor,
            volume,
            isMuted
        };

        // Add metadata
        const savedGame = {
            ...gameState,
            savedAt: Date.now(),
            moveCount: history.length
        };

        localStorage.setItem(`chess_save_slot_${slotIndex}`, JSON.stringify(savedGame));

        // Update hasSavedGame flag
        const hasAnySave = Array.from({ length: 5 }, (_, i) =>
            localStorage.getItem(`chess_save_slot_${i}`)
        ).some(save => save !== null);
        setHasSavedGame(hasAnySave);

        return true;
    }, [game, isGameOver, winner, difficulty, history, undoneMoves, evaluation, whiteTime, blackTime, playerColor, volume, isMuted]);

    const loadGame = useCallback((slotIndex: number = 0) => {
        const savedData = localStorage.getItem(`chess_save_slot_${slotIndex}`);
        if (!savedData) return false;

        try {
            const state: SavedGame = JSON.parse(savedData);

            // Restore Game Logic
            const loadedGame = new Chess();
            loadedGame.loadPgn(state.pgn);
            if (state.pgn === '') loadedGame.load(state.fen);

            setGame(loadedGame);
            setFen(loadedGame.fen());
            setTurn(loadedGame.turn());
            setIsGameOver(state.isGameOver);
            setWinner(state.winner);
            setDifficulty(state.difficulty);
            setHistory(state.history);
            setUndoneMoves(state.undoneMoves);
            setEvaluation(state.evaluation);
            setWhiteTime(state.whiteTime);
            setBlackTime(state.blackTime);
            setPlayerColor(state.playerColor);
            setVolume(state.volume);
            setIsMuted(state.isMuted);

            // Restore Pieces Visuals
            syncPiecesWithBoard(loadedGame.board());

            // Restore Timer State
            setTimerActive(!state.isGameOver);

            // Clear any pending states
            setLastMove(null);
            setCheckSquare(null);
            setHintMove(null);
            setPromotionPending(null);

            return true;
        } catch (e) {
            console.error("Failed to load game", e);
            return false;
        }
    }, []);

    const deleteSave = useCallback((slotIndex: number) => {
        localStorage.removeItem(`chess_save_slot_${slotIndex}`);

        // Update hasSavedGame flag
        const hasAnySave = Array.from({ length: 5 }, (_, i) =>
            localStorage.getItem(`chess_save_slot_${i}`)
        ).some(save => save !== null);
        setHasSavedGame(hasAnySave);
    }, []);

    const navigateToMove = useCallback((moveIndex: number) => {
        const gameCopy = new Chess();
        const moves = game.history({ verbose: true });

        // Replay moves up to the specified index
        for (let i = 0; i <= moveIndex && i < moves.length; i++) {
            gameCopy.move(moves[i].san);
        }

        setFen(gameCopy.fen());
        syncPiecesWithBoard(gameCopy.board());

        // Update visual hints
        if (moveIndex >= 0 && moveIndex < moves.length) {
            const move = moves[moveIndex];
            setLastMove({ from: move.from, to: move.to });
        } else {
            setLastMove(null);
        }

        setCheckSquare(gameCopy.inCheck() ? gameCopy.board().flat().find(p => p?.type === 'k' && p.color === gameCopy.turn())?.square as Square : null);
    }, [game]);

    const importPGN = useCallback((pgn: string) => {
        try {
            const newGame = new Chess();
            newGame.loadPgn(pgn);

            setGame(newGame);
            setFen(newGame.fen());
            setTurn(newGame.turn());
            setHistory(newGame.history());
            setUndoneMoves([]);
            setEvaluation(evaluateBoard(newGame));

            // Reset game state
            setIsGameOver(newGame.isGameOver());
            if (newGame.isGameOver()) {
                setTimerActive(false);
                if (newGame.isCheckmate()) {
                    setWinner(newGame.turn() === 'w' ? 'Black' : 'White');
                } else {
                    setWinner('Draw');
                }
            } else {
                setWinner(null);
                setTimerActive(false); // Don't auto-start timer for imported games
            }

            // Update pieces
            syncPiecesWithBoard(newGame.board());

            // Clear visual hints
            setLastMove(null);
            setCheckSquare(newGame.inCheck() ? newGame.board().flat().find(p => p?.type === 'k' && p.color === newGame.turn())?.square as Square : null);
            setHintMove(null);
            setPromotionPending(null);

            return true;
        } catch (e) {
            console.error("Failed to import PGN", e);
            return false;
        }
    }, []);

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
        hintMove,
        showHint,
        showThreats,
        setShowThreats,
        attackedSquares,
        requestHint,
        volume,
        setVolume,
        isMuted,
        toggleMute,
        saveGame,
        loadGame,
        deleteSave,
        hasSavedGame,
        annotations,
        navigateToMove,
        importPGN
    };
};

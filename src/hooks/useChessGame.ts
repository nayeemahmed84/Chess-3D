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
                score += piece.color === 'b' ? value : -value;
            }
        }
    }
    return score;
};

const getBestMove = (game: Chess, difficulty: Difficulty): string | Move | null => {
    const possibleMoves = game.moves({ verbose: true });
    if (possibleMoves.length === 0) return null;

    if (difficulty === 'Easy') {
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    if (difficulty === 'Medium') {
        // Prioritize captures
        const captures = possibleMoves.filter(move => move.captured);
        if (captures.length > 0) {
            // Pick random capture for now, or maybe the one that captures highest value?
            // Let's pick the one that captures the highest value piece
            captures.sort((a, b) => {
                const valA = PIECE_VALUES[a.captured || 'p'] || 0;
                const valB = PIECE_VALUES[b.captured || 'p'] || 0;
                return valB - valA;
            });
            return captures[0];
        }
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    if (difficulty === 'Hard') {
        // Minimax depth 2
        let bestMove = null;
        let bestValue = -Infinity;

        // We need to clone for simulation to not mess up the current game state passed in
        // But game.move() mutates. We can undo().

        for (const move of possibleMoves) {
            game.move(move);
            const boardValue = minimax(game, 1, false); // Depth 1 means we look at opponent's response
            game.undo();

            if (boardValue > bestValue) {
                bestValue = boardValue;
                bestMove = move;
            }
        }
        return bestMove || possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    return null;
};

const minimax = (game: Chess, depth: number, isMaximizingPlayer: boolean): number => {
    if (depth === 0 || game.isGameOver()) {
        return evaluateBoard(game);
    }

    const moves = game.moves();

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of moves) {
            game.move(move);
            const evalScore = minimax(game, depth - 1, false);
            game.undo();
            maxEval = Math.max(maxEval, evalScore);
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            game.move(move);
            const evalScore = minimax(game, depth - 1, true);
            game.undo();
            minEval = Math.min(minEval, evalScore);
        }
        return minEval;
    }
};

export const useChessGame = () => {
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState(game.fen());
    const [turn, setTurn] = useState(game.turn());
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [pieces, setPieces] = useState<PieceState[]>([]);
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');

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
    }, []);

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
                    // Mark as captured instead of removing immediately
                    newPieces[capturedIndex] = { ...newPieces[capturedIndex], isCaptured: true };

                    // Schedule removal
                    setTimeout(() => {
                        setPieces(current => current.filter(p => p.id !== newPieces[capturedIndex].id));
                    }, 500); // 500ms animation duration
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

    const makeMove = useCallback((from: Square, to: Square, promotion: string = 'q') => {
        try {
            const gameCopy = new Chess(game.fen());
            const move = gameCopy.move({ from, to, promotion });

            if (move) {
                updatePieces(move);
                setGame(gameCopy);
                setFen(gameCopy.fen());
                setTurn(gameCopy.turn());

                handleMoveSound(move, gameCopy);

                if (gameCopy.isGameOver()) {
                    setIsGameOver(true);
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

    const makeAIMove = useCallback(() => {
        if (turn !== 'b' || isGameOver) return;

        // Clone game for AI calculation
        const gameCopy = new Chess(game.fen());

        // Get best move based on difficulty
        const bestMove = getBestMove(gameCopy, difficulty);

        if (!bestMove) return;

        const move = gameCopy.move(bestMove);

        if (move) {
            updatePieces(move);
            setGame(gameCopy);
            setFen(gameCopy.fen());
            setTurn(gameCopy.turn());

            handleMoveSound(move, gameCopy);

            if (gameCopy.isGameOver()) {
                setIsGameOver(true);
                if (gameCopy.isCheckmate()) {
                    setWinner(gameCopy.turn() === 'w' ? 'Black' : 'White');
                } else {
                    setWinner('Draw');
                }
            }
        }
    }, [game, turn, isGameOver, difficulty]);

    useEffect(() => {
        if (turn === 'b' && !isGameOver) {
            const timer = setTimeout(() => {
                makeAIMove();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [turn, isGameOver, makeAIMove]);

    const resetGame = useCallback(() => {
        const newGame = new Chess();
        setGame(newGame);
        setFen(newGame.fen());
        setTurn(newGame.turn());
        setIsGameOver(false);
        setWinner(null);

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
        setDifficulty,
        makeMove,
        resetGame,
        getPossibleMoves,
    };
};

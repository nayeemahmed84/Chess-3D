import { Chess, Move } from 'chess.js';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

const PIECE_VALUES: Record<string, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0,
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
        // Minimax depth 3
        const isWhiteTurn = game.turn() === 'w';
        let bestMoveFound = null;

        if (isWhiteTurn) {
            let maxEval = -Infinity;
            for (const move of possibleMoves) {
                game.move(move);
                const evalScore = minimax(game, 2, false); // Depth 2 recursive calls
                game.undo();
                if (evalScore > maxEval) {
                    maxEval = evalScore;
                    bestMoveFound = move;
                }
            }
        } else {
            let minEval = Infinity;
            for (const move of possibleMoves) {
                game.move(move);
                const evalScore = minimax(game, 2, true); // Depth 2 recursive calls
                game.undo();
                if (evalScore < minEval) {
                    minEval = evalScore;
                    bestMoveFound = move;
                }
            }
        }

        return bestMoveFound || possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    return null;
};

self.onmessage = (e: MessageEvent) => {
    const { fen, difficulty } = e.data;
    const game = new Chess(fen); // Note: History lost here, but fine for AI calculation usually (except 3-fold)
    // If we want 3-fold repetition detection in AI, we need history.
    // But sending full history to worker is easy.
    // Let's accept PGN?
    // e.data.pgn

    if (e.data.pgn) {
        game.loadPgn(e.data.pgn);
    }

    const bestMove = getBestMove(game, difficulty);
    self.postMessage(bestMove);
};

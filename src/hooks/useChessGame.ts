import { useState, useCallback, useEffect } from 'react';
import { Chess, Square } from 'chess.js';

export const useChessGame = () => {
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState(game.fen());
    const [turn, setTurn] = useState(game.turn());
    const [isGameOver, setIsGameOver] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);

    // Audio assets (replace URLs with local files if desired)
    const moveSoundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-quick-win-video-game-notification-269.wav';
    const captureSoundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-226.wav';
    const checkmateSoundUrl = 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-over-213.wav';

    const playSound = (url: string) => {
        const audio = new Audio(url);
        audio.play().catch(() => { });
    };

    // Human (white) move
    const makeMove = useCallback((from: Square, to: Square, promotion: string = 'q') => {
        try {
            const move = game.move({ from, to, promotion });
            if (move) {
                // Play appropriate sound
                if ((move as any).captured) {
                    playSound(captureSoundUrl);
                } else {
                    playSound(moveSoundUrl);
                }
                setFen(game.fen());
                setTurn(game.turn());
                if (game.isGameOver()) {
                    setIsGameOver(true);
                    if (game.isCheckmate()) {
                        setWinner(game.turn() === 'w' ? 'Black' : 'White');
                        playSound(checkmateSoundUrl);
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

    // Simple AI for black: random legal move
    const makeAIMove = useCallback(() => {
        if (turn !== 'b' || isGameOver) return;
        const possible = game.moves({ verbose: true });
        if (possible.length === 0) return;
        const randomMove = possible[Math.floor(Math.random() * possible.length)];
        const move = game.move(randomMove);
        // Play sound for AI move
        if ((move as any).captured) {
            playSound(captureSoundUrl);
        } else {
            playSound(moveSoundUrl);
        }
        setFen(game.fen());
        setTurn(game.turn());
        if (game.isGameOver()) {
            setIsGameOver(true);
            if (game.isCheckmate()) {
                setWinner(game.turn() === 'w' ? 'Black' : 'White');
                playSound(checkmateSoundUrl);
            } else {
                setWinner('Draw');
            }
        }
    }, [game, turn, isGameOver]);

    // Trigger AI after human move when it's black's turn
    useEffect(() => {
        if (turn === 'b' && !isGameOver) {
            const timer = setTimeout(() => {
                makeAIMove();
            }, 500);
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
        makeMove,
        resetGame,
        getPossibleMoves,
    };
};

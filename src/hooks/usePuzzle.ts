// Puzzle Mode Hook - Manages puzzle state and solving logic

import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import {
    Puzzle,
    puzzles,
    getPuzzlesByTheme,
    PuzzleTheme,
    getDifficultyForRating,
    difficultyLevels
} from '../data/puzzleData';
import {
    loadTrainingStats,
    updatePuzzleStats,
    TrainingStats
} from '../data/trainingStats';

// Sound URLs
import moveSoundUrl from '../assets/sounds/move.mp3';
import captureSoundUrl from '../assets/sounds/capture.mp3';
import checkmateSoundUrl from '../assets/sounds/checkmate.mp3';

export type PuzzleStatus = 'ready' | 'playing' | 'correct' | 'incorrect' | 'completed';

export interface PuzzleState {
    puzzle: Puzzle | null;
    currentMoveIndex: number;
    status: PuzzleStatus;
    game: Chess;
    showHint: boolean;
    attempts: number;
    startTime: number;
}

export interface PuzzleFilters {
    theme?: PuzzleTheme;
    difficulty?: keyof typeof difficultyLevels;
}

export function usePuzzle() {
    const [puzzleList, setPuzzleList] = useState<Puzzle[]>(puzzles);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [state, setState] = useState<PuzzleState>({
        puzzle: null,
        currentMoveIndex: 0,
        status: 'ready',
        game: new Chess(),
        showHint: false,
        attempts: 0,
        startTime: Date.now()
    });
    const [stats, setStats] = useState<TrainingStats>(loadTrainingStats());
    const [filters, setFilters] = useState<PuzzleFilters>({});
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [validMoves, setValidMoves] = useState<Square[]>([]);
    const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
    const [isCorrectMove, setIsCorrectMove] = useState<boolean | null>(null);

    // Audio refs
    const moveSoundRef = useRef<HTMLAudioElement | null>(null);
    const captureSoundRef = useRef<HTMLAudioElement | null>(null);
    const successSoundRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio
    useEffect(() => {
        moveSoundRef.current = new Audio(moveSoundUrl);
        captureSoundRef.current = new Audio(captureSoundUrl);
        successSoundRef.current = new Audio(checkmateSoundUrl);
    }, []);

    const playSound = useCallback((type: 'move' | 'capture' | 'success') => {
        const sound = type === 'move' ? moveSoundRef.current
            : type === 'capture' ? captureSoundRef.current
                : successSoundRef.current;
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => { });
        }
    }, []);

    // Apply filters to puzzle list
    const applyFilters = useCallback((newFilters: PuzzleFilters) => {
        let filtered = puzzles;

        if (newFilters.theme) {
            filtered = getPuzzlesByTheme(newFilters.theme);
        }

        if (newFilters.difficulty) {
            const { minRating, maxRating } = difficultyLevels[newFilters.difficulty];
            filtered = filtered.filter(p => p.rating >= minRating && p.rating <= maxRating);
        }

        setFilters(newFilters);
        setPuzzleList(filtered.length > 0 ? filtered : puzzles);
        setCurrentIndex(0);
    }, []);

    // Load a puzzle by index
    const loadPuzzle = useCallback((index: number) => {
        if (index < 0 || index >= puzzleList.length) return;

        const puzzle = puzzleList[index];
        const game = new Chess(puzzle.fen);

        setCurrentIndex(index);
        setState({
            puzzle,
            currentMoveIndex: 0,
            status: 'playing',
            game,
            showHint: false,
            attempts: 0,
            startTime: Date.now()
        });
        setSelectedSquare(null);
        setValidMoves([]);
        setLastMove(null);
        setIsCorrectMove(null);
    }, [puzzleList]);

    // Start first puzzle
    const startPuzzles = useCallback(() => {
        if (puzzleList.length > 0) {
            loadPuzzle(0);
        }
    }, [loadPuzzle, puzzleList]);

    // Get valid moves for a square
    const getValidMovesForSquare = useCallback((square: Square): Square[] => {
        const moves = state.game.moves({ square, verbose: true });
        return moves.map(m => m.to as Square);
    }, [state.game]);

    // Handle square selection
    const handleSquareSelect = useCallback((square: Square) => {
        if (state.status !== 'playing' || !state.puzzle) return;

        const piece = state.game.get(square);
        const playerColor = state.puzzle.playerColor;

        // If clicking on own piece, select it
        if (piece && piece.color === playerColor) {
            setSelectedSquare(square);
            setValidMoves(getValidMovesForSquare(square));
            return;
        }

        // If a piece is selected and clicking on valid move target
        if (selectedSquare && validMoves.includes(square)) {
            makeMove(selectedSquare, square);
        } else {
            // Deselect
            setSelectedSquare(null);
            setValidMoves([]);
        }
    }, [state, selectedSquare, validMoves, getValidMovesForSquare]);

    // Make a move and check if correct
    const makeMove = useCallback((from: Square, to: Square) => {
        if (state.status !== 'playing' || !state.puzzle) return;

        const expectedMove = state.puzzle.moves[state.currentMoveIndex];
        const attemptedMove = `${from}${to}`;

        // Check for promotion
        const piece = state.game.get(from);
        let promotion: string | undefined;
        if (piece?.type === 'p') {
            const toRank = to[1];
            if ((piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1')) {
                // For simplicity, auto-promote to queen (could add UI later)
                promotion = 'q';
            }
        }

        const moveWithPromotion = promotion ? `${attemptedMove}${promotion}` : attemptedMove;

        // Check if move matches expected
        const isCorrect = moveWithPromotion === expectedMove ||
            attemptedMove === expectedMove.slice(0, 4); // Handle promotion in expected

        if (isCorrect) {
            // Make the move
            try {
                const move = state.game.move({ from, to, promotion });
                if (!move) {
                    setIsCorrectMove(false);
                    return;
                }

                playSound(move.captured ? 'capture' : 'move');
                setLastMove({ from, to });
                setSelectedSquare(null);
                setValidMoves([]);
                setIsCorrectMove(true);

                const nextMoveIndex = state.currentMoveIndex + 1;

                // Check if puzzle is complete
                if (nextMoveIndex >= state.puzzle.moves.length) {
                    // Puzzle solved!
                    playSound('success');
                    const timeSpent = Date.now() - state.startTime;
                    const wasFirstTry = state.attempts === 0;
                    const newStats = updatePuzzleStats(state.puzzle.id, wasFirstTry, timeSpent);
                    setStats(newStats);

                    setState(prev => ({
                        ...prev,
                        currentMoveIndex: nextMoveIndex,
                        status: 'completed'
                    }));
                } else {
                    // Wait for opponent's response move
                    setState(prev => ({
                        ...prev,
                        currentMoveIndex: nextMoveIndex,
                        status: 'correct'
                    }));

                    // Make opponent's response after a short delay
                    setTimeout(() => {
                        if (nextMoveIndex < state.puzzle!.moves.length) {
                            const opponentMove = state.puzzle!.moves[nextMoveIndex];
                            const opFrom = opponentMove.slice(0, 2) as Square;
                            const opTo = opponentMove.slice(2, 4) as Square;
                            const opPromotion = opponentMove.length > 4 ? opponentMove[4] : undefined;

                            const opMove = state.game.move({ from: opFrom, to: opTo, promotion: opPromotion });
                            if (opMove) {
                                playSound(opMove.captured ? 'capture' : 'move');
                                setLastMove({ from: opFrom, to: opTo });

                                setState(prev => ({
                                    ...prev,
                                    currentMoveIndex: nextMoveIndex + 1,
                                    status: nextMoveIndex + 1 >= state.puzzle!.moves.length ? 'completed' : 'playing'
                                }));

                                if (nextMoveIndex + 1 >= state.puzzle!.moves.length) {
                                    playSound('success');
                                    const timeSpent = Date.now() - state.startTime;
                                    const wasFirstTry = state.attempts === 0;
                                    const newStats = updatePuzzleStats(state.puzzle!.id, wasFirstTry, timeSpent);
                                    setStats(newStats);
                                }
                            }
                        }
                    }, 500);
                }

                // Clear correct indicator after delay
                setTimeout(() => setIsCorrectMove(null), 1000);

            } catch (e) {
                console.error('Move error:', e);
            }
        } else {
            // Wrong move
            setIsCorrectMove(false);
            setState(prev => ({
                ...prev,
                attempts: prev.attempts + 1,
                status: 'incorrect'
            }));

            // Reset status after showing error
            setTimeout(() => {
                setIsCorrectMove(null);
                setState(prev => ({
                    ...prev,
                    status: 'playing'
                }));
            }, 1000);
        }
    }, [state, playSound]);

    // Show hint (first move of solution)
    const showHint = useCallback(() => {
        if (!state.puzzle || state.status !== 'playing') return;

        const expectedMove = state.puzzle.moves[state.currentMoveIndex];
        const hintFrom = expectedMove.slice(0, 2) as Square;
        const hintTo = expectedMove.slice(2, 4) as Square;

        // Highlight the hint
        setSelectedSquare(hintFrom);
        setValidMoves([hintTo]);

        setState(prev => ({
            ...prev,
            showHint: true,
            attempts: prev.attempts + 1 // Using hint counts as an attempt
        }));
    }, [state]);

    // Navigation
    const nextPuzzle = useCallback(() => {
        if (currentIndex < puzzleList.length - 1) {
            loadPuzzle(currentIndex + 1);
        }
    }, [currentIndex, loadPuzzle, puzzleList.length]);

    const prevPuzzle = useCallback(() => {
        if (currentIndex > 0) {
            loadPuzzle(currentIndex - 1);
        }
    }, [currentIndex, loadPuzzle]);

    const resetPuzzle = useCallback(() => {
        loadPuzzle(currentIndex);
    }, [currentIndex, loadPuzzle]);

    // Get current difficulty info
    const getDifficultyInfo = useCallback(() => {
        if (!state.puzzle) return null;
        const level = getDifficultyForRating(state.puzzle.rating);
        return {
            level,
            ...difficultyLevels[level]
        };
    }, [state.puzzle]);

    // Check if puzzle is solved
    const isPuzzleSolved = useCallback((puzzleId: string) => {
        return stats.puzzles.solved.includes(puzzleId);
    }, [stats]);

    return {
        // State
        puzzle: state.puzzle,
        game: state.game,
        status: state.status,
        currentMoveIndex: state.currentMoveIndex,
        attempts: state.attempts,
        showingHint: state.showHint,

        // UI state
        selectedSquare,
        validMoves,
        lastMove,
        isCorrectMove,

        // Navigation
        currentIndex,
        totalPuzzles: puzzleList.length,
        hasNext: currentIndex < puzzleList.length - 1,
        hasPrev: currentIndex > 0,

        // Stats
        stats,
        getDifficultyInfo,
        isPuzzleSolved,

        // Filters
        filters,
        applyFilters,

        // Actions
        startPuzzles,
        loadPuzzle,
        handleSquareSelect,
        makeMove,
        showHint,
        nextPuzzle,
        prevPuzzle,
        resetPuzzle
    };
}

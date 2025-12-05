// Training Statistics Types and Storage

export interface PuzzleStats {
    solved: string[];           // IDs of solved puzzles
    attempted: number;          // Total attempts
    correctOnFirstTry: number;  // Solved without hints/mistakes
    streak: number;             // Current correct streak
    bestStreak: number;         // Best streak ever
    totalTime: number;          // Total time spent (ms)
    lastPlayed?: string;        // ISO date string
}

export interface OpeningStats {
    practiced: string[];        // Opening names practiced
    mastered: string[];         // Openings with all moves memorized
    sessionsCompleted: number;
    lastPracticed?: string;
}

export interface EndgameStats {
    completed: string[];        // Endgame IDs completed
    bestScores: Record<string, number>; // Best move counts per endgame
    totalAttempts: number;
    lastPracticed?: string;
}

export interface TrainerStats {
    sessionsCompleted: number;
    totalPositions: number;
    correctMoves: number;
    accuracy: number;           // Percentage
    lastSession?: string;
}

export interface TrainingStats {
    puzzles: PuzzleStats;
    openings: OpeningStats;
    endgames: EndgameStats;
    trainer: TrainerStats;
    lastUpdated: string;
}

const STORAGE_KEY = 'chess_training_stats';

// Default empty stats
const defaultStats: TrainingStats = {
    puzzles: {
        solved: [],
        attempted: 0,
        correctOnFirstTry: 0,
        streak: 0,
        bestStreak: 0,
        totalTime: 0
    },
    openings: {
        practiced: [],
        mastered: [],
        sessionsCompleted: 0
    },
    endgames: {
        completed: [],
        bestScores: {},
        totalAttempts: 0
    },
    trainer: {
        sessionsCompleted: 0,
        totalPositions: 0,
        correctMoves: 0,
        accuracy: 0
    },
    lastUpdated: new Date().toISOString()
};

// Load stats from localStorage
export function loadTrainingStats(): TrainingStats {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults to handle missing fields from older versions
            return {
                ...defaultStats,
                ...parsed,
                puzzles: { ...defaultStats.puzzles, ...parsed.puzzles },
                openings: { ...defaultStats.openings, ...parsed.openings },
                endgames: { ...defaultStats.endgames, ...parsed.endgames },
                trainer: { ...defaultStats.trainer, ...parsed.trainer }
            };
        }
    } catch (error) {
        console.error('Failed to load training stats:', error);
    }
    return { ...defaultStats };
}

// Save stats to localStorage
export function saveTrainingStats(stats: TrainingStats): void {
    try {
        stats.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
        console.error('Failed to save training stats:', error);
    }
}

// Update puzzle stats after solving
export function updatePuzzleStats(
    puzzleId: string,
    wasCorrectFirstTry: boolean,
    timeSpent: number
): TrainingStats {
    const stats = loadTrainingStats();

    if (!stats.puzzles.solved.includes(puzzleId)) {
        stats.puzzles.solved.push(puzzleId);
    }

    stats.puzzles.attempted++;
    stats.puzzles.totalTime += timeSpent;
    stats.puzzles.lastPlayed = new Date().toISOString();

    if (wasCorrectFirstTry) {
        stats.puzzles.correctOnFirstTry++;
        stats.puzzles.streak++;
        if (stats.puzzles.streak > stats.puzzles.bestStreak) {
            stats.puzzles.bestStreak = stats.puzzles.streak;
        }
    } else {
        stats.puzzles.streak = 0;
    }

    saveTrainingStats(stats);
    return stats;
}

// Update opening stats
export function updateOpeningStats(openingName: string, wasMastered: boolean): TrainingStats {
    const stats = loadTrainingStats();

    if (!stats.openings.practiced.includes(openingName)) {
        stats.openings.practiced.push(openingName);
    }

    if (wasMastered && !stats.openings.mastered.includes(openingName)) {
        stats.openings.mastered.push(openingName);
    }

    stats.openings.sessionsCompleted++;
    stats.openings.lastPracticed = new Date().toISOString();

    saveTrainingStats(stats);
    return stats;
}

// Update endgame stats
export function updateEndgameStats(endgameId: string, moveCount: number): TrainingStats {
    const stats = loadTrainingStats();

    if (!stats.endgames.completed.includes(endgameId)) {
        stats.endgames.completed.push(endgameId);
    }

    const currentBest = stats.endgames.bestScores[endgameId];
    if (currentBest === undefined || moveCount < currentBest) {
        stats.endgames.bestScores[endgameId] = moveCount;
    }

    stats.endgames.totalAttempts++;
    stats.endgames.lastPracticed = new Date().toISOString();

    saveTrainingStats(stats);
    return stats;
}

// Update trainer stats
export function updateTrainerStats(positionsAttempted: number, correctMoves: number): TrainingStats {
    const stats = loadTrainingStats();

    stats.trainer.sessionsCompleted++;
    stats.trainer.totalPositions += positionsAttempted;
    stats.trainer.correctMoves += correctMoves;
    stats.trainer.accuracy = stats.trainer.totalPositions > 0
        ? Math.round((stats.trainer.correctMoves / stats.trainer.totalPositions) * 100)
        : 0;
    stats.trainer.lastSession = new Date().toISOString();

    saveTrainingStats(stats);
    return stats;
}

// Reset all training stats
export function resetTrainingStats(): TrainingStats {
    const stats = { ...defaultStats, lastUpdated: new Date().toISOString() };
    saveTrainingStats(stats);
    return stats;
}

// Get summary for display
export function getTrainingSummary(stats: TrainingStats): {
    puzzlesSolved: number;
    puzzleAccuracy: number;
    openingsPracticed: number;
    endgamesCompleted: number;
    trainerAccuracy: number;
} {
    return {
        puzzlesSolved: stats.puzzles.solved.length,
        puzzleAccuracy: stats.puzzles.attempted > 0
            ? Math.round((stats.puzzles.correctOnFirstTry / stats.puzzles.attempted) * 100)
            : 0,
        openingsPracticed: stats.openings.practiced.length,
        endgamesCompleted: stats.endgames.completed.length,
        trainerAccuracy: stats.trainer.accuracy
    };
}

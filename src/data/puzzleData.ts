// Chess Puzzle Data
// Each puzzle contains a FEN position, solution moves, rating, and tactical themes

export interface Puzzle {
    id: string;
    fen: string;                    // Starting position
    moves: string[];                // Solution moves (UCI format: e2e4, g1f3, etc.)
    rating: number;                 // Difficulty (800-2500)
    themes: PuzzleTheme[];          // Tactical themes
    title?: string;                 // Optional puzzle name
    playerColor: 'w' | 'b';         // Which side to play
}

export type PuzzleTheme =
    | 'mate'
    | 'mateIn1'
    | 'mateIn2'
    | 'mateIn3'
    | 'fork'
    | 'pin'
    | 'skewer'
    | 'discoveredAttack'
    | 'doubleCheck'
    | 'sacrifice'
    | 'backRankMate'
    | 'smotheredMate'
    | 'deflection'
    | 'decoy'
    | 'clearance'
    | 'interference'
    | 'zugzwang'
    | 'trapped'
    | 'hangingPiece'
    | 'promotion';

export const puzzleThemeLabels: Record<PuzzleTheme, string> = {
    mate: 'Checkmate',
    mateIn1: 'Mate in 1',
    mateIn2: 'Mate in 2',
    mateIn3: 'Mate in 3',
    fork: 'Fork',
    pin: 'Pin',
    skewer: 'Skewer',
    discoveredAttack: 'Discovered Attack',
    doubleCheck: 'Double Check',
    sacrifice: 'Sacrifice',
    backRankMate: 'Back Rank Mate',
    smotheredMate: 'Smothered Mate',
    deflection: 'Deflection',
    decoy: 'Decoy',
    clearance: 'Clearance',
    interference: 'Interference',
    zugzwang: 'Zugzwang',
    trapped: 'Trapped Piece',
    hangingPiece: 'Hanging Piece',
    promotion: 'Promotion'
};

// Curated puzzles organized by difficulty
export const puzzles: Puzzle[] = [
    // ===== BEGINNER (800-1200) =====
    {
        id: 'p001',
        title: "Scholar's Mate Setup",
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
        moves: ['h5f7'],
        rating: 800,
        themes: ['mateIn1', 'mate'],
        playerColor: 'w'
    },
    {
        id: 'p002',
        title: 'Back Rank Threat',
        fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
        moves: ['e1e8'],
        rating: 850,
        themes: ['mateIn1', 'backRankMate'],
        playerColor: 'w'
    },
    {
        id: 'p003',
        title: 'Queen Fork',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
        moves: ['f3f7'],
        rating: 900,
        themes: ['mateIn1', 'mate'],
        playerColor: 'w'
    },
    {
        id: 'p004',
        title: 'Knight Fork',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        moves: ['f3g5'],
        rating: 950,
        themes: ['fork', 'hangingPiece'],
        playerColor: 'w'
    },
    {
        id: 'p005',
        title: 'Simple Pin',
        fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5',
        moves: ['c1g5'],
        rating: 1000,
        themes: ['pin'],
        playerColor: 'w'
    },
    {
        id: 'p006',
        title: 'Smothered Mate',
        fen: '6rk/5Npp/8/8/8/8/8/4K3 w - - 0 1',
        moves: ['f7h6'],
        rating: 1050,
        themes: ['mateIn1', 'smotheredMate'],
        playerColor: 'w'
    },
    {
        id: 'p007',
        title: 'Capture the Hanging Piece',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
        moves: ['f3e5'],
        rating: 800,
        themes: ['hangingPiece'],
        playerColor: 'w'
    },

    // ===== INTERMEDIATE (1200-1600) =====
    {
        id: 'p008',
        title: 'Queen Sacrifice for Mate',
        fen: 'r1b1k2r/ppppqppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 6',
        moves: ['c4f7', 'e7f7', 'f3g5'],
        rating: 1200,
        themes: ['sacrifice', 'fork'],
        playerColor: 'w'
    },
    {
        id: 'p009',
        title: 'Discovered Attack',
        fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 5',
        moves: ['c3d5'],
        rating: 1250,
        themes: ['discoveredAttack', 'fork'],
        playerColor: 'w'
    },
    {
        id: 'p010',
        title: 'Deflection',
        fen: 'r4rk1/ppp2ppp/2n5/3q4/3P4/2N5/PPP2PPP/R2QR1K1 w - - 0 12',
        moves: ['e1e8', 'f8e8', 'd1d5'],
        rating: 1300,
        themes: ['deflection', 'sacrifice'],
        playerColor: 'w'
    },
    {
        id: 'p011',
        title: 'Back Rank Mate in 2',
        fen: '3r2k1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1',
        moves: ['e1e8', 'd8e8', 'd1e1'],
        rating: 1350,
        themes: ['mateIn2', 'backRankMate', 'sacrifice'],
        playerColor: 'w'
    },
    {
        id: 'p012',
        title: 'Skewer',
        fen: '4r1k1/5ppp/8/8/8/8/1B3PPP/6K1 w - - 0 1',
        moves: ['b2e5'],
        rating: 1200,
        themes: ['skewer'],
        playerColor: 'w'
    },
    {
        id: 'p013',
        title: 'Promotion Threat',
        fen: '8/P5k1/8/8/8/8/6K1/8 w - - 0 1',
        moves: ['a7a8q'],
        rating: 1100,
        themes: ['promotion'],
        playerColor: 'w'
    },
    {
        id: 'p014',
        title: 'Double Attack',
        fen: 'r1bq1rk1/ppp2ppp/2n2n2/3pp3/1bPP4/2N1PN2/PP3PPP/R1BQKB1R w KQ - 0 7',
        moves: ['d4e5'],
        rating: 1400,
        themes: ['fork', 'hangingPiece'],
        playerColor: 'w'
    },

    // ===== ADVANCED (1600-2000) =====
    {
        id: 'p015',
        title: 'Greek Gift Sacrifice',
        fen: 'r1bq1rk1/pppn1ppp/4pn2/3p4/1bPP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 0 8',
        moves: ['d3h7', 'g8h7', 'f3g5', 'h7g8', 'd1h5'],
        rating: 1600,
        themes: ['sacrifice', 'mateIn3'],
        playerColor: 'w'
    },
    {
        id: 'p016',
        title: 'Clearance Sacrifice',
        fen: 'r1bqr1k1/ppp2ppp/2np4/2bNp3/4P1n1/3P1N2/PPP2PPP/R1BQKB1R w KQ - 0 8',
        moves: ['d5f6', 'g7f6', 'f3g5'],
        rating: 1650,
        themes: ['clearance', 'sacrifice'],
        playerColor: 'w'
    },
    {
        id: 'p017',
        title: 'Interference',
        fen: 'r4rk1/ppp1qppp/2n5/3p4/3Pn3/2PBP3/PP1N1PPP/R2QK2R w KQ - 0 11',
        moves: ['d3h7', 'g8h7', 'd1h5', 'h7g8', 'h5f7'],
        rating: 1700,
        themes: ['sacrifice', 'interference'],
        playerColor: 'w'
    },
    {
        id: 'p018',
        title: 'Trapped Queen',
        fen: 'rnbqkb1r/pppp1ppp/4pn2/8/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4',
        moves: ['e2e3'],
        rating: 1500,
        themes: ['trapped'],
        playerColor: 'w'
    },
    {
        id: 'p019',
        title: 'Decoy Sacrifice',
        fen: 'r2q1rk1/ppp2ppp/2n5/3pP3/3Pn3/2PB4/PP3PPP/R1BQK2R w KQ - 0 11',
        moves: ['d3h7', 'g8h7', 'd1d3', 'h7g8', 'd3h7', 'g8f8', 'h7h8'],
        rating: 1800,
        themes: ['decoy', 'sacrifice', 'mateIn3'],
        playerColor: 'w'
    },
    {
        id: 'p020',
        title: 'Double Check Victory',
        fen: 'r1bqk2r/pppp1Npp/2n2n2/2b1p3/2B1P3/8/PPPP1PPP/RNBQK2R w KQkq - 0 5',
        moves: ['f7d6'],
        rating: 1550,
        themes: ['doubleCheck', 'fork'],
        playerColor: 'w'
    },

    // ===== BLACK TO PLAY =====
    {
        id: 'p021',
        title: 'Black Strikes Back',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq - 0 2',
        moves: ['d8h4'],
        rating: 900,
        themes: ['fork'],
        playerColor: 'b'
    },
    {
        id: 'p022',
        title: 'Back Rank Mate (Black)',
        fen: '4R1k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1',
        moves: ['g8h8'], // Can't escape, show the threat
        rating: 850,
        themes: ['backRankMate'],
        playerColor: 'b'
    },
    {
        id: 'p023',
        title: 'Knight Outpost',
        fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2BnP3/5N2/PPPP1PPP/RNBQK2R b KQkq - 5 4',
        moves: ['d4f3'],
        rating: 1100,
        themes: ['fork'],
        playerColor: 'b'
    },
    {
        id: 'p024',
        title: "Légal's Mate Pattern",
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4',
        moves: ['f6e4'],
        rating: 1150,
        themes: ['hangingPiece', 'fork'],
        playerColor: 'b'
    },
    {
        id: 'p025',
        title: 'Rook Invasion',
        fen: 'r4rk1/ppp2ppp/2n5/3p4/3P4/2P5/PP3PPP/R3R1K1 b - - 0 12',
        moves: ['a8a2'],
        rating: 1300,
        themes: ['hangingPiece'],
        playerColor: 'b'
    }
];

// Get puzzles filtered by theme
export function getPuzzlesByTheme(theme: PuzzleTheme): Puzzle[] {
    return puzzles.filter(p => p.themes.includes(theme));
}

// Get puzzles filtered by rating range
export function getPuzzlesByRating(minRating: number, maxRating: number): Puzzle[] {
    return puzzles.filter(p => p.rating >= minRating && p.rating <= maxRating);
}

// Get a random puzzle optionally filtered
export function getRandomPuzzle(theme?: PuzzleTheme, minRating?: number, maxRating?: number): Puzzle | undefined {
    let filtered = puzzles;

    if (theme) {
        filtered = filtered.filter(p => p.themes.includes(theme));
    }
    if (minRating !== undefined) {
        filtered = filtered.filter(p => p.rating >= minRating);
    }
    if (maxRating !== undefined) {
        filtered = filtered.filter(p => p.rating <= maxRating);
    }

    if (filtered.length === 0) return undefined;
    return filtered[Math.floor(Math.random() * filtered.length)];
}

// Difficulty categories
export const difficultyLevels = {
    beginner: { label: 'Beginner', minRating: 800, maxRating: 1199, color: '#4ade80' },
    intermediate: { label: 'Intermediate', minRating: 1200, maxRating: 1599, color: '#facc15' },
    advanced: { label: 'Advanced', minRating: 1600, maxRating: 2000, color: '#f87171' },
    master: { label: 'Master', minRating: 2000, maxRating: 2500, color: '#a78bfa' }
};

export function getDifficultyForRating(rating: number): keyof typeof difficultyLevels {
    if (rating < 1200) return 'beginner';
    if (rating < 1600) return 'intermediate';
    if (rating < 2000) return 'advanced';
    return 'master';
}

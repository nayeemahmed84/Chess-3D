export interface Opening {
    name: string;
    eco: string;
}

// Map of normalized FEN (piece placement + active color + castling + en passant) to Opening
// We will use the full FEN but might need to normalize it in the hook if we want to handle transpositions strictly.
// For now, we'll use the standard starting position FENs for these openings.

export const openings: Record<string, Opening> = {
    // Ruy Lopez
    "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3": { name: "Ruy Lopez", eco: "C60" },
    "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq -": { name: "Ruy Lopez", eco: "C60" }, // relaxed matching

    // Sicilian Defense
    "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2": { name: "Sicilian Defense", eco: "B20" },

    // French Defense
    "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2": { name: "French Defense", eco: "C00" },

    // Caro-Kann Defense
    "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2": { name: "Caro-Kann Defense", eco: "B10" },

    // Italian Game
    "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3": { name: "Italian Game", eco: "C50" },

    // Queen's Gambit
    "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2": { name: "Queen's Gambit", eco: "D06" },

    // King's Indian Defense
    "rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3": { name: "King's Indian Defense", eco: "E60" },

    // Nimzo-Indian Defense
    "rnbqk2r/pppp1ppp/4pn2/8/2PP4/2b2N2/PP2PPPP/RNBQKB1R w KQkq - 2 4": { name: "Nimzo-Indian Defense", eco: "E20" },

    // English Opening
    "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1": { name: "English Opening", eco: "A10" },

    // Reti Opening
    "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1": { name: "Réti Opening", eco: "A04" },

    // Scandinavian Defense
    "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2": { name: "Scandinavian Defense", eco: "B01" },

    // Pirc Defense
    "rnbqkbnr/ppp1pppp/3p4/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2": { name: "Pirc Defense", eco: "B07" },

    // Alekhine's Defense
    "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2": { name: "Alekhine's Defense", eco: "B02" },

    // Modern Defense
    "rnbqkbnr/pppppp1p/6p1/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2": { name: "Modern Defense", eco: "B06" },

    // Dutch Defense
    "rnbqkbnr/ppppp1pp/8/5p2/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2": { name: "Dutch Defense", eco: "A80" },

    // Scotch Game
    "r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3": { name: "Scotch Game", eco: "C45" },

    // Four Knights Game
    "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4": { name: "Four Knights Game", eco: "C47" },

    // Philidor Defense
    "rnbqkbnr/ppp2ppp/3p4/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3": { name: "Philidor Defense", eco: "C41" },

    // Petrov's Defense
    "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3": { name: "Petrov's Defense", eco: "C42" },

    // King's Gambit
    "rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq - 0 2": { name: "King's Gambit", eco: "C30" },

    // Evans Gambit
    "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/1P3N2/P1PP1PPP/RNBQK2R b KQkq - 0 4": { name: "Evans Gambit", eco: "C51" },

    // London System (approximate, usually defined by setup)
    "rnbqkbnr/ppp1pppp/8/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2": { name: "London System", eco: "D02" },

    // Trompowsky Attack
    "rnbqkbnr/ppppp1pp/8/5p2/3P2B1/8/PPP1PPPP/RNBQK1NR b KQkq - 1 2": { name: "Trompowsky Attack", eco: "A45" },

    // Grunfeld Defense
    "rnbqkb1r/ppp1pp1p/5np1/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4": { name: "Grünfeld Defense", eco: "D80" },

    // Slav Defense
    "rnbqkbnr/pp2pppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3": { name: "Slav Defense", eco: "D10" },

    // Semi-Slav Defense
    "rnbqkb1r/pp3ppp/2p1pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5": { name: "Semi-Slav Defense", eco: "D43" },

    // Catalan Opening
    "rnbqkb1r/pppppp1p/5np1/8/2PP4/6P1/PP2PP1P/RNBQKBNR b KQkq - 0 3": { name: "Catalan Opening", eco: "E00" },

    // Benoni Defense
    "rnbqkb1r/pp1ppppp/5n2/2p5/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3": { name: "Benoni Defense", eco: "A56" },

    // Sicilian Najdorf
    "rn1qkb1r/1p2pppp/p2p1n2/8/3NP1b1/2N5/PPP2PPP/R1BQKB1R w KQkq - 1 6": { name: "Sicilian Defense: Najdorf Variation", eco: "B90" },

    // Sicilian Dragon
    "rnbqkb1r/pp2pp1p/3p1np1/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6": { name: "Sicilian Defense: Dragon Variation", eco: "B70" },
};

// Helper to normalize FEN for matching (removes move counts)
export function normalizeFen(fen: string): string {
    // FEN: piece_placement active_color castling en_passant halfmove fullmove
    // We want to match based on position, color, castling, and en_passant (mostly)
    // But often opening books might just care about piece placement and color.
    // Let's try to match the first 4 fields.
    return fen.split(' ').slice(0, 4).join(' ');
}

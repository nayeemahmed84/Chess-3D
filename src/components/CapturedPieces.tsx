

interface CapturedPiecesProps {
    pieces: string[];
    score?: number;
}

const PIECE_SYMBOLS: Record<string, string> = {
    p: '♟',
    n: '♞',
    b: '♝',
    r: '♜',
    q: '♛',
    k: '♚'
};

const PIECE_ORDER = ['p', 'n', 'b', 'r', 'q'];

export const CapturedPieces = ({ pieces, score }: CapturedPiecesProps) => {
    // Sort pieces by value
    const sortedPieces = [...pieces].sort((a, b) => {
        return PIECE_ORDER.indexOf(a) - PIECE_ORDER.indexOf(b);
    });

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            height: '24px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            padding: '0 8px',
            minWidth: '100px'
        }}>
            <div style={{ display: 'flex', marginRight: '8px' }}>
                {sortedPieces.map((piece, index) => (
                    <span key={index} style={{
                        fontSize: '14px',
                        color: 'rgba(255,255,255,0.8)',
                        marginLeft: index > 0 ? '-4px' : '0'
                    }}>
                        {PIECE_SYMBOLS[piece]}
                    </span>
                ))}
            </div>
            {score !== undefined && score > 0 && (
                <span style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#4CAF50',
                    marginLeft: 'auto'
                }}>
                    +{score}
                </span>
            )}
        </div>
    );
};

import { useMemo, useState } from 'react';
import { Square } from 'chess.js';
import { Piece } from './Piece';

interface BoardProps {
    fen: string;
    onMove: (from: Square, to: Square) => boolean;
    turn: string;
    getPossibleMoves: (square: Square) => string[];
}

export const Board = ({ fen, onMove, turn, getPossibleMoves }: BoardProps) => {
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [possibleMoves, setPossibleMoves] = useState<string[]>([]);

    const squares = useMemo(() => {
        const sqs = [];
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
                const isBlack = (rank + file) % 2 === 1;
                const squareName = `${files[file]}${8 - rank}` as Square;
                sqs.push({
                    x: file - 3.5,
                    z: rank - 3.5,
                    color: isBlack ? '#333' : '#eee', // Darker black, lighter white for contrast
                    name: squareName,
                    isBlack
                });
            }
        }
        return sqs;
    }, []);

    const pieces = useMemo(() => {
        const p: { type: string; color: string; square: Square; x: number; z: number }[] = [];
        const rows = fen.split(' ')[0].split('/');
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

        rows.forEach((row, rankIndex) => {
            let fileIndex = 0;
            for (const char of row) {
                if (isNaN(parseInt(char))) {
                    const color = char === char.toUpperCase() ? 'w' : 'b';
                    const type = char.toLowerCase();
                    p.push({
                        type,
                        color,
                        square: `${files[fileIndex]}${8 - rankIndex}` as Square,
                        x: fileIndex - 3.5,
                        z: rankIndex - 3.5
                    });
                    fileIndex++;
                } else {
                    fileIndex += parseInt(char);
                }
            }
        });
        return p;
    }, [fen]);

    const handleSquareClick = (squareName: Square) => {
        if (selectedSquare) {
            if (selectedSquare === squareName) {
                setSelectedSquare(null);
                setPossibleMoves([]);
                return;
            }
            if (possibleMoves.includes(squareName)) {
                const success = onMove(selectedSquare, squareName);
                if (success) {
                    setSelectedSquare(null);
                    setPossibleMoves([]);
                    return;
                }
            }
        }

        const piece = pieces.find(p => p.square === squareName);
        if (piece && piece.color === turn) {
            setSelectedSquare(squareName);
            setPossibleMoves(getPossibleMoves(squareName));
        } else {
            setSelectedSquare(null);
            setPossibleMoves([]);
        }
    };

    return (
        <group>
            {/* Board Frame */}
            <mesh position={[0, -0.2, 0]} receiveShadow>
                <boxGeometry args={[9, 0.4, 9]} />
                <meshStandardMaterial color="#3d2b1f" roughness={0.6} />
            </mesh>

            {/* Inner Board Border */}
            <mesh position={[0, -0.05, 0]} receiveShadow>
                <boxGeometry args={[8.2, 0.15, 8.2]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
            </mesh>

            {/* Board Squares */}
            {squares.map((sq) => (
                <mesh
                    key={sq.name}
                    position={[sq.x, 0, sq.z]}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSquareClick(sq.name);
                    }}
                    receiveShadow
                >
                    <boxGeometry args={[1, 0.1, 1]} />
                    <meshPhysicalMaterial
                        color={
                            selectedSquare === sq.name ? '#6a5acd' :
                                possibleMoves.includes(sq.name) ? (sq.isBlack ? '#556b2f' : '#8fbc8f') :
                                    sq.color
                        }
                        roughness={0.2}
                        metalness={0.1}
                        clearcoat={0.5}
                        clearcoatRoughness={0.1}
                    />
                </mesh>
            ))}

            {/* Pieces */}
            {pieces.map((p) => (
                <Piece
                    key={`${p.square}-${p.type}-${p.color}`}
                    type={p.type}
                    color={p.color}
                    position={[p.x, 0.05, p.z]}
                />
            ))}
        </group>
    );
};

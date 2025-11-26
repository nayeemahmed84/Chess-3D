import { OrbitControls, Environment } from '@react-three/drei';
import { Board } from './Board';
import { Square } from 'chess.js';

import { PieceState } from '../hooks/useChessGame';

interface SceneProps {
    onMove: (from: Square, to: Square) => boolean;
    turn: string;
    getPossibleMoves: (square: Square) => string[];
    pieces: PieceState[];
}

export const Scene = ({ onMove, turn, getPossibleMoves, pieces }: SceneProps) => {
    return (
        <>
            <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
            <Environment preset="forest" background blur={0.5} />

            <Board onMove={onMove} turn={turn} getPossibleMoves={getPossibleMoves} pieces={pieces} />
        </>
    );
};
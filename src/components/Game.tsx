import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { useChessGame } from '../hooks/useChessGame';
import { RotateCcw } from 'lucide-react';

const Game = () => {
    const { fen, makeMove, turn, isGameOver, winner, resetGame, getPossibleMoves } = useChessGame();

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#1a1a1a' }}>
            <Canvas shadows camera={{ position: [0, 8, 8], fov: 45 }}>
                <color attach="background" args={['#1a1a1a']} />
                <Scene
                    fen={fen}
                    onMove={makeMove}
                    turn={turn}
                    getPossibleMoves={getPossibleMoves}
                />
            </Canvas>

            {/* Glassmorphism UI Overlay */}
            <div style={{
                position: 'absolute',
                top: 30,
                left: 30,
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                fontFamily: "'Inter', sans-serif",
                minWidth: '200px'
            }}>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px' }}>Chess 3D</h2>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: turn === 'w' ? '#fff' : '#333',
                        border: turn === 'w' ? 'none' : '1px solid #666',
                        marginRight: '10px',
                        boxShadow: turn === 'w' ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
                    }} />
                    <span style={{ fontSize: '16px', fontWeight: 500 }}>
                        {turn === 'w' ? "White's Turn" : "Black's Turn"}
                    </span>
                </div>

                {isGameOver && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ margin: '0 0 8px 0', color: '#ff4d4d' }}>Game Over</h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: '14px', opacity: 0.8 }}>
                            {winner === 'Draw' ? 'Draw' : `${winner} Wins!`}
                        </p>
                        <button
                            onClick={resetGame}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                padding: '10px 16px',
                                cursor: 'pointer',
                                background: 'rgba(255, 255, 255, 0.9)',
                                color: '#000',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '14px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <RotateCcw size={16} style={{ marginRight: '8px' }} />
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            <div style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12px',
                fontFamily: 'monospace'
            }}>
                Left Click to Select/Move • Right Click to Rotate
            </div>
        </div>
    );
};

export default Game;

import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { useChessGame } from '../hooks/useChessGame';
import { RotateCcw } from 'lucide-react';

const Game = () => {
    const { makeMove, turn, isGameOver, winner, resetGame, getPossibleMoves, pieces, difficulty, setDifficulty } = useChessGame();

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#1a1a1a' }}>
            <Canvas shadows camera={{ position: [0, 8, 8], fov: 45 }}>
                <color attach="background" args={['#1a1a1a']} />
                <Scene
                    onMove={makeMove}
                    turn={turn}
                    getPossibleMoves={getPossibleMoves}
                    pieces={pieces}
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

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Difficulty</label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            outline: 'none',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>

                <button
                    onClick={resetGame}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        fontWeight: 500,
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        marginBottom: '12px' // Add margin to separate from Game Over or bottom
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                    <RotateCcw size={14} style={{ marginRight: '8px' }} />
                    Reset Game
                </button>

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

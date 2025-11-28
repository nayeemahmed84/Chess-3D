import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { useChessGame } from '../hooks/useChessGame';
import { RotateCcw } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';

const Game = () => {
    const {
        makeMove, turn, isGameOver, winner, resetGame, getPossibleMoves, pieces,
        difficulty, setDifficulty, history, evaluation, whiteTime, blackTime, undoMove, redoMove,
        promotionPending, onPromotionSelect, lastMove, checkSquare
    } = useChessGame();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#1a1a1a' }}>
            <Canvas shadows camera={{ position: [0, 8, 8], fov: 45 }}>
                <color attach="background" args={['#1a1a1a']} />
                <Scene
                    onMove={makeMove}
                    turn={turn}
                    getPossibleMoves={getPossibleMoves}
                    pieces={pieces}
                    lastMove={lastMove}
                    checkSquare={checkSquare}
                />
            </Canvas>

            {/* Evaluation Bar */}
            <div style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '60vh',
                background: '#333',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)'
            }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to top, #000 0%, #fff 100%)',
                    opacity: 0.2,
                    position: 'absolute'
                }} />
                {/* White bar height based on eval. Eval 0 = 50%. +10 = 100%, -10 = 0% */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: `${Math.min(100, Math.max(0, 50 + (evaluation * 5)))}%`,
                    background: '#fff',
                    transition: 'height 0.5s ease'
                }} />
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    width: '100%',
                    height: '2px',
                    background: 'rgba(255,0,0,0.5)',
                    zIndex: 10
                }} />
            </div>

            {/* Glassmorphism UI Overlay - Left Panel (Controls) */}
            <div style={{
                position: 'absolute',
                top: 30,
                left: 60,
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

                {/* Clocks */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '10px' }}>
                    <div style={{
                        background: turn === 'w' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        padding: '8px', borderRadius: '8px', flex: 1, textAlign: 'center',
                        border: turn === 'w' ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent'
                    }}>
                        <div style={{ fontSize: '10px', opacity: 0.7 }}>White</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatTime(whiteTime)}</div>
                    </div>
                    <div style={{
                        background: turn === 'b' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                        padding: '8px', borderRadius: '8px', flex: 1, textAlign: 'center',
                        border: turn === 'b' ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent'
                    }}>
                        <div style={{ fontSize: '10px', opacity: 0.7 }}>Black</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatTime(blackTime)}</div>
                    </div>
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

                {/* Game Controls */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button
                        onClick={undoMove}
                        title="Undo Move"
                        style={{
                            flex: 1, padding: '8px', cursor: 'pointer',
                            background: 'rgba(255, 255, 255, 0.1)', color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center'
                        }}
                    >
                        <RotateCcw size={14} style={{ transform: 'scaleX(-1)' }} />
                    </button>
                    <button
                        onClick={redoMove}
                        title="Redo Move"
                        style={{
                            flex: 1, padding: '8px', cursor: 'pointer',
                            background: 'rgba(255, 255, 255, 0.1)', color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center'
                        }}
                    >
                        <RotateCcw size={14} />
                    </button>
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
                        marginBottom: '12px'
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

            {/* Right Panel - Move History */}
            <div style={{
                position: 'absolute',
                top: 30,
                right: 30,
                width: '200px',
                maxHeight: '80vh',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                padding: '20px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                fontFamily: "'Inter', sans-serif",
                display: 'flex',
                flexDirection: 'column'
            }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Move History</h3>
                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                        <tbody>
                            {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '4px', color: 'rgba(255,255,255,0.5)', width: '30px' }}>{i + 1}.</td>
                                    <td style={{ padding: '4px' }}>{history[i * 2]}</td>
                                    <td style={{ padding: '4px' }}>{history[i * 2 + 1] || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {history.length === 0 && <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>No moves yet</div>}
                </div>
            </div>

            {/* Promotion Modal - Centered on Screen */}
            {promotionPending && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    padding: '30px',
                    borderRadius: '20px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    zIndex: 1000,
                    textAlign: 'center'
                }}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>Promote Pawn</h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {[
                            { type: 'q', symbol: '♛', color: 'linear-gradient(135deg, #FFD700, #FFA500)', name: 'Queen' },
                            { type: 'r', symbol: '♜', color: 'linear-gradient(135deg, #4169E1, #1E90FF)', name: 'Rook' },
                            { type: 'b', symbol: '♝', color: 'linear-gradient(135deg, #9370DB, #8A2BE2)', name: 'Bishop' },
                            { type: 'n', symbol: '♞', color: 'linear-gradient(135deg, #32CD32, #228B22)', name: 'Knight' }
                        ].map((piece) => (
                            <button
                                key={piece.type}
                                onClick={() => onPromotionSelect(piece.type)}
                                title={piece.name}
                                style={{
                                    padding: '0',
                                    fontSize: '36px',
                                    cursor: 'pointer',
                                    background: piece.color,
                                    border: '3px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '12px',
                                    width: '70px',
                                    height: '70px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                                    color: '#fff',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                    e.currentTarget.style.boxShadow = '0 6px 25px rgba(255, 255, 255, 0.3)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                                }}
                            >
                                {piece.symbol}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                color: 'rgba(255,255,255,0.5)',
                fontSize: '12px',
                fontFamily: 'monospace'
            }}>
                Made with 💖 by{' '}
                <span
                    onClick={async () => {
                        try {
                            console.log('Attempting to open URL...');
                            await open('https://www.facebook.com/LegendCoder');
                            console.log('URL opened successfully');
                        } catch (error) {
                            console.error('Error opening URL:', error);
                            alert('Error opening link: ' + error);
                        }
                    }}
                    style={{
                        color: 'rgba(255,255,255,0.8)',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,1)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                >
                    Nayeem
                </span>
            </div>
        </div>
    );
};

export default Game;

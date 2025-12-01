import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { useChessGame } from '../hooks/useChessGame';
import { RotateCcw, RotateCw, Trophy, ChevronLeft, ChevronRight, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

import { open } from '@tauri-apps/plugin-shell';

const Game = () => {
    const {
        makeMove, turn, isGameOver, winner, resetGame, getPossibleMoves, pieces,
        difficulty, setDifficulty, history, evaluation, whiteTime, blackTime, undoMove, redoMove,
        promotionPending, onPromotionSelect, lastMove, checkSquare, playerColor, setPlayerColor,
        hintMove, showHint, showThreats, setShowThreats, attackedSquares, requestHint,
        volume, setVolume, isMuted, toggleMute
    } = useChessGame();

    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(() => { });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            }).catch(() => { });
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
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
                    playerColor={playerColor}
                    hintMove={hintMove}
                    attackedSquares={attackedSquares}
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
                {/* White bar height based on eval. Eval 0 = 50%, ±20 = 0-100% */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: `${Math.min(100, Math.max(0, 50 + (evaluation * 2.5)))}%`,
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

            {/* Floating Show Panel Button (when hidden) */}
            {!isPanelVisible && (
                <button
                    onClick={() => setIsPanelVisible(true)}
                    style={{
                        position: 'absolute',
                        top: 30,
                        left: 20,
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        zIndex: 100,
                        boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.37)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Show Panel"
                >
                    <ChevronRight size={20} color="white" />
                </button>
            )}

            {/* Glassmorphism UI Overlay - Left Panel (Controls) */}
            <div style={{
                position: 'absolute',
                top: 30,
                left: isPanelVisible ? 60 : -300,
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                fontFamily: "'Inter', sans-serif",
                minWidth: '200px',
                transition: 'left 0.3s ease',
                zIndex: 100
            }}>
                {/* Toggle Button */}
                <button
                    onClick={() => setIsPanelVisible(!isPanelVisible)}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    title="Hide Panel"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Fullscreen Button */}
                <button
                    onClick={toggleFullscreen}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '44px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
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

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Volume</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={toggleMute}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => {
                                if (isMuted) toggleMute();
                                setVolume(parseFloat(e.target.value));
                            }}
                            style={{
                                flex: 1,
                                cursor: 'pointer',
                                accentColor: '#4CAF50'
                            }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>Play As</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setPlayerColor('w')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                background: playerColor === 'w' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            White
                        </button>
                        <button
                            onClick={() => setPlayerColor('b')}
                            style={{
                                flex: 1,
                                padding: '8px',
                                background: playerColor === 'b' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Black
                        </button>
                    </div>
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
                        <RotateCcw size={14} />
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
                        <RotateCw size={14} />
                    </button>
                </div>

                {/* Hint & Analysis Controls */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button
                        onClick={requestHint}
                        title="Get a Hint"
                        style={{
                            flex: 1, padding: '8px', cursor: 'pointer',
                            background: showHint ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 215, 0, 0.2)',
                            color: '#FFD700',
                            border: showHint ? '1px solid rgba(255, 215, 0, 0.8)' : '1px solid rgba(255, 215, 0, 0.4)',
                            borderRadius: '8px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            fontSize: '14px', fontWeight: 600,
                            boxShadow: showHint ? '0 0 10px rgba(255, 215, 0, 0.3)' : 'none'
                        }}
                    >
                        {showHint ? 'Hide Hint' : '💡 Hint'}
                    </button>
                    <button
                        onClick={() => setShowThreats(!showThreats)}
                        title="Toggle Threat Indicators"
                        style={{
                            flex: 1, padding: '8px', cursor: 'pointer',
                            background: showThreats ? 'rgba(255, 50, 50, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                            color: showThreats ? '#ffaaaa' : 'white',
                            border: showThreats ? '1px solid rgba(255, 50, 50, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            fontSize: '14px'
                        }}
                    >
                        {showThreats ? 'Hide Threats' : 'Show Threats'}
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


            </div>

            {/* Right Panel - Move History */}
            <div style={{
                position: 'absolute',
                top: 30,
                right: 30,
                width: '200px',
                maxHeight: '200px',
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
                <div className="glass-scrollbar" style={{ overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
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
            {
                promotionPending && (
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
                )
            }

            {/* Game Over Modal */}
            {
                isGameOver && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 2000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            background: 'rgba(20, 20, 20, 0.9)',
                            backdropFilter: 'blur(20px)',
                            padding: '50px 70px',
                            borderRadius: '24px',
                            border: '2px solid rgba(255, 255, 255, 0.15)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                            textAlign: 'center'
                        }}>
                            <Trophy size={80} style={{
                                marginBottom: '20px',
                                color: winner === 'Draw' ? '#AAA' : '#FFD700',
                                filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))'
                            }} />

                            <h2 style={{
                                fontSize: '48px',
                                fontWeight: '800',
                                margin: '0 0 10px 0',
                                background: 'linear-gradient(135deg, #FFF 0%, #CCC 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-1px'
                            }}>
                                {winner === 'Draw' ? 'Draw!' : 'Victory!'}
                            </h2>

                            <p style={{
                                fontSize: '24px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                margin: '0 0 40px 0',
                                fontWeight: '500'
                            }}>
                                {winner === 'Draw' ? 'Game ended in a draw' : `${winner} wins the game!`}
                            </p>

                            <button
                                onClick={resetGame}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(76, 175, 80, 0.4)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '18px 40px',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                }}
                            >
                                <RotateCcw size={20} />
                                Play Again
                            </button>
                        </div>
                    </div>
                )
            }

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
        </div >
    );
};

export default Game;

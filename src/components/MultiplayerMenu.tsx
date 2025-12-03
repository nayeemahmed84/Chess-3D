import React, { useState, useEffect } from 'react';
import { multiplayerService } from '../services/MultiplayerService';
import { Copy, Check, Users, LogIn } from 'lucide-react';

interface MultiplayerMenuProps {
    onGameStart: (isHost: boolean) => void;
    onClose: () => void;
}

export const MultiplayerMenu: React.FC<MultiplayerMenuProps> = ({ onGameStart, onClose }) => {
    const [myId, setMyId] = useState<string>('');
    const [peerIdInput, setPeerIdInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        multiplayerService.initialize((id) => {
            setMyId(id);
        });

        multiplayerService.onConnect(() => {
            setStatus('connected');
            // Wait a moment then start game
            setTimeout(() => {
                // Determine who is white/black based on who initiated? 
                // Usually host is white, joiner is black.
                // We can handle this in the parent component or send a handshake.
                // For now, let's assume if I have a connection and I didn't initiate it (incoming), I am host?
                // Actually, let's just trigger callback. The service doesn't track who initiated easily without extra state.
                // But we know if we clicked "Join", we are the client.
            }, 1000);
        });

        return () => {
            // Don't destroy peer here, we want to keep it alive for the game
        };
    }, []);

    const handleCopyId = () => {
        navigator.clipboard.writeText(myId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleJoin = () => {
        if (!peerIdInput) {
            setError('Please enter a Room ID');
            return;
        }
        setStatus('connecting');
        multiplayerService.connect(peerIdInput);
        // If connection successful, onConnect will fire
        // We assume we are Black if we join
        multiplayerService.onConnect(() => {
            setStatus('connected');
            setTimeout(() => onGameStart(false), 500); // false = not host (Black)
        });
    };



    // Better approach for Host detection:
    // We'll use a ref or state to track if we are joining.
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        multiplayerService.onConnect(() => {
            setStatus('connected');
            setTimeout(() => {
                onGameStart(!isJoining); // If not joining, we are host
            }, 1000);
        });
    }, [isJoining, onGameStart]);


    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                padding: '30px',
                borderRadius: '20px',
                width: '400px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                color: 'white',
                fontFamily: "'Inter', sans-serif"
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={24} color="#4CAF50" />
                        Online Multiplayer
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '20px' }}>×</button>
                </div>

                {status === 'connected' ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ fontSize: '40px', marginBottom: '20px' }}>🎮</div>
                        <h3>Connected!</h3>
                        <p>Starting game...</p>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Your Room ID
                            </label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{
                                    flex: 1,
                                    background: 'rgba(0,0,0,0.3)',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    fontFamily: 'monospace',
                                    fontSize: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {myId || 'Generating...'}
                                </div>
                                <button
                                    onClick={handleCopyId}
                                    disabled={!myId}
                                    style={{
                                        background: copied ? '#4CAF50' : 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        width: '44px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Copy ID"
                                >
                                    {copied ? <Check size={20} color="white" /> : <Copy size={20} color="white" />}
                                </button>
                            </div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                                Share this ID with your friend so they can join.
                            </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '20px 0' }}>
                            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }} />
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>OR</span>
                            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Join a Room
                            </label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Enter Friend's ID"
                                    value={peerIdInput}
                                    onChange={(e) => {
                                        setPeerIdInput(e.target.value);
                                        setError(null);
                                    }}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: error ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        color: 'white',
                                        fontSize: '16px',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        setIsJoining(true);
                                        handleJoin();
                                    }}
                                    disabled={status === 'connecting' || !peerIdInput}
                                    style={{
                                        background: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0 20px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        opacity: (!peerIdInput || status === 'connecting') ? 0.5 : 1
                                    }}
                                >
                                    {status === 'connecting' ? '...' : <><LogIn size={18} /> Join</>}
                                </button>
                            </div>
                            {error && <p style={{ color: '#ff4444', fontSize: '12px', marginTop: '8px' }}>{error}</p>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

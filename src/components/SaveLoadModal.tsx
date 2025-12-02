import { Save, Upload, Trash2, X } from 'lucide-react';

interface SavedGame {
    fen: string;
    pgn: string;
    turn: 'w' | 'b';
    isGameOver: boolean;
    winner: string | null;
    difficulty: string;
    history: string[];
    undoneMoves: string[];
    evaluation: number;
    whiteTime: number;
    blackTime: number;
    playerColor: 'w' | 'b';
    volume: number;
    isMuted: boolean;
    savedAt: number; // timestamp
    moveCount: number;
}

interface SaveLoadModalProps {
    mode: 'save' | 'load';
    onClose: () => void;
    onSave: (slotIndex: number) => void;
    onLoad: (slotIndex: number) => void;
    onDelete: (slotIndex: number) => void;
}

export const SaveLoadModal = ({ mode, onClose, onSave, onLoad, onDelete }: SaveLoadModalProps) => {
    const getSavedGames = (): (SavedGame | null)[] => {
        const slots: (SavedGame | null)[] = [];
        for (let i = 0; i < 5; i++) {
            const saved = localStorage.getItem(`chess_save_slot_${i}`);
            slots.push(saved ? JSON.parse(saved) : null);
        }
        return slots;
    };

    const savedGames = getSavedGames();

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getResultText = (game: SavedGame) => {
        if (game.isGameOver) {
            return game.winner === 'Draw' ? 'Draw' : `${game.winner} won`;
        }
        return 'In Progress';
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '20px'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderRadius: '20px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '30px',
                    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {mode === 'save' ? <Save size={32} color="#00ff88" /> : <Upload size={32} color="#00ff88" />}
                        <h1 style={{ color: 'white', margin: 0, fontSize: '32px' }}>
                            {mode === 'save' ? 'Save Game' : 'Load Game'}
                        </h1>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <X size={20} />
                        Close
                    </button>
                </div>

                {/* Slots */}
                <div style={{ padding: '30px' }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '20px', fontSize: '16px' }}>
                        {mode === 'save'
                            ? 'Select a slot to save your current game'
                            : 'Select a saved game to load'}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {savedGames.map((game, index) => (
                            <div
                                key={index}
                                style={{
                                    background: game
                                        ? 'rgba(0, 255, 136, 0.1)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    border: '2px solid',
                                    borderColor: game
                                        ? 'rgba(0, 255, 136, 0.3)'
                                        : 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '15px',
                                    padding: '20px',
                                    cursor: mode === 'load' && !game ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s',
                                    opacity: mode === 'load' && !game ? 0.5 : 1,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                                onClick={() => {
                                    if (mode === 'save') {
                                        onSave(index);
                                    } else if (game) {
                                        onLoad(index);
                                    }
                                }}
                                onMouseEnter={(e) => {
                                    if (mode === 'save' || game) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.borderColor = '#00ff88';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = game
                                        ? 'rgba(0, 255, 136, 0.3)'
                                        : 'rgba(255, 255, 255, 0.1)';
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontSize: '20px',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        marginBottom: '8px'
                                    }}>
                                        Slot {index + 1}
                                    </div>

                                    {game ? (
                                        <>
                                            <div style={{
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                fontSize: '14px',
                                                marginBottom: '5px'
                                            }}>
                                                📅 {formatDate(game.savedAt)}
                                            </div>
                                            <div style={{
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                fontSize: '14px',
                                                marginBottom: '5px'
                                            }}>
                                                🎯 {game.moveCount} moves • {game.difficulty} difficulty
                                            </div>
                                            <div style={{
                                                color: game.isGameOver
                                                    ? (game.winner === 'Draw' ? '#ffcc00' : '#00ff88')
                                                    : '#2196F3',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}>
                                                {getResultText(game)}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{
                                            color: 'rgba(255, 255, 255, 0.4)',
                                            fontSize: '14px',
                                            fontStyle: 'italic'
                                        }}>
                                            Empty slot
                                        </div>
                                    )}
                                </div>

                                {game && mode === 'load' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(index);
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 0, 0, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                        }}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '2px solid rgba(255, 0, 0, 0.3)',
                                            color: '#ff4444',
                                            padding: '10px 15px',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginLeft: '15px'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

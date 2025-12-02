import { useState } from 'react';
import { Download, Upload, Copy, FileText, X, Check } from 'lucide-react';

interface PGNModalProps {
    mode: 'export' | 'import';
    currentPGN: string;
    onClose: () => void;
    onImport: (pgn: string) => boolean;
}

export const PGNModal = ({ mode, currentPGN, onClose, onImport }: PGNModalProps) => {
    const [importText, setImportText] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(currentPGN);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPGN = () => {
        const blob = new Blob([currentPGN], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chess-game-${new Date().toISOString().slice(0, 10)}.pgn`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportPGN = () => {
        if (!importText.trim()) {
            setError('Please enter a PGN string');
            return;
        }

        const success = onImport(importText);
        if (success) {
            onClose();
        } else {
            setError('Invalid PGN format. Please check your input.');
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setImportText(text);
            setError('');
        };
        reader.readAsText(file);
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
                maxWidth: '700px',
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
                        <FileText size={32} color="#00ff88" />
                        <h1 style={{ color: 'white', margin: 0, fontSize: '32px' }}>
                            {mode === 'export' ? 'Export PGN' : 'Import PGN'}
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

                {/* Content */}
                <div style={{ padding: '30px' }}>
                    {mode === 'export' ? (
                        <>
                            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px', fontSize: '16px' }}>
                                Export your game in PGN (Portable Game Notation) format to share or analyze in other chess tools.
                            </p>

                            {/* PGN Display */}
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '20px',
                                maxHeight: '300px',
                                overflow: 'auto',
                                fontFamily: 'monospace',
                                fontSize: '14px',
                                color: '#00ff88',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {currentPGN || 'No moves yet'}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button
                                    onClick={handleCopyToClipboard}
                                    style={{
                                        flex: 1,
                                        background: copied
                                            ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                                            : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '15px 25px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {copied ? <Check size={20} /> : <Copy size={20} />}
                                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                                </button>

                                <button
                                    onClick={handleDownloadPGN}
                                    style={{
                                        flex: 1,
                                        background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '15px 25px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <Download size={20} />
                                    Download PGN File
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px', fontSize: '16px' }}>
                                Import a game from PGN format. You can paste PGN text or upload a .pgn file.
                            </p>

                            {/* File Upload */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    color: 'white',
                                    marginBottom: '10px',
                                    fontSize: '16px',
                                    fontWeight: '600'
                                }}>
                                    Upload PGN File
                                </label>
                                <input
                                    type="file"
                                    accept=".pgn,.txt"
                                    onChange={handleFileUpload}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '2px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        fontSize: '14px',
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>

                            {/* Or Divider */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                margin: '20px 0',
                                color: 'rgba(255, 255, 255, 0.5)'
                            }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />
                                <span>OR</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />
                            </div>

                            {/* Text Input */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    color: 'white',
                                    marginBottom: '10px',
                                    fontSize: '16px',
                                    fontWeight: '600'
                                }}>
                                    Paste PGN Text
                                </label>
                                <textarea
                                    value={importText}
                                    onChange={(e) => {
                                        setImportText(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Paste PGN notation here...&#10;Example: 1. e4 e5 2. Nf3 Nc6 3. Bb5..."
                                    style={{
                                        width: '100%',
                                        minHeight: '200px',
                                        padding: '15px',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        border: '2px solid',
                                        borderColor: error ? '#ff4444' : 'rgba(255, 255, 255, 0.2)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontFamily: 'monospace',
                                        resize: 'vertical',
                                        outline: 'none'
                                    }}
                                />
                                {error && (
                                    <div style={{
                                        color: '#ff4444',
                                        fontSize: '14px',
                                        marginTop: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span>⚠</span>
                                        {error}
                                    </div>
                                )}
                            </div>

                            {/* Import Button */}
                            <button
                                onClick={handleImportPGN}
                                disabled={!importText.trim()}
                                style={{
                                    width: '100%',
                                    background: importText.trim()
                                        ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                                        : 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '15px 25px',
                                    borderRadius: '12px',
                                    cursor: importText.trim() ? 'pointer' : 'not-allowed',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    transition: 'all 0.3s',
                                    opacity: importText.trim() ? 1 : 0.5
                                }}
                            >
                                <Upload size={20} />
                                Import Game
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

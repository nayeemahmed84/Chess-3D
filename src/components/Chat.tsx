import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle, Lock, Shield } from 'lucide-react';
import { multiplayerService } from '../services/MultiplayerService';
import messageSoundUrl from '../assets/sounds/message.mp3';

interface Message {
    id: string;
    sender: 'me' | 'opponent';
    text: string;
    timestamp: number;
}

interface ChatProps {
    isOpen: boolean;
    onToggle: () => void;
    isOpponentConnected: boolean;
}

const Chat: React.FC<ChatProps> = ({ isOpen, onToggle, isOpponentConnected }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<number | null>(null);
    const notificationSound = useRef(new Audio(messageSoundUrl));

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Reset unread count when opened
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    // Handle incoming messages via custom event
    useEffect(() => {
        const handleChatEvent = (e: CustomEvent<string>) => {
            const newMessage: Message = {
                id: Date.now().toString(),
                sender: 'opponent',
                text: e.detail,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, newMessage]);

            // Play sound
            notificationSound.current.currentTime = 0;
            notificationSound.current.play().catch(e => console.log('Audio play failed:', e));

            if (!isOpen) setUnreadCount(prev => prev + 1);

            // Clear typing indicator when message received
            setIsTyping(false);
        };

        const handleTypingEvent = (e: CustomEvent<boolean>) => {
            setIsTyping(e.detail);
        };

        window.addEventListener('chess-chat-message' as any, handleChatEvent as any);
        window.addEventListener('chess-chat-typing' as any, handleTypingEvent as any);

        return () => {
            window.removeEventListener('chess-chat-message' as any, handleChatEvent as any);
            window.removeEventListener('chess-chat-typing' as any, handleTypingEvent as any);
        };
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);

        // Send typing status
        if (isOpponentConnected) {
            multiplayerService.sendData({ type: 'typing', payload: true });

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                window.clearTimeout(typingTimeoutRef.current);
            }

            // Set new timeout to stop typing after 1 second of inactivity
            typingTimeoutRef.current = window.setTimeout(() => {
                multiplayerService.sendData({ type: 'typing', payload: false });
            }, 1000);
        }
    };

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !isOpponentConnected) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            sender: 'me',
            text: inputText.trim(),
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, newMessage]);
        multiplayerService.sendData({
            type: 'chat',
            payload: inputText.trim()
        });
        setInputText('');
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={onToggle}
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    zIndex: 100
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <MessageCircle size={24} />
                {unreadCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #1a1a1a'
                    }}>
                        {unreadCount}
                    </div>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '20px',
                    width: '300px',
                    height: '400px',
                    background: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    zIndex: 100,
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.02)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield size={16} color="#4ade80" />
                            <span style={{ fontWeight: 600, fontSize: '14px', color: 'white' }}>Encrypted Chat</span>
                        </div>
                        <button
                            onClick={onToggle}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Security Notice */}
                    <div style={{
                        padding: '8px',
                        background: 'rgba(74, 222, 128, 0.1)',
                        fontSize: '10px',
                        color: '#4ade80',
                        textAlign: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                    }}>
                        <Lock size={10} />
                        Messages are end-to-end encrypted and not saved.
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.3, fontSize: '13px' }}>
                                <MessageCircle size={32} style={{ marginBottom: '8px' }} />
                                <p>No messages yet.</p>
                                <p>Say hello! 👋</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} style={{
                                    alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%'
                                }}>
                                    <div style={{
                                        background: msg.sender === 'me' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                                        padding: '8px 12px',
                                        borderRadius: msg.sender === 'me' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                        fontSize: '13px',
                                        color: 'white',
                                        wordBreak: 'break-word'
                                    }}>
                                        {msg.text}
                                    </div>
                                    <div style={{
                                        fontSize: '10px',
                                        opacity: 0.4,
                                        marginTop: '4px',
                                        textAlign: msg.sender === 'me' ? 'right' : 'left'
                                    }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Typing Indicator */}
                        {isTyping && (
                            <div style={{
                                alignSelf: 'flex-start',
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '8px 12px',
                                borderRadius: '12px 12px 12px 0',
                                fontSize: '12px',
                                color: 'rgba(255, 255, 255, 0.7)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                animation: 'fadeIn 0.2s ease'
                            }}>
                                <span style={{ animation: 'bounce 1s infinite', animationDelay: '0s' }}>•</span>
                                <span style={{ animation: 'bounce 1s infinite', animationDelay: '0.2s' }}>•</span>
                                <span style={{ animation: 'bounce 1s infinite', animationDelay: '0.4s' }}>•</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} style={{
                        padding: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        gap: '8px',
                        background: 'rgba(0, 0, 0, 0.2)'
                    }}>
                        <input
                            type="text"
                            value={inputText}
                            onChange={handleInputChange}
                            placeholder={isOpponentConnected ? "Type a message..." : "Opponent disconnected"}
                            disabled={!isOpponentConnected}
                            style={{
                                flex: 1,
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                padding: '8px 16px',
                                color: 'white',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim() || !isOpponentConnected}
                            style={{
                                background: inputText.trim() && isOpponentConnected ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                cursor: inputText.trim() && isOpponentConnected ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default Chat;

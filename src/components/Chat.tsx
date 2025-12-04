import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle, Lock, Shield, Smile, Paperclip, Trash2 } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { multiplayerService } from '../services/MultiplayerService';
import messageSoundUrl from '../assets/sounds/message.mp3';

interface Reaction {
    emoji: string;
    count: number;
    userReacted: boolean;
}

interface Message {
    id: string;
    sender: 'me' | 'opponent';
    text?: string;
    image?: string;
    timestamp: number;
    reactions: { [emoji: string]: Reaction };
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

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isTyping]);

    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleChatEvent = (e: CustomEvent<{ text: string, id: string, timestamp: number }>) => {
            const newMessage: Message = {
                id: e.detail.id,
                sender: 'opponent',
                text: e.detail.text,
                timestamp: e.detail.timestamp,
                reactions: {}
            };
            setMessages(prev => [...prev, newMessage]);
            playSound();
            if (!isOpen) setUnreadCount(prev => prev + 1);
            setIsTyping(false);
        };

        const handleImageEvent = (e: CustomEvent<{ image: string, id: string, timestamp: number }>) => {
            const newMessage: Message = {
                id: e.detail.id,
                sender: 'opponent',
                image: e.detail.image,
                timestamp: e.detail.timestamp,
                reactions: {}
            };
            setMessages(prev => [...prev, newMessage]);
            playSound();
            if (!isOpen) setUnreadCount(prev => prev + 1);
            setIsTyping(false);
        };

        const handleTypingEvent = (e: CustomEvent<boolean>) => {
            setIsTyping(e.detail);
        };

        const handleReactionEvent = (e: CustomEvent<{ messageId: string, emoji: string, remove?: boolean }>) => {
            const { messageId, emoji, remove } = e.detail;
            if (remove) {
                setMessages(prev => prev.map(msg => {
                    if (msg.id === messageId && msg.reactions[emoji]) {
                        const newCount = msg.reactions[emoji].count - 1;
                        if (newCount === 0) {
                            const { [emoji]: removed, ...remainingReactions } = msg.reactions;
                            return { ...msg, reactions: remainingReactions };
                        }
                        return {
                            ...msg,
                            reactions: {
                                ...msg.reactions,
                                [emoji]: {
                                    ...msg.reactions[emoji],
                                    count: newCount
                                }
                            }
                        };
                    }
                    return msg;
                }));
            } else {
                addReaction(messageId, emoji, false);
            }
            // Play sound for reaction
            playSound();
        };

        const handleClearHistoryEvent = () => {
            setMessages([]);
        };

        window.addEventListener('chess-chat-message' as any, handleChatEvent as any);
        window.addEventListener('chess-chat-image' as any, handleImageEvent as any);
        window.addEventListener('chess-chat-typing' as any, handleTypingEvent as any);
        window.addEventListener('chess-chat-reaction' as any, handleReactionEvent as any);
        window.addEventListener('chess-chat-clear' as any, handleClearHistoryEvent as any);

        return () => {
            window.removeEventListener('chess-chat-message' as any, handleChatEvent as any);
            window.removeEventListener('chess-chat-image' as any, handleImageEvent as any);
            window.removeEventListener('chess-chat-typing' as any, handleTypingEvent as any);
            window.removeEventListener('chess-chat-reaction' as any, handleReactionEvent as any);
            window.removeEventListener('chess-chat-clear' as any, handleClearHistoryEvent as any);
        };
    }, [isOpen]);

    const playSound = () => {
        try {
            const audio = notificationSound.current;
            audio.currentTime = 0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => console.log('Audio play failed:', e));
            }
        } catch (error) {
            console.log('Sound playback error:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        sendTypingStatus(true);
    };

    const sendTypingStatus = (isTyping: boolean) => {
        if (isOpponentConnected) {
            multiplayerService.sendData({ type: 'typing', payload: isTyping });

            if (typingTimeoutRef.current) {
                window.clearTimeout(typingTimeoutRef.current);
            }

            if (isTyping) {
                typingTimeoutRef.current = window.setTimeout(() => {
                    multiplayerService.sendData({ type: 'typing', payload: false });
                }, 1000);
            }
        }
    };

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !isOpponentConnected) return;

        const messageId = Date.now().toString();
        const timestamp = Date.now();
        const newMessage: Message = {
            id: messageId,
            sender: 'me',
            text: inputText.trim(),
            timestamp: timestamp,
            reactions: {}
        };

        setMessages(prev => [...prev, newMessage]);
        multiplayerService.sendData({
            type: 'chat',
            payload: { text: inputText.trim(), id: messageId, timestamp: timestamp }
        });
        setInputText('');
        setShowEmojiPicker(false);
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setInputText(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && isOpponentConnected) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                const messageId = Date.now().toString();
                const timestamp = Date.now();
                const newMessage: Message = {
                    id: messageId,
                    sender: 'me',
                    image: base64String,
                    timestamp: timestamp,
                    reactions: {}
                };
                setMessages(prev => [...prev, newMessage]);
                multiplayerService.sendData({
                    type: 'image',
                    payload: { image: base64String, id: messageId, timestamp: timestamp }
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const addReaction = (messageId: string, emoji: string, isMe: boolean) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const existingReaction = msg.reactions[emoji];

                if (existingReaction && (isMe ? existingReaction.userReacted : existingReaction.count > 0)) {
                    const newCount = existingReaction.count - 1;
                    if (newCount === 0) {
                        const { [emoji]: removed, ...remainingReactions } = msg.reactions;
                        return {
                            ...msg,
                            reactions: remainingReactions
                        };
                    }
                    return {
                        ...msg,
                        reactions: {
                            ...msg.reactions,
                            [emoji]: {
                                ...existingReaction,
                                count: newCount,
                                userReacted: isMe ? false : existingReaction.userReacted
                            }
                        }
                    };
                }

                return {
                    ...msg,
                    reactions: {
                        ...msg.reactions,
                        [emoji]: {
                            emoji,
                            count: (existingReaction?.count || 0) + 1,
                            userReacted: isMe ? true : (existingReaction?.userReacted || false)
                        }
                    }
                };
            }
            return msg;
        }));
    };

    const handleReactionClick = (messageId: string, emoji: string) => {
        if (!isOpponentConnected) return;

        const message = messages.find(m => m.id === messageId);
        const hasReacted = message?.reactions[emoji]?.userReacted;

        addReaction(messageId, emoji, true);
        multiplayerService.sendData({
            type: 'reaction',
            payload: { messageId, emoji, remove: hasReacted }
        });
    };

    const handleClearHistory = () => {
        if (!isOpponentConnected) return;
        setMessages([]);
        multiplayerService.sendData({ type: 'chat_clear', payload: true });
    };

    return (
        <>
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

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: '20px',
                    width: '320px',
                    height: '450px',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={handleClearHistory}
                                disabled={!isOpponentConnected || messages.length === 0}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: messages.length > 0 && isOpponentConnected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)',
                                    cursor: messages.length > 0 && isOpponentConnected ? 'pointer' : 'not-allowed',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                title="Clear chat history"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                onClick={onToggle}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

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
                                <div
                                    key={msg.id}
                                    style={{
                                        alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                                        maxWidth: '80%',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                                    onMouseLeave={() => setHoveredMessageId(null)}
                                >
                                    <div style={{
                                        background: msg.sender === 'me' ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                                        padding: msg.image ? '4px' : '8px 12px',
                                        borderRadius: msg.sender === 'me' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                        fontSize: '13px',
                                        color: 'white',
                                        wordBreak: 'break-word',
                                        position: 'relative',
                                        marginBottom: Object.values(msg.reactions).length > 0 ? '14px' : '0'
                                    }}>
                                        {msg.image ? (
                                            <img src={msg.image} alt="Shared" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                                        ) : (
                                            msg.text
                                        )}

                                        {Object.values(msg.reactions).length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '-14px',
                                                right: msg.sender === 'me' ? '0' : 'auto',
                                                left: msg.sender === 'me' ? 'auto' : '0',
                                                display: 'flex',
                                                gap: '2px',
                                                background: 'rgba(0,0,0,0.5)',
                                                borderRadius: '10px',
                                                padding: '2px 4px',
                                                fontSize: '10px'
                                            }}>
                                                {Object.values(msg.reactions).map(r => (
                                                    <span key={r.emoji}>{r.emoji} {r.count > 1 ? r.count : ''}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {hoveredMessageId === msg.id && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-20px',
                                            left: msg.sender === 'me' ? 'auto' : '0',
                                            right: msg.sender === 'me' ? '0' : 'auto',
                                            background: 'rgba(0,0,0,0.8)',
                                            borderRadius: '12px',
                                            padding: '2px',
                                            display: 'flex',
                                            gap: '4px',
                                            zIndex: 10
                                        }}>
                                            {['👍', '❤️', '😂', '😮'].map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleReactionClick(msg.id, emoji)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        padding: '2px'
                                                    }}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}

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
                                <span style={{ animation: ' bounce 1s infinite', animationDelay: '0.4s' }}>•</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{
                        padding: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(0, 0, 0, 0.2)',
                        position: 'relative'
                    }}>
                        {showEmojiPicker && (
                            <div style={{ position: 'absolute', bottom: '60px', left: '10px', zIndex: 200 }}>
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={'dark' as any}
                                    width={280}
                                    height={300}
                                />
                            </div>
                        )}

                        <form onSubmit={handleSend} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <Smile size={18} />
                            </button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexShrink: 0
                                }}
                            >
                                <Paperclip size={18} />
                            </button>

                            <input
                                type="text"
                                value={inputText}
                                onChange={handleInputChange}
                                placeholder={isOpponentConnected ? "Type a message..." : "Opponent disconnected"}
                                disabled={!isOpponentConnected}
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '20px',
                                    padding: '8px 12px',
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
                                    minWidth: '36px',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    cursor: inputText.trim() && isOpponentConnected ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s ease',
                                    flexShrink: 0
                                }}
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chat;

import Peer, { DataConnection } from 'peerjs';

export interface MultiplayerData {
    type: 'move' | 'game_start' | 'game_over' | 'chat' | 'interaction' | 'heartbeat' | 'typing' | 'reaction' | 'image' | 'chat_clear' | 'chat_delete' | 'chat_read' | 'chat_edit';
    payload: any;
}

class MultiplayerService {
    private peer: Peer | null = null;
    private conn: DataConnection | null = null;
    private onDataCallbacks: ((data: MultiplayerData) => void)[] = [];
    private onConnectCallbacks: (() => void)[] = [];
    private onDisconnectCallbacks: (() => void)[] = [];
    private heartbeatInterval: number | null = null;
    private heartbeatTimeoutId: number | null = null;
    private lastHeartbeatReceived: number = 0;

    public myId: string = '';

    private onErrorCallbacks: ((error: string) => void)[] = [];

    initialize(onId: (id: string) => void) {
        if (this.peer) {
            if (this.myId) {
                onId(this.myId);
            }
            return;
        }

        this.peer = new Peer();
        console.log('[MultiplayerService] Initializing new Peer...');

        this.peer.on('open', (id) => {
            console.log('[MultiplayerService] ✓ Peer initialized successfully. My ID:', id);
            this.myId = id;
            onId(id);
        });

        this.peer.on('connection', (conn) => {
            console.log('[MultiplayerService] ✓ Incoming connection from:', conn.peer);
            this.handleConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.error('[MultiplayerService] ✗ PeerJS error:', err);
            console.error('[MultiplayerService] Error type:', err.type);
            this.triggerError(`Connection failed: ${err.type || 'Unknown error'}`);
        });
    }

    connect(peerId: string) {
        if (!this.peer) {
            console.error('[MultiplayerService] Cannot connect: Peer not initialized');
            this.triggerError('Peer service not initialized. Please refresh and try again.');
            return;
        }

        if (this.peer.disconnected) {
            console.error('[MultiplayerService] Cannot connect: Peer is disconnected from server');
            this.triggerError('Not connected to server. Please wait a moment and try again.');
            return;
        }

        if (!this.myId) {
            console.error('[MultiplayerService] Cannot connect: myId not set yet');
            this.triggerError('Still initializing. Please wait a moment and try again.');
            return;
        }

        console.log('[MultiplayerService] My ID:', this.myId);
        console.log('[MultiplayerService] Connecting to peer ID:', peerId);
        console.log('[MultiplayerService] Peer state:', this.peer.disconnected ? 'disconnected' : 'connected');

        const conn = this.peer.connect(peerId);

        if (!conn) {
            console.error('[MultiplayerService] peer.connect() returned undefined');
            this.triggerError('Failed to create connection. Please check the Room ID and try again.');
            return;
        }

        console.log('[MultiplayerService] Connection object created:', conn);
        this.handleConnection(conn);
    }

    private handleConnection(conn: DataConnection) {
        this.conn = conn;

        this.conn.on('open', () => {
            console.log('Connection established!');
            this.onConnectCallbacks.forEach(cb => cb());
            this.startHeartbeat();
        });

        this.conn.on('data', (data) => {
            const typedData = data as MultiplayerData;

            if (typedData.type === 'heartbeat') {
                this.lastHeartbeatReceived = Date.now();
                return;
            }
            if (typedData.type === 'chat') { window.dispatchEvent(new CustomEvent('chess-chat-message', { detail: typedData.payload })); return; }
            if (typedData.type === 'typing') { window.dispatchEvent(new CustomEvent('chess-chat-typing', { detail: typedData.payload })); return; }
            if (typedData.type === 'reaction') { window.dispatchEvent(new CustomEvent('chess-chat-reaction', { detail: typedData.payload })); return; }
            if (typedData.type === 'image') { window.dispatchEvent(new CustomEvent('chess-chat-image', { detail: typedData.payload })); return; }
            if (typedData.type === 'chat_clear') { window.dispatchEvent(new CustomEvent('chess-chat-clear', { detail: typedData.payload })); return; }
            if (typedData.type === 'chat_delete') { window.dispatchEvent(new CustomEvent('chess-chat-delete', { detail: typedData.payload })); return; }
            if (typedData.type === 'chat_read') { window.dispatchEvent(new CustomEvent('chess-chat-read', { detail: typedData.payload })); return; }
            if (typedData.type === 'chat_edit') { window.dispatchEvent(new CustomEvent('chess-chat-edit', { detail: typedData.payload })); return; }

            this.onDataCallbacks.forEach(cb => cb(typedData));
        });

        this.conn.on('close', () => {
            console.log('Connection closed');
            this.conn = null;
            this.stopHeartbeat();
            this.onDisconnectCallbacks.forEach(cb => cb());
        });

        this.conn.on('error', (err) => {
            console.error('Connection error:', err);
            this.triggerDisconnect();
            this.triggerError(err.message || 'Connection Error');
        });
    }

    private triggerError(error: string) {
        this.onErrorCallbacks.forEach(cb => cb(error));
    }

    onError(callback: (error: string) => void) {
        this.onErrorCallbacks.push(callback);
        return () => {
            this.onErrorCallbacks = this.onErrorCallbacks.filter(cb => cb !== callback);
        };
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.lastHeartbeatReceived = Date.now();

        // Send heartbeat every 3 seconds
        this.heartbeatInterval = window.setInterval(() => {
            if (this.conn && this.conn.open) {
                this.conn.send({ type: 'heartbeat', payload: null });
                console.log('[Heartbeat] Sent to peer');
            }
        }, 3000);

        // Check for missing heartbeats every 8 seconds
        // If no heartbeat received in last 10 seconds, disconnect
        this.heartbeatTimeoutId = window.setInterval(() => {
            const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeatReceived;
            console.log(`[Heartbeat] Time since last: ${timeSinceLastHeartbeat}ms`);

            if (timeSinceLastHeartbeat > 10000) {
                console.log('[Heartbeat] Timeout - no heartbeat received, triggering disconnect');
                this.triggerDisconnect();
            }
        }, 8000);
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.heartbeatTimeoutId) {
            clearInterval(this.heartbeatTimeoutId);
            this.heartbeatTimeoutId = null;
        }
    }

    private triggerDisconnect() {
        console.log('[MultiplayerService] Triggering disconnect');
        this.stopHeartbeat();

        if (this.conn) {
            this.conn.close();
            this.conn = null;
        }

        this.onDisconnectCallbacks.forEach(cb => cb());
    }

    sendData(data: MultiplayerData) {
        if (this.conn && this.conn.open) {
            this.conn.send(data);
        } else {
            console.warn('Cannot send data, connection not open');
        }
    }

    onData(callback: (data: MultiplayerData) => void) {
        this.onDataCallbacks.push(callback);
        return () => {
            this.onDataCallbacks = this.onDataCallbacks.filter(cb => cb !== callback);
        };
    }

    onConnect(callback: () => void) {
        this.onConnectCallbacks.push(callback);
        // If already connected, fire the callback immediately
        if (this.conn && this.conn.open) {
            callback();
        }
        return () => {
            this.onConnectCallbacks = this.onConnectCallbacks.filter(cb => cb !== callback);
        };
    }

    onDisconnect(callback: () => void) {
        this.onDisconnectCallbacks.push(callback);
        return () => {
            this.onDisconnectCallbacks = this.onDisconnectCallbacks.filter(cb => cb !== callback);
        };
    }

    isConnected(): boolean {
        return this.conn !== null && this.conn.open;
    }

    disconnect() {
        this.stopHeartbeat();
        if (this.conn) {
            this.conn.close();
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
    }
}

export const multiplayerService = new MultiplayerService();

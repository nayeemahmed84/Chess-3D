import Peer, { DataConnection } from 'peerjs';

export interface MultiplayerData {
    type: 'move' | 'game_start' | 'game_over' | 'chat' | 'interaction' | 'heartbeat' | 'typing' | 'reaction' | 'image' | 'chat_clear';
    payload: any;
}

class MultiplayerService {
    private peer: Peer | null = null;
    private conn: DataConnection | null = null;
    private onDataCallback: ((data: MultiplayerData) => void) | null = null;
    private onConnectCallback: (() => void) | null = null;
    private onDisconnectCallback: (() => void) | null = null;
    private heartbeatInterval: number | null = null;
    private heartbeatTimeoutId: number | null = null;
    private lastHeartbeatReceived: number = 0;

    public myId: string = '';

    initialize(onId: (id: string) => void) {
        if (this.peer) return;

        this.peer = new Peer();

        this.peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            this.myId = id;
            onId(id);
        });

        this.peer.on('connection', (conn) => {
            console.log('Incoming connection from: ' + conn.peer);
            this.handleConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.error('PeerJS error:', err);
        });
    }

    connect(peerId: string) {
        if (!this.peer) return;
        console.log('Connecting to: ' + peerId);
        const conn = this.peer.connect(peerId);
        this.handleConnection(conn);
    }

    private handleConnection(conn: DataConnection) {
        this.conn = conn;

        this.conn.on('open', () => {
            console.log('Connection established!');
            if (this.onConnectCallback) this.onConnectCallback();
            this.startHeartbeat();
        });

        this.conn.on('data', (data) => {
            const typedData = data as MultiplayerData;

            // Handle heartbeat separately
            if (typedData.type === 'heartbeat') {
                this.lastHeartbeatReceived = Date.now();
                console.log('[Heartbeat] Received from peer');
                return;
            }

            // Handle chat messages
            if (typedData.type === 'chat') {
                window.dispatchEvent(new CustomEvent('chess-chat-message', { detail: typedData.payload }));
                return;
            }

            // Handle typing status
            if (typedData.type === 'typing') {
                window.dispatchEvent(new CustomEvent('chess-chat-typing', { detail: typedData.payload }));
                return;
            }

            // Handle reactions
            if (typedData.type === 'reaction') {
                window.dispatchEvent(new CustomEvent('chess-chat-reaction', { detail: typedData.payload }));
                return;
            }

            // Handle images
            if (typedData.type === 'image') {
                window.dispatchEvent(new CustomEvent('chess-chat-image', { detail: typedData.payload }));
                return;
            }

            // Handle clear chat history
            if (typedData.type === 'chat_clear') {
                window.dispatchEvent(new CustomEvent('chess-chat-clear', { detail: typedData.payload }));
                return;
            }

            console.log('Received data:', data);
            if (this.onDataCallback) {
                this.onDataCallback(typedData);
            }
        });

        this.conn.on('close', () => {
            console.log('Connection closed');
            this.conn = null;
            this.stopHeartbeat();
            if (this.onDisconnectCallback) this.onDisconnectCallback();
        });

        this.conn.on('error', (err) => {
            console.error('Connection error:', err);
            this.triggerDisconnect();
        });
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

        if (this.onDisconnectCallback) {
            this.onDisconnectCallback();
        }
    }

    sendData(data: MultiplayerData) {
        if (this.conn && this.conn.open) {
            this.conn.send(data);
        } else {
            console.warn('Cannot send data, connection not open');
        }
    }

    onData(callback: (data: MultiplayerData) => void) {
        this.onDataCallback = callback;
    }

    onConnect(callback: () => void) {
        this.onConnectCallback = callback;
        // If already connected, fire the callback immediately
        if (this.conn && this.conn.open) {
            callback();
        }
    }

    onDisconnect(callback: () => void) {
        this.onDisconnectCallback = callback;
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

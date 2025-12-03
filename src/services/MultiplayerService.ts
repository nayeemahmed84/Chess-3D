import Peer, { DataConnection } from 'peerjs';

export interface MultiplayerData {
    type: 'move' | 'game_start' | 'game_over' | 'chat';
    payload: any;
}

class MultiplayerService {
    private peer: Peer | null = null;
    private conn: DataConnection | null = null;
    private onDataCallback: ((data: MultiplayerData) => void) | null = null;
    private onConnectCallback: (() => void) | null = null;
    private onDisconnectCallback: (() => void) | null = null;

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
        });

        this.conn.on('data', (data) => {
            console.log('Received data:', data);
            if (this.onDataCallback) {
                this.onDataCallback(data as MultiplayerData);
            }
        });

        this.conn.on('close', () => {
            console.log('Connection closed');
            this.conn = null;
            if (this.onDisconnectCallback) this.onDisconnectCallback();
        });

        this.conn.on('error', (err) => {
            console.error('Connection error:', err);
        });
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
    }

    onDisconnect(callback: () => void) {
        this.onDisconnectCallback = callback;
    }

    disconnect() {
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

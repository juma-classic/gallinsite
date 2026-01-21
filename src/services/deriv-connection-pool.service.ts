import { ConnectionStatus } from '@/types/signals';

export class DerivConnectionPoolService {
    private connections: Map<string, WebSocket> = new Map();
    private connectionStatus: Map<string, ConnectionStatus> = new Map();
    private tickSubscriptions: Map<string, Set<(tick: any) => void>> = new Map();
    private reconnectAttempts: Map<string, number> = new Map();
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private pingInterval = 30000; // 30 seconds

    // Multiple app IDs for connection pooling
    private appIds = [
        '1089', // Primary app ID
        '16929', // Secondary app ID
        '22168', // Tertiary app ID
        '23789', // Quaternary app ID
    ];

    private currentAppIndex = 0;
    private static instance: DerivConnectionPoolService;

    constructor() {
        if (DerivConnectionPoolService.instance) {
            return DerivConnectionPoolService.instance;
        }
        DerivConnectionPoolService.instance = this;
        this.initializeConnections();
    }

    static getInstance(): DerivConnectionPoolService {
        if (!DerivConnectionPoolService.instance) {
            DerivConnectionPoolService.instance = new DerivConnectionPoolService();
        }
        return DerivConnectionPoolService.instance;
    }

    private async initializeConnections(): Promise<void> {
        for (const appId of this.appIds) {
            await this.createConnection(appId);
        }
    }

    private async createConnection(appId: string): Promise<void> {
        try {
            const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${appId}`;
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log(`Connected to Deriv WebSocket with app ID: ${appId}`);
                this.connections.set(appId, ws);
                this.updateConnectionStatus(appId, {
                    isConnected: true,
                    connectionId: appId,
                    appId,
                    lastPing: Date.now(),
                    quality: 'EXCELLENT',
                    tickCount: 0,
                });
                this.reconnectAttempts.set(appId, 0);
                this.startPingInterval(appId);
            };

            ws.onmessage = event => {
                this.handleMessage(appId, JSON.parse(event.data));
            };

            ws.onclose = () => {
                console.log(`Disconnected from Deriv WebSocket with app ID: ${appId}`);
                this.updateConnectionStatus(appId, {
                    isConnected: false,
                    connectionId: appId,
                    appId,
                    lastPing: Date.now(),
                    quality: 'DISCONNECTED',
                    tickCount: 0,
                });
                this.handleReconnection(appId);
            };

            ws.onerror = error => {
                console.error(`WebSocket error for app ID ${appId}:`, error);
                this.updateConnectionStatus(appId, {
                    isConnected: false,
                    connectionId: appId,
                    appId,
                    lastPing: Date.now(),
                    quality: 'POOR',
                    tickCount: 0,
                });
            };
        } catch (error) {
            console.error(`Failed to create connection for app ID ${appId}:`, error);
        }
    }

    private handleMessage(appId: string, message: any): void {
        if (message.msg_type === 'tick') {
            this.handleTick(appId, message);
        } else if (message.msg_type === 'pong') {
            this.handlePong(appId);
        }
    }

    private handleTick(appId: string, tick: any): void {
        const status = this.connectionStatus.get(appId);
        if (status) {
            status.tickCount++;
            status.lastPing = Date.now();
            this.updateConnectionStatus(appId, status);
        }

        // Notify all subscribers
        const subscribers = this.tickSubscriptions.get(tick.echo_req?.ticks || 'default');
        if (subscribers) {
            subscribers.forEach(callback => callback(tick));
        }
    }

    private handlePong(appId: string): void {
        const status = this.connectionStatus.get(appId);
        if (status) {
            status.lastPing = Date.now();
            status.quality = 'EXCELLENT';
            this.updateConnectionStatus(appId, status);
        }
    }

    private startPingInterval(appId: string): void {
        setInterval(() => {
            const ws = this.connections.get(appId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ ping: 1 }));
            }
        }, this.pingInterval);
    }

    private handleReconnection(appId: string): void {
        const attempts = this.reconnectAttempts.get(appId) || 0;
        if (attempts < this.maxReconnectAttempts) {
            setTimeout(
                () => {
                    console.log(`Attempting to reconnect app ID ${appId}, attempt ${attempts + 1}`);
                    this.reconnectAttempts.set(appId, attempts + 1);
                    this.createConnection(appId);
                },
                this.reconnectDelay * Math.pow(2, attempts)
            );
        }
    }

    private updateConnectionStatus(appId: string, status: ConnectionStatus): void {
        this.connectionStatus.set(appId, status);
    }

    public getActiveConnection(): WebSocket | null {
        for (const [, ws] of this.connections) {
            if (ws.readyState === WebSocket.OPEN) {
                return ws;
            }
        }
        return null;
    }

    public getBestConnection(): WebSocket | null {
        let bestConnection: WebSocket | null = null;
        let bestQuality = 'DISCONNECTED';

        for (const [appId, ws] of this.connections) {
            const status = this.connectionStatus.get(appId);
            if (ws.readyState === WebSocket.OPEN && status) {
                if (status.quality === 'EXCELLENT') {
                    return ws;
                }
                if (status.quality === 'GOOD' && bestQuality !== 'EXCELLENT') {
                    bestConnection = ws;
                    bestQuality = 'GOOD';
                }
            }
        }

        return bestConnection;
    }

    public subscribeToTicks(symbol: string, callback: (tick: any) => void): () => void {
        const ws = this.getBestConnection();
        if (!ws) {
            throw new Error('No active connection available');
        }

        // Subscribe to ticks
        ws.send(
            JSON.stringify({
                ticks: symbol,
                subscribe: 1,
            })
        );

        // Add callback to subscribers
        if (!this.tickSubscriptions.has(symbol)) {
            this.tickSubscriptions.set(symbol, new Set());
        }
        this.tickSubscriptions.get(symbol)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.tickSubscriptions.get(symbol)?.delete(callback);
            if (this.tickSubscriptions.get(symbol)?.size === 0) {
                // Unsubscribe from ticks if no more subscribers
                ws.send(
                    JSON.stringify({
                        forget_all: 'ticks',
                    })
                );
                this.tickSubscriptions.delete(symbol);
            }
        };
    }

    public getConnectionStatuses(): ConnectionStatus[] {
        return Array.from(this.connectionStatus.values());
    }

    public getOverallStatus(): 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' {
        const statuses = this.getConnectionStatuses();
        const connectedCount = statuses.filter(s => s.isConnected).length;

        if (connectedCount === 0) return 'DISCONNECTED';
        if (connectedCount < this.appIds.length) return 'DEGRADED';
        return 'CONNECTED';
    }

    public async sendRequest(request: any): Promise<any> {
        const ws = this.getBestConnection();
        if (!ws) {
            throw new Error('No active connection available');
        }

        return new Promise((resolve, reject) => {
            const requestId = Math.random().toString(36).substring(7);
            const requestWithId = { ...request, req_id: requestId };

            const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
            }, 10000);

            const messageHandler = (event: MessageEvent) => {
                const response = JSON.parse(event.data);
                if (response.req_id === requestId) {
                    clearTimeout(timeout);
                    ws.removeEventListener('message', messageHandler);
                    if (response.error) {
                        reject(new Error(response.error.message));
                    } else {
                        resolve(response);
                    }
                }
            };

            ws.addEventListener('message', messageHandler);
            ws.send(JSON.stringify(requestWithId));
        });
    }

    public disconnect(): void {
        for (const [, ws] of this.connections) {
            ws.close();
        }
        this.connections.clear();
        this.connectionStatus.clear();
        this.tickSubscriptions.clear();
    }
}

export const derivConnectionPool = DerivConnectionPoolService.getInstance();

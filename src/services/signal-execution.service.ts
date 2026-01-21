import { AutoTraderSettings, SignalsCenterSignal, TradeRecord } from '@/types/signals';
import { derivConnectionPool } from './deriv-connection-pool.service';
import { stakeManager } from './stake-manager.service';

interface ActiveTrade {
    contractId: string;
    signalId: string;
    market: string;
    type: string;
    stake: number;
    startTime: number;
    signal: SignalsCenterSignal;
}

interface ExecutionResult {
    success: boolean;
    contractId?: string;
    error?: string;
    tradeRecord?: TradeRecord;
}

export class SignalExecutionService {
    private static instance: SignalExecutionService;
    private activeTrades: Map<string, ActiveTrade> = new Map();
    private tradeHistory: TradeRecord[] = [];
    private autoTraderSettings: AutoTraderSettings = {
        enabled: false,
        maxConcurrentTrades: 1,
        riskMode: 'NORMAL',
        autoLoop: false,
        loopCount: 10,
        delayBetweenTrades: 2000,
    };
    private executionQueue: SignalsCenterSignal[] = [];
    private isProcessingQueue = false;
    private executionSubscribers: Set<(result: ExecutionResult) => void> = new Set();

    constructor() {
        if (SignalExecutionService.instance) {
            return SignalExecutionService.instance;
        }
        SignalExecutionService.instance = this;
        this.initializeService();
    }

    static getInstance(): SignalExecutionService {
        if (!SignalExecutionService.instance) {
            SignalExecutionService.instance = new SignalExecutionService();
        }
        return SignalExecutionService.instance;
    }

    private initializeService(): void {
        // Start processing queue
        this.startQueueProcessor();

        // Monitor active trades
        this.startTradeMonitoring();

        console.log('🚀 Signal Execution Service initialized');
    }

    private startQueueProcessor(): void {
        setInterval(() => {
            if (!this.isProcessingQueue && this.executionQueue.length > 0) {
                this.processExecutionQueue();
            }
        }, 1000);
    }

    private async processExecutionQueue(): Promise<void> {
        if (this.isProcessingQueue || !this.autoTraderSettings.enabled) {
            return;
        }

        this.isProcessingQueue = true;

        try {
            while (this.executionQueue.length > 0 && this.canExecuteMoreTrades()) {
                const signal = this.executionQueue.shift()!;

                // Check if signal is still valid
                if (this.isSignalValid(signal)) {
                    await this.executeSignal(signal);

                    // Delay between trades
                    if (this.autoTraderSettings.delayBetweenTrades > 0) {
                        await this.delay(this.autoTraderSettings.delayBetweenTrades);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error processing execution queue:', error);
        } finally {
            this.isProcessingQueue = false;
        }
    }

    private canExecuteMoreTrades(): boolean {
        return this.activeTrades.size < this.autoTraderSettings.maxConcurrentTrades;
    }

    private isSignalValid(signal: SignalsCenterSignal): boolean {
        if (signal.expiresAt && Date.now() > signal.expiresAt) {
            return false;
        }

        if (signal.status !== 'ACTIVE') {
            return false;
        }

        return true;
    }

    private async executeSignal(signal: SignalsCenterSignal): Promise<ExecutionResult> {
        try {
            console.log(`🎯 Executing signal: ${signal.id} - ${signal.type} on ${signal.market}`);

            // Transform signal based on risk mode
            const transformedSignal = this.transformSignalForRiskMode(signal);

            // Calculate stake
            const stake = stakeManager.calculateStake(signal, this.getRecentPerformance());

            // Prepare contract parameters
            const contractParams = this.prepareContractParameters(transformedSignal, stake);

            // Execute trade via Deriv API
            const response = await derivConnectionPool.sendRequest({
                buy: 1,
                parameters: contractParams,
                price: stake,
            });

            if (response.error) {
                const result: ExecutionResult = {
                    success: false,
                    error: response.error.message,
                };
                this.notifyExecutionSubscribers(result);
                return result;
            }

            // Create active trade record
            const activeTrade: ActiveTrade = {
                contractId: response.buy.contract_id,
                signalId: signal.id,
                market: signal.market,
                type: transformedSignal.type,
                stake,
                startTime: Date.now(),
                signal: transformedSignal,
            };

            this.activeTrades.set(response.buy.contract_id, activeTrade);

            // Create trade record
            const tradeRecord: TradeRecord = {
                contractId: response.buy.contract_id,
                timestamp: Date.now(),
                market: signal.market,
                type: transformedSignal.type,
                stake,
                profit: 0,
                status: 'ACTIVE',
                signalId: signal.id,
                entryDigit: signal.entryDigit,
            };

            this.tradeHistory.push(tradeRecord);

            const result: ExecutionResult = {
                success: true,
                contractId: response.buy.contract_id,
                tradeRecord,
            };

            console.log(`✅ Trade executed successfully: ${response.buy.contract_id}`);
            this.notifyExecutionSubscribers(result);

            return result;
        } catch (error) {
            console.error('❌ Error executing signal:', error);
            const result: ExecutionResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            this.notifyExecutionSubscribers(result);
            return result;
        }
    }

    private transformSignalForRiskMode(signal: SignalsCenterSignal): SignalsCenterSignal {
        const transformed = { ...signal };

        switch (this.autoTraderSettings.riskMode) {
            case 'LESS_RISKY':
                // Convert high-risk signals to safer alternatives
                if (signal.type === 'RISE' || signal.type === 'FALL') {
                    // Convert to EVEN/ODD which typically has better odds
                    transformed.type = signal.entryDigit && signal.entryDigit % 2 === 0 ? 'EVEN' : 'ODD';
                }
                break;

            case 'OVER3_UNDER6':
                // Force signals to Over 3 Under 6 range
                if (signal.entryDigit !== undefined) {
                    if (signal.entryDigit <= 3) {
                        transformed.type = 'OVER1-5';
                    } else if (signal.entryDigit >= 6) {
                        transformed.type = 'UNDER1-5';
                    }
                }
                break;

            case 'NORMAL':
            default:
                // No transformation needed
                break;
        }

        return transformed;
    }

    private prepareContractParameters(signal: SignalsCenterSignal, stake: number): Record<string, unknown> {
        const baseParams = {
            amount: stake,
            basis: 'stake',
            contract_type: this.mapSignalTypeToContractType(signal.type),
            currency: 'USD',
            symbol: signal.market,
            duration: 1,
            duration_unit: 't',
        };

        // Add specific parameters based on signal type
        switch (signal.type) {
            case 'RISE':
            case 'FALL':
                return {
                    ...baseParams,
                    contract_type: signal.type === 'RISE' ? 'CALL' : 'PUT',
                };

            case 'EVEN':
            case 'ODD':
                return {
                    ...baseParams,
                    contract_type: signal.type === 'EVEN' ? 'DIGITEVEN' : 'DIGITODD',
                };

            case 'OVER1-5':
            case 'UNDER1-5':
                return {
                    ...baseParams,
                    contract_type: signal.type === 'OVER1-5' ? 'DIGITOVER' : 'DIGITUNDER',
                    barrier: signal.type === 'OVER1-5' ? '5' : '5',
                };

            default:
                return baseParams;
        }
    }

    private mapSignalTypeToContractType(signalType: string): string {
        const mapping: Record<string, string> = {
            RISE: 'CALL',
            FALL: 'PUT',
            EVEN: 'DIGITEVEN',
            ODD: 'DIGITODD',
            'OVER1-5': 'DIGITOVER',
            'UNDER1-5': 'DIGITUNDER',
        };

        return mapping[signalType] || 'CALL';
    }

    private startTradeMonitoring(): void {
        setInterval(() => {
            this.monitorActiveTrades();
        }, 5000); // Check every 5 seconds
    }

    private async monitorActiveTrades(): Promise<void> {
        for (const [contractId] of this.activeTrades) {
            try {
                // Get contract status
                const response = await derivConnectionPool.sendRequest({
                    proposal_open_contract: 1,
                    contract_id: contractId,
                });

                if (response.proposal_open_contract) {
                    const contract = response.proposal_open_contract;

                    if (contract.is_settleable || contract.is_sold) {
                        // Trade completed
                        await this.handleTradeCompletion(contractId, contract);
                    }
                }
            } catch (error) {
                console.error(`❌ Error monitoring trade ${contractId}:`, error);
            }
        }
    }

    private async handleTradeCompletion(contractId: string, contract: Record<string, unknown>): Promise<void> {
        const activeTrade = this.activeTrades.get(contractId);
        if (!activeTrade) return;

        const profit = parseFloat(contract.profit) || 0;
        const isWin = profit > 0;

        // Update trade record
        const tradeRecord = this.tradeHistory.find(t => t.contractId === contractId);
        if (tradeRecord) {
            tradeRecord.profit = profit;
            tradeRecord.status = isWin ? 'WON' : 'LOST';
        }

        // Update stake manager with result
        stakeManager.updateTradeResult(isWin, profit, activeTrade.stake);

        // Remove from active trades
        this.activeTrades.delete(contractId);

        console.log(`${isWin ? '✅' : '❌'} Trade completed: ${contractId} - Profit: $${profit.toFixed(2)}`);

        // Notify subscribers
        const result: ExecutionResult = {
            success: true,
            contractId,
            tradeRecord,
        };
        this.notifyExecutionSubscribers(result);
    }

    private getRecentPerformance(): { winRate: number; totalTrades: number } {
        const recentTrades = this.tradeHistory.slice(-20); // Last 20 trades
        const completedTrades = recentTrades.filter(t => t.status !== 'ACTIVE');
        const wins = completedTrades.filter(t => t.status === 'WON').length;

        return {
            winRate: completedTrades.length > 0 ? wins / completedTrades.length : 0.5,
            totalTrades: completedTrades.length,
        };
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private notifyExecutionSubscribers(result: ExecutionResult): void {
        this.executionSubscribers.forEach(callback => {
            try {
                callback(result);
            } catch (error) {
                console.error('❌ Error in execution subscriber:', error);
            }
        });
    }

    // Public methods
    public queueSignalForExecution(signal: SignalsCenterSignal): void {
        if (!this.autoTraderSettings.enabled) {
            console.log('⚠️ Auto trader is disabled');
            return;
        }

        if (this.isSignalValid(signal)) {
            this.executionQueue.push(signal);
            console.log(`📋 Signal queued for execution: ${signal.id}`);
        } else {
            console.log(`⚠️ Signal is invalid or expired: ${signal.id}`);
        }
    }

    public async executeSignalManually(signal: SignalsCenterSignal): Promise<ExecutionResult> {
        return await this.executeSignal(signal);
    }

    public updateAutoTraderSettings(settings: Partial<AutoTraderSettings>): void {
        this.autoTraderSettings = { ...this.autoTraderSettings, ...settings };
        console.log('⚙️ Auto trader settings updated:', this.autoTraderSettings);
    }

    public getAutoTraderSettings(): AutoTraderSettings {
        return { ...this.autoTraderSettings };
    }

    public getActiveTrades(): ActiveTrade[] {
        return Array.from(this.activeTrades.values());
    }

    public getTradeHistory(): TradeRecord[] {
        return [...this.tradeHistory];
    }

    public getExecutionStats(): {
        totalTrades: number;
        activeTrades: number;
        winRate: number;
        totalProfit: number;
    } {
        const completedTrades = this.tradeHistory.filter(t => t.status !== 'ACTIVE');
        const wins = completedTrades.filter(t => t.status === 'WON').length;
        const totalProfit = completedTrades.reduce((sum, t) => sum + t.profit, 0);

        return {
            totalTrades: this.tradeHistory.length,
            activeTrades: this.activeTrades.size,
            winRate: completedTrades.length > 0 ? wins / completedTrades.length : 0,
            totalProfit,
        };
    }

    public subscribeToExecutionResults(callback: (result: ExecutionResult) => void): () => void {
        this.executionSubscribers.add(callback);

        return () => {
            this.executionSubscribers.delete(callback);
        };
    }

    public clearTradeHistory(): void {
        this.tradeHistory = [];
        console.log('🗑️ Trade history cleared');
    }

    public stopAllTrades(): void {
        // In a real implementation, this would sell all active contracts
        console.log('🛑 Stopping all active trades...');
        this.activeTrades.clear();
        this.executionQueue = [];
    }
}

export const signalExecution = SignalExecutionService.getInstance();

import { SessionStats, StakeSettings, TradeRecord } from '@/types/signals';

export class StakeManagerService {
    private static instance: StakeManagerService;
    private stakeSettings: StakeSettings = {
        baseStake: 1.0,
        martingaleMultiplier: 2.0,
        maxMartingaleSteps: 5,
        takeProfitLimit: 100,
        stopLossLimit: -50,
        autoStakeAdjustment: false,
    };

    private sessionStats: SessionStats = {
        totalProfit: 0,
        totalTrades: 0,
        winRate: 0,
        consecutiveLosses: 0,
        consecutiveWins: 0,
        maxDrawdown: 0,
        bestWinStreak: 0,
        worstLossStreak: 0,
    };

    private tradeHistory: TradeRecord[] = [];
    private currentMartingaleStep = 0;
    private sessionStartBalance = 0;
    private currentBalance = 0;

    constructor() {
        if (StakeManagerService.instance) {
            return StakeManagerService.instance;
        }
        StakeManagerService.instance = this;
        this.loadFromStorage();
    }

    static getInstance(): StakeManagerService {
        if (!StakeManagerService.instance) {
            StakeManagerService.instance = new StakeManagerService();
        }
        return StakeManagerService.instance;
    }

    private loadFromStorage(): void {
        try {
            const savedSettings = localStorage.getItem('gtraders_stake_settings');
            if (savedSettings) {
                this.stakeSettings = { ...this.stakeSettings, ...JSON.parse(savedSettings) };
            }

            const savedStats = localStorage.getItem('gtraders_session_stats');
            if (savedStats) {
                this.sessionStats = { ...this.sessionStats, ...JSON.parse(savedStats) };
            }

            const savedHistory = localStorage.getItem('gtraders_trade_history');
            if (savedHistory) {
                this.tradeHistory = JSON.parse(savedHistory);
            }

            const savedBalance = localStorage.getItem('gtraders_current_balance');
            if (savedBalance) {
                this.currentBalance = parseFloat(savedBalance);
                if (this.sessionStartBalance === 0) {
                    this.sessionStartBalance = this.currentBalance;
                }
            }
        } catch (error) {
            console.error('Error loading stake manager data from storage:', error);
        }
    }

    private saveToStorage(): void {
        try {
            localStorage.setItem('gtraders_stake_settings', JSON.stringify(this.stakeSettings));
            localStorage.setItem('gtraders_session_stats', JSON.stringify(this.sessionStats));
            localStorage.setItem('gtraders_trade_history', JSON.stringify(this.tradeHistory));
            localStorage.setItem('gtraders_current_balance', this.currentBalance.toString());
        } catch (error) {
            console.error('Error saving stake manager data to storage:', error);
        }
    }

    public calculateNextStake(): number {
        let nextStake = this.stakeSettings.baseStake;

        // Apply martingale if there are consecutive losses
        if (
            this.sessionStats.consecutiveLosses > 0 &&
            this.currentMartingaleStep < this.stakeSettings.maxMartingaleSteps
        ) {
            nextStake =
                this.stakeSettings.baseStake *
                Math.pow(this.stakeSettings.martingaleMultiplier, this.currentMartingaleStep);
        }

        // Apply auto stake adjustment based on balance
        if (this.stakeSettings.autoStakeAdjustment && this.currentBalance > 0) {
            const balanceRatio = this.currentBalance / Math.max(this.sessionStartBalance, 100);
            nextStake *= Math.max(0.1, Math.min(2.0, balanceRatio)); // Limit between 10% and 200% of base
        }

        // Ensure minimum stake
        nextStake = Math.max(0.35, nextStake);

        // Round to 2 decimal places
        return Math.round(nextStake * 100) / 100;
    }

    public recordTrade(trade: Omit<TradeRecord, 'timestamp'>): void {
        const fullTrade: TradeRecord = {
            ...trade,
            timestamp: Date.now(),
        };

        this.tradeHistory.push(fullTrade);

        // Update current balance
        this.currentBalance += trade.profit;

        // Update session statistics
        this.updateSessionStats(fullTrade);

        // Update martingale step
        if (trade.status === 'WON') {
            this.currentMartingaleStep = 0; // Reset on win
        } else if (trade.status === 'LOST') {
            this.currentMartingaleStep = Math.min(
                this.currentMartingaleStep + 1,
                this.stakeSettings.maxMartingaleSteps
            );
        }

        // Keep only last 1000 trades
        if (this.tradeHistory.length > 1000) {
            this.tradeHistory = this.tradeHistory.slice(-1000);
        }

        this.saveToStorage();
    }

    private updateSessionStats(trade: TradeRecord): void {
        this.sessionStats.totalTrades++;
        this.sessionStats.totalProfit += trade.profit;

        // Update consecutive wins/losses
        if (trade.status === 'WON') {
            this.sessionStats.consecutiveWins++;
            this.sessionStats.consecutiveLosses = 0;
            this.sessionStats.bestWinStreak = Math.max(
                this.sessionStats.bestWinStreak,
                this.sessionStats.consecutiveWins
            );
        } else if (trade.status === 'LOST') {
            this.sessionStats.consecutiveLosses++;
            this.sessionStats.consecutiveWins = 0;
            this.sessionStats.worstLossStreak = Math.max(
                this.sessionStats.worstLossStreak,
                this.sessionStats.consecutiveLosses
            );
        }

        // Calculate win rate
        const wins = this.tradeHistory.filter(t => t.status === 'WON').length;
        this.sessionStats.winRate =
            this.sessionStats.totalTrades > 0 ? Math.round((wins / this.sessionStats.totalTrades) * 10000) / 100 : 0;

        // Calculate max drawdown
        let peak = this.sessionStartBalance;
        let maxDrawdown = 0;
        let runningBalance = this.sessionStartBalance;

        this.tradeHistory.forEach(t => {
            runningBalance += t.profit;
            if (runningBalance > peak) {
                peak = runningBalance;
            }
            const drawdown = peak - runningBalance;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        });

        this.sessionStats.maxDrawdown = Math.round(maxDrawdown * 100) / 100;
        this.sessionStats.totalProfit = Math.round(this.sessionStats.totalProfit * 100) / 100;
    }

    public shouldStopTrading(): { shouldStop: boolean; reason?: string } {
        // Check stop loss limit
        if (this.sessionStats.totalProfit <= this.stakeSettings.stopLossLimit) {
            return { shouldStop: true, reason: `Stop loss limit reached: $${this.stakeSettings.stopLossLimit}` };
        }

        // Check take profit limit
        if (this.sessionStats.totalProfit >= this.stakeSettings.takeProfitLimit) {
            return { shouldStop: true, reason: `Take profit limit reached: $${this.stakeSettings.takeProfitLimit}` };
        }

        // Check maximum consecutive losses
        if (this.sessionStats.consecutiveLosses >= this.stakeSettings.maxMartingaleSteps + 2) {
            return { shouldStop: true, reason: `Too many consecutive losses: ${this.sessionStats.consecutiveLosses}` };
        }

        // Check if balance is too low for next stake
        const nextStake = this.calculateNextStake();
        if (this.currentBalance < nextStake * 2) {
            // Need at least 2x stake as buffer
            return {
                shouldStop: true,
                reason: `Insufficient balance for next trade: $${this.currentBalance.toFixed(2)}`,
            };
        }

        return { shouldStop: false };
    }

    public resetSession(): void {
        this.sessionStats = {
            totalProfit: 0,
            totalTrades: 0,
            winRate: 0,
            consecutiveLosses: 0,
            consecutiveWins: 0,
            maxDrawdown: 0,
            bestWinStreak: 0,
            worstLossStreak: 0,
        };

        this.currentMartingaleStep = 0;
        this.sessionStartBalance = this.currentBalance;
        this.tradeHistory = [];
        this.saveToStorage();
    }

    public exportTradeHistory(): string {
        const exportData = {
            settings: this.stakeSettings,
            stats: this.sessionStats,
            history: this.tradeHistory,
            exportDate: new Date().toISOString(),
            currentBalance: this.currentBalance,
        };

        return JSON.stringify(exportData, null, 2);
    }

    public importTradeHistory(data: string): boolean {
        try {
            const importData = JSON.parse(data);

            if (importData.settings) {
                this.stakeSettings = { ...this.stakeSettings, ...importData.settings };
            }

            if (importData.stats) {
                this.sessionStats = { ...this.sessionStats, ...importData.stats };
            }

            if (importData.history && Array.isArray(importData.history)) {
                this.tradeHistory = importData.history;
            }

            if (importData.currentBalance) {
                this.currentBalance = importData.currentBalance;
            }

            this.saveToStorage();
            return true;
        } catch (error) {
            console.error('Error importing trade history:', error);
            return false;
        }
    }

    // Getters
    public getStakeSettings(): StakeSettings {
        return { ...this.stakeSettings };
    }

    public getSessionStats(): SessionStats {
        return { ...this.sessionStats };
    }

    public getTradeHistory(): TradeRecord[] {
        return [...this.tradeHistory];
    }

    public getCurrentBalance(): number {
        return this.currentBalance;
    }

    public getCurrentMartingaleStep(): number {
        return this.currentMartingaleStep;
    }

    // Setters
    public updateStakeSettings(settings: Partial<StakeSettings>): void {
        this.stakeSettings = { ...this.stakeSettings, ...settings };
        this.saveToStorage();
    }

    public setCurrentBalance(balance: number): void {
        if (this.sessionStartBalance === 0) {
            this.sessionStartBalance = balance;
        }
        this.currentBalance = balance;
        this.saveToStorage();
    }

    public getRecommendedStakeForSignal(confidence: string): number {
        const baseStake = this.calculateNextStake();

        // Adjust stake based on signal confidence
        switch (confidence) {
            case 'HIGH':
                return Math.round(baseStake * 1.5 * 100) / 100;
            case 'MEDIUM':
                return baseStake;
            case 'LOW':
                return Math.round(baseStake * 0.7 * 100) / 100;
            case 'CONSERVATIVE':
                return Math.round(baseStake * 0.5 * 100) / 100;
            case 'AGGRESSIVE':
                return Math.round(baseStake * 2.0 * 100) / 100;
            default:
                return baseStake;
        }
    }

    public getPerformanceMetrics(): {
        profitFactor: number;
        sharpeRatio: number;
        maxConsecutiveLosses: number;
        averageWin: number;
        averageLoss: number;
        winLossRatio: number;
    } {
        const wins = this.tradeHistory.filter(t => t.status === 'WON');
        const losses = this.tradeHistory.filter(t => t.status === 'LOST');

        const totalWinAmount = wins.reduce((sum, t) => sum + t.profit, 0);
        const totalLossAmount = Math.abs(losses.reduce((sum, t) => sum + t.profit, 0));

        const averageWin = wins.length > 0 ? totalWinAmount / wins.length : 0;
        const averageLoss = losses.length > 0 ? totalLossAmount / losses.length : 0;

        const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0;
        const winLossRatio = averageLoss > 0 ? averageWin / averageLoss : 0;

        // Simple Sharpe ratio calculation (assuming risk-free rate of 0)
        const returns = this.tradeHistory.map(t => t.profit);
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
        const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

        return {
            profitFactor: Math.round(profitFactor * 100) / 100,
            sharpeRatio: Math.round(sharpeRatio * 100) / 100,
            maxConsecutiveLosses: this.sessionStats.worstLossStreak,
            averageWin: Math.round(averageWin * 100) / 100,
            averageLoss: Math.round(averageLoss * 100) / 100,
            winLossRatio: Math.round(winLossRatio * 100) / 100,
        };
    }
}

export const stakeManager = StakeManagerService.getInstance();

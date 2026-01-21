import { MarketStats, SignalGenerationConfig, SignalsCenterSignal } from '@/types/signals';
import { derivConnectionPool } from './deriv-connection-pool.service';

export class SignalAnalysisService {
    private static instance: SignalAnalysisService;
    private marketData: Map<string, number[]> = new Map();
    private marketStats: Map<string, MarketStats> = new Map();
    private signalSubscribers: Set<(signals: SignalsCenterSignal[]) => void> = new Set();

    private config: SignalGenerationConfig = {
        enableAI: true,
        enablePatel: true,
        enableHotCold: true,
        enablePattern: true,
        enableTrend: true,
        generationInterval: 5000, // 5 seconds
        signalValidityDuration: 35, // 35 seconds
        minConfidenceThreshold: 0.6,
    };

    constructor() {
        if (SignalAnalysisService.instance) {
            return SignalAnalysisService.instance;
        }
        SignalAnalysisService.instance = this;
        this.initializeService();
    }

    static getInstance(): SignalAnalysisService {
        if (!SignalAnalysisService.instance) {
            SignalAnalysisService.instance = new SignalAnalysisService();
        }
        return SignalAnalysisService.instance;
    }

    private initializeService(): void {
        // Subscribe to tick data for all markets
        const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];

        markets.forEach(market => {
            derivConnectionPool.subscribeToTicks(market, tick => {
                this.processTick(market, tick);
            });

            // Initialize data structures
            this.marketData.set(market, []);
            this.marketStats.set(market, this.createEmptyStats());
        });

        // Generate signals at configured interval
        setInterval(() => {
            this.generateSignals();
        }, this.config.generationInterval);
    }

    private createEmptyStats(): MarketStats {
        return {
            tickCount: 0,
            digitFrequency: {},
            recentPattern: [],
            volatility: 0,
            entropy: 0,
            lastUpdate: Date.now(),
        };
    }

    private processTick(market: string, tick: any): void {
        if (!tick.tick?.quote) return;

        const digit = this.extractLastDigit(tick.tick.quote);
        const marketData = this.marketData.get(market)!;

        // Add new digit to market data
        marketData.push(digit);

        // Keep only last 1000 ticks
        if (marketData.length > 1000) {
            marketData.shift();
        }

        // Update market statistics
        this.updateMarketStats(market, marketData);
    }

    private extractLastDigit(quote: number): number {
        return Math.floor((quote * 10000) % 10);
    }

    private updateMarketStats(market: string, data: number[]): void {
        const stats = this.marketStats.get(market)!;

        // Update basic stats
        stats.tickCount = data.length;
        stats.lastUpdate = Date.now();
        stats.recentPattern = data.slice(-20); // Last 20 digits

        // Calculate digit frequency
        stats.digitFrequency = {};
        data.forEach(digit => {
            stats.digitFrequency[digit] = (stats.digitFrequency[digit] || 0) + 1;
        });

        // Calculate volatility
        stats.volatility = this.calculateVolatility(data);

        // Calculate entropy
        stats.entropy = this.calculateEntropy(stats.digitFrequency, data.length);
    }

    private calculateVolatility(data: number[]): number {
        if (data.length < 2) return 0;

        const changes = [];
        for (let i = 1; i < data.length; i++) {
            changes.push(Math.abs(data[i] - data[i - 1]));
        }

        const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length;
        const variance = changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;

        return Math.sqrt(variance);
    }

    private calculateEntropy(frequency: Record<number, number>, total: number): number {
        let entropy = 0;

        for (let digit = 0; digit <= 9; digit++) {
            const prob = (frequency[digit] || 0) / total;
            if (prob > 0) {
                entropy -= prob * Math.log2(prob);
            }
        }

        return entropy;
    }

    private generateSignals(): void {
        const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
        const signals: SignalsCenterSignal[] = [];

        markets.forEach(market => {
            const marketSignals = this.analyzeMarketSignals(market);
            signals.push(...marketSignals);
        });

        if (signals.length > 0) {
            this.notifySubscribers(signals);
        }
    }

    private analyzeMarketSignals(market: string): SignalsCenterSignal[] {
        const signals: SignalsCenterSignal[] = [];
        const data = this.marketData.get(market);
        const stats = this.marketStats.get(market);

        if (!data || !stats || data.length < 50) {
            return signals;
        }

        // Generate trend analysis signals
        if (this.config.enableTrend) {
            const trendSignal = this.analyzeTrendSignal(market, data);
            if (trendSignal) signals.push(trendSignal);
        }

        // Generate pattern recognition signals
        if (this.config.enablePattern) {
            const patternSignal = this.analyzePatternSignal(market, data);
            if (patternSignal) signals.push(patternSignal);
        }

        return signals;
    }

    private analyzeTrendSignal(market: string, data: number[]): SignalsCenterSignal | null {
        const recentData = data.slice(-30); // Last 30 digits
        const evenCount = recentData.filter(d => d % 2 === 0).length;
        const oddCount = recentData.length - evenCount;

        const evenRatio = evenCount / recentData.length;
        const oddRatio = oddCount / recentData.length;

        // Look for strong trends
        if (evenRatio > 0.7) {
            return {
                id: `trend-${market}-${Date.now()}`,
                timestamp: Date.now(),
                market,
                marketDisplay: this.getMarketDisplay(market),
                type: 'ODD',
                entry: data[data.length - 1],
                duration: '1t',
                confidence: evenRatio > 0.8 ? 'HIGH' : 'MEDIUM',
                strategy: 'Trend Analysis',
                source: 'Trend Analysis',
                status: 'ACTIVE',
                validityDuration: this.config.signalValidityDuration,
                expiresAt: Date.now() + this.config.signalValidityDuration * 1000,
                reason: `Strong even trend (${(evenRatio * 100).toFixed(1)}%) suggests ODD reversal`,
            };
        } else if (oddRatio > 0.7) {
            return {
                id: `trend-${market}-${Date.now()}`,
                timestamp: Date.now(),
                market,
                marketDisplay: this.getMarketDisplay(market),
                type: 'EVEN',
                entry: data[data.length - 1],
                duration: '1t',
                confidence: oddRatio > 0.8 ? 'HIGH' : 'MEDIUM',
                strategy: 'Trend Analysis',
                source: 'Trend Analysis',
                status: 'ACTIVE',
                validityDuration: this.config.signalValidityDuration,
                expiresAt: Date.now() + this.config.signalValidityDuration * 1000,
                reason: `Strong odd trend (${(oddRatio * 100).toFixed(1)}%) suggests EVEN reversal`,
            };
        }

        return null;
    }

    private analyzePatternSignal(market: string, data: number[]): SignalsCenterSignal | null {
        const recentPattern = data.slice(-5); // Last 5 digits

        // Look for repeating patterns
        const patternString = recentPattern.join('');
        const fullDataString = data.join('');

        // Count occurrences of this pattern
        const regex = new RegExp(patternString, 'g');
        const matches = fullDataString.match(regex);
        const occurrences = matches ? matches.length : 0;

        if (occurrences >= 3) {
            // Pattern found multiple times, predict next digit
            const nextDigitCandidates: number[] = [];

            // Find what digit typically follows this pattern
            for (let i = 0; i <= data.length - recentPattern.length - 1; i++) {
                const slice = data.slice(i, i + recentPattern.length);
                if (JSON.stringify(slice) === JSON.stringify(recentPattern)) {
                    if (i + recentPattern.length < data.length) {
                        nextDigitCandidates.push(data[i + recentPattern.length]);
                    }
                }
            }

            if (nextDigitCandidates.length > 0) {
                // Find most common next digit
                const digitCounts: Record<number, number> = {};
                nextDigitCandidates.forEach(digit => {
                    digitCounts[digit] = (digitCounts[digit] || 0) + 1;
                });

                const mostCommonDigit = Object.entries(digitCounts).sort(([, a], [, b]) => b - a)[0][0];

                const predictedDigit = parseInt(mostCommonDigit);
                const confidence = digitCounts[predictedDigit] / nextDigitCandidates.length;

                if (confidence >= this.config.minConfidenceThreshold) {
                    return {
                        id: `pattern-${market}-${Date.now()}`,
                        timestamp: Date.now(),
                        market,
                        marketDisplay: this.getMarketDisplay(market),
                        type: predictedDigit % 2 === 0 ? 'EVEN' : 'ODD',
                        entry: predictedDigit,
                        duration: '1t',
                        confidence: confidence > 0.8 ? 'HIGH' : 'MEDIUM',
                        strategy: 'Pattern Recognition',
                        source: 'Pattern Recognition',
                        status: 'ACTIVE',
                        entryDigit: predictedDigit,
                        digitPattern: recentPattern,
                        validityDuration: this.config.signalValidityDuration,
                        expiresAt: Date.now() + this.config.signalValidityDuration * 1000,
                        reason: `Pattern ${patternString} found ${occurrences} times, predicting digit ${predictedDigit} (${(confidence * 100).toFixed(1)}% confidence)`,
                    };
                }
            }
        }

        return null;
    }

    private getMarketDisplay(market: string): string {
        const displays: Record<string, string> = {
            R_10: 'Volatility 10 Index',
            R_25: 'Volatility 25 Index',
            R_50: 'Volatility 50 Index',
            R_75: 'Volatility 75 Index',
            R_100: 'Volatility 100 Index',
        };

        return displays[market] || market;
    }

    private notifySubscribers(signals: SignalsCenterSignal[]): void {
        this.signalSubscribers.forEach(callback => callback(signals));
    }

    // Public methods
    public subscribeToSignals(callback: (signals: SignalsCenterSignal[]) => void): () => void {
        this.signalSubscribers.add(callback);

        return () => {
            this.signalSubscribers.delete(callback);
        };
    }

    public getMarketStats(market: string): MarketStats | null {
        return this.marketStats.get(market) || null;
    }

    public getMarketData(market: string): number[] {
        return [...(this.marketData.get(market) || [])];
    }

    public updateConfiguration(config: Partial<SignalGenerationConfig>): void {
        this.config = { ...this.config, ...config };
    }

    public getConfiguration(): SignalGenerationConfig {
        return { ...this.config };
    }
}

export const signalAnalysis = SignalAnalysisService.getInstance();

import { SignalsCenterSignal, TargetDigitsAnalysis } from '@/types/signals';
import { derivConnectionPool } from './deriv-connection-pool.service';

interface PatelConfiguration {
    lookbackPeriod: number;
    confidenceThreshold: number;
    minFrequencyDifference: number;
    adaptiveWeighting: boolean;
    marketSpecificTuning: boolean;
}

interface DigitStatistics {
    frequency: Record<number, number>;
    streaks: Record<number, number[]>;
    patterns: Record<string, number>;
    volatility: number;
    entropy: number;
    lastOccurrence: Record<number, number>;
}

export class PatelSignalGeneratorService {
    private static instance: PatelSignalGeneratorService;
    private digitHistory: Map<string, number[]> = new Map();
    private digitStats: Map<string, DigitStatistics> = new Map();
    private signalSubscribers: Set<(signals: SignalsCenterSignal[]) => void> = new Set();

    private config: PatelConfiguration = {
        lookbackPeriod: 1000, // Last 1000 ticks
        confidenceThreshold: 0.75,
        minFrequencyDifference: 0.15,
        adaptiveWeighting: true,
        marketSpecificTuning: true,
    };

    // Market-specific parameters based on volatility characteristics
    private marketParams = {
        // Standard Volatility Indices
        R_10: { volatilityFactor: 1.0, patternWeight: 0.8, entropyThreshold: 2.1 },
        R_25: { volatilityFactor: 1.2, patternWeight: 0.9, entropyThreshold: 2.3 },
        R_50: { volatilityFactor: 1.5, patternWeight: 1.0, entropyThreshold: 2.5 },
        R_75: { volatilityFactor: 1.8, patternWeight: 1.1, entropyThreshold: 2.7 },
        R_100: { volatilityFactor: 2.0, patternWeight: 1.2, entropyThreshold: 2.9 },
        R_150: { volatilityFactor: 2.5, patternWeight: 1.3, entropyThreshold: 3.1 },
        R_250: { volatilityFactor: 3.0, patternWeight: 1.4, entropyThreshold: 3.3 },

        // 1-Second Volatility Indices
        '1HZ10V': { volatilityFactor: 1.0, patternWeight: 0.9, entropyThreshold: 2.0 },
        '1HZ25V': { volatilityFactor: 1.2, patternWeight: 1.0, entropyThreshold: 2.2 },
        '1HZ50V': { volatilityFactor: 1.5, patternWeight: 1.1, entropyThreshold: 2.4 },
        '1HZ75V': { volatilityFactor: 1.8, patternWeight: 1.2, entropyThreshold: 2.6 },
        '1HZ100V': { volatilityFactor: 2.0, patternWeight: 1.3, entropyThreshold: 2.8 },

        // Jump Indices
        JD10: { volatilityFactor: 1.1, patternWeight: 0.7, entropyThreshold: 2.4 },
        JD25: { volatilityFactor: 1.3, patternWeight: 0.8, entropyThreshold: 2.6 },
        JD50: { volatilityFactor: 1.6, patternWeight: 0.9, entropyThreshold: 2.8 },
        JD75: { volatilityFactor: 1.9, patternWeight: 1.0, entropyThreshold: 3.0 },
        JD100: { volatilityFactor: 2.1, patternWeight: 1.1, entropyThreshold: 3.2 },

        // Crash Indices
        CRASH300N: { volatilityFactor: 4.0, patternWeight: 0.6, entropyThreshold: 3.5 },
        CRASH500N: { volatilityFactor: 5.0, patternWeight: 0.5, entropyThreshold: 3.7 },
        CRASH1000N: { volatilityFactor: 6.0, patternWeight: 0.4, entropyThreshold: 3.9 },

        // Boom Indices
        BOOM300N: { volatilityFactor: 4.0, patternWeight: 0.6, entropyThreshold: 3.5 },
        BOOM500N: { volatilityFactor: 5.0, patternWeight: 0.5, entropyThreshold: 3.7 },
        BOOM1000N: { volatilityFactor: 6.0, patternWeight: 0.4, entropyThreshold: 3.9 },
    };

    constructor() {
        if (PatelSignalGeneratorService.instance) {
            return PatelSignalGeneratorService.instance;
        }
        PatelSignalGeneratorService.instance = this;
        this.initializeService();
    }

    static getInstance(): PatelSignalGeneratorService {
        if (!PatelSignalGeneratorService.instance) {
            PatelSignalGeneratorService.instance = new PatelSignalGeneratorService();
        }
        return PatelSignalGeneratorService.instance;
    }

    private initializeService(): void {
        // Subscribe to tick data for all markets
        const markets = [
            'R_10',
            'R_25',
            'R_50',
            'R_75',
            'R_100',
            'R_150',
            'R_250',
            '1HZ10V',
            '1HZ25V',
            '1HZ50V',
            '1HZ75V',
            '1HZ100V',
            'JD10',
            'JD25',
            'JD50',
            'JD75',
            'JD100',
            'CRASH300N',
            'CRASH500N',
            'CRASH1000N',
            'BOOM300N',
            'BOOM500N',
            'BOOM1000N',
        ];

        markets.forEach(market => {
            derivConnectionPool.subscribeToTicks(market, tick => {
                this.processTick(market, tick);
            });

            // Initialize data structures
            this.digitHistory.set(market, []);
            this.digitStats.set(market, this.createEmptyStats());
        });

        // Generate Patel signals every 8 seconds
        setInterval(() => {
            this.generatePatelSignals();
        }, 8000);
    }

    private createEmptyStats(): DigitStatistics {
        return {
            frequency: {},
            streaks: {},
            patterns: {},
            volatility: 0,
            entropy: 0,
            lastOccurrence: {},
        };
    }

    private processTick(market: string, tick: any): void {
        if (!tick.tick?.quote) return;

        const digit = this.extractLastDigit(tick.tick.quote);
        const history = this.digitHistory.get(market)!;

        // Add new digit to history
        history.push(digit);

        // Maintain lookback period
        if (history.length > this.config.lookbackPeriod) {
            history.shift();
        }

        // Update statistics
        this.updateDigitStatistics(market, history);
    }

    private extractLastDigit(quote: number): number {
        return Math.floor((quote * 10000) % 10);
    }

    private updateDigitStatistics(market: string, history: number[]): void {
        const stats = this.digitStats.get(market)!;

        // Reset statistics
        stats.frequency = {};
        stats.streaks = {};
        stats.patterns = {};
        stats.lastOccurrence = {};

        // Calculate digit frequencies
        history.forEach((digit, index) => {
            stats.frequency[digit] = (stats.frequency[digit] || 0) + 1;
            stats.lastOccurrence[digit] = index;
        });

        // Calculate streaks
        this.calculateStreaks(history, stats);

        // Calculate patterns (2-digit and 3-digit sequences)
        this.calculatePatterns(history, stats);

        // Calculate volatility and entropy
        stats.volatility = this.calculateVolatility(history);
        stats.entropy = this.calculateEntropy(stats.frequency, history.length);
    }

    private calculateStreaks(history: number[], stats: DigitStatistics): void {
        for (let digit = 0; digit <= 9; digit++) {
            stats.streaks[digit] = [];
            let currentStreak = 0;

            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i] === digit) {
                    currentStreak++;
                } else {
                    if (currentStreak > 0) {
                        stats.streaks[digit].push(currentStreak);
                        currentStreak = 0;
                    }
                }
            }

            if (currentStreak > 0) {
                stats.streaks[digit].push(currentStreak);
            }
        }
    }

    private calculatePatterns(history: number[], stats: DigitStatistics): void {
        // 2-digit patterns
        for (let i = 1; i < history.length; i++) {
            const pattern = `${history[i - 1]}${history[i]}`;
            stats.patterns[pattern] = (stats.patterns[pattern] || 0) + 1;
        }

        // 3-digit patterns
        for (let i = 2; i < history.length; i++) {
            const pattern = `${history[i - 2]}${history[i - 1]}${history[i]}`;
            stats.patterns[pattern] = (stats.patterns[pattern] || 0) + 1;
        }
    }

    private calculateVolatility(history: number[]): number {
        if (history.length < 2) return 0;

        const changes = [];
        for (let i = 1; i < history.length; i++) {
            changes.push(Math.abs(history[i] - history[i - 1]));
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

    private generatePatelSignals(): void {
        const markets = [
            'R_10',
            'R_25',
            'R_50',
            'R_75',
            'R_100',
            'R_150',
            'R_250',
            '1HZ10V',
            '1HZ25V',
            '1HZ50V',
            '1HZ75V',
            '1HZ100V',
            'JD10',
            'JD25',
            'JD50',
            'JD75',
            'JD100',
            'CRASH300N',
            'CRASH500N',
            'CRASH1000N',
            'BOOM300N',
            'BOOM500N',
            'BOOM1000N',
        ];
        const signals: SignalsCenterSignal[] = [];

        markets.forEach(market => {
            const marketSignals = this.analyzePatelSignals(market);
            signals.push(...marketSignals);
        });

        if (signals.length > 0) {
            this.notifySubscribers(signals);
        }
    }

    private analyzePatelSignals(market: string): SignalsCenterSignal[] {
        const signals: SignalsCenterSignal[] = [];
        const history = this.digitHistory.get(market);
        const stats = this.digitStats.get(market);

        if (!history || !stats || history.length < 100) {
            return signals;
        }

        // Analyze for OVER/UNDER signals with entry digits
        const overUnderSignal = this.analyzeOverUnderWithEntry(market, history, stats);
        if (overUnderSignal) {
            signals.push(overUnderSignal);
        }

        // Analyze for EVEN/ODD signals
        const evenOddSignal = this.analyzeEvenOdd(market, history, stats);
        if (evenOddSignal) {
            signals.push(evenOddSignal);
        }

        // Analyze for exact digit predictions
        const exactDigitSignal = this.analyzeExactDigit(market, history, stats);
        if (exactDigitSignal) {
            signals.push(exactDigitSignal);
        }

        return signals;
    }

    private analyzeOverUnderWithEntry(
        market: string,
        history: number[],
        stats: DigitStatistics
    ): SignalsCenterSignal | null {
        const recentDigits = history.slice(-50); // Last 50 digits
        const overCount = recentDigits.filter(d => d >= 5).length;
        const underCount = recentDigits.filter(d => d <= 4).length;

        const overRatio = overCount / recentDigits.length;
        const underRatio = underCount / recentDigits.length;

        // Find hot digits for entry
        const hotDigits = this.findHotDigits(stats);
        const entryDigit = hotDigits[0];

        let signalType: 'OVER1-5' | 'UNDER1-5' | null = null;
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        let reason = '';

        // Patel algorithm: Look for imbalances and predict reversal
        if (overRatio > 0.7 && entryDigit !== undefined) {
            signalType = 'UNDER1-5';
            confidence = overRatio > 0.8 ? 'HIGH' : 'MEDIUM';
            reason = `Over dominance (${(overRatio * 100).toFixed(1)}%) suggests UNDER reversal. Entry digit: ${entryDigit}`;
        } else if (underRatio > 0.7 && entryDigit !== undefined) {
            signalType = 'OVER1-5';
            confidence = underRatio > 0.8 ? 'HIGH' : 'MEDIUM';
            reason = `Under dominance (${(underRatio * 100).toFixed(1)}%) suggests OVER reversal. Entry digit: ${entryDigit}`;
        }

        if (!signalType || entryDigit === undefined) return null;

        // Apply market-specific adjustments
        const marketParam = this.marketParams[market as keyof typeof this.marketParams];
        if (marketParam && stats.entropy < marketParam.entropyThreshold) {
            confidence = confidence === 'HIGH' ? 'MEDIUM' : 'LOW';
        }

        return {
            id: `patel-${market}-${Date.now()}`,
            timestamp: Date.now(),
            market,
            marketDisplay: this.getMarketDisplay(market),
            type: signalType,
            entry: entryDigit,
            duration: '1t',
            confidence,
            strategy: 'Patel Statistical Analysis',
            source: 'Patel Signals',
            status: 'ACTIVE',
            entryDigit,
            validityDuration: 45,
            expiresAt: Date.now() + 45000,
            targetDigitsAnalysis: this.createTargetAnalysis(stats, history.length),
            reason,
        };
    }

    private analyzeEvenOdd(market: string, history: number[], stats: DigitStatistics): SignalsCenterSignal | null {
        const recentDigits = history.slice(-30);
        const evenCount = recentDigits.filter(d => d % 2 === 0).length;
        const oddCount = recentDigits.length - evenCount;

        const evenRatio = evenCount / recentDigits.length;
        const oddRatio = oddCount / recentDigits.length;

        let signalType: 'EVEN' | 'ODD' | null = null;
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        let reason = '';

        // Patel even/odd analysis
        if (evenRatio > 0.75) {
            signalType = 'ODD';
            confidence = evenRatio > 0.85 ? 'HIGH' : 'MEDIUM';
            reason = `Even dominance (${(evenRatio * 100).toFixed(1)}%) suggests ODD reversal`;
        } else if (oddRatio > 0.75) {
            signalType = 'EVEN';
            confidence = oddRatio > 0.85 ? 'HIGH' : 'MEDIUM';
            reason = `Odd dominance (${(oddRatio * 100).toFixed(1)}%) suggests EVEN reversal`;
        }

        if (!signalType) return null;

        return {
            id: `patel-evenodd-${market}-${Date.now()}`,
            timestamp: Date.now(),
            market,
            marketDisplay: this.getMarketDisplay(market),
            type: signalType,
            entry: history[history.length - 1],
            duration: '1t',
            confidence,
            strategy: 'Patel Even/Odd Analysis',
            source: 'Patel Signals',
            status: 'ACTIVE',
            validityDuration: 40,
            expiresAt: Date.now() + 40000,
            targetDigitsAnalysis: this.createTargetAnalysis(stats, history.length),
            reason,
        };
    }

    private analyzeExactDigit(market: string, history: number[], stats: DigitStatistics): SignalsCenterSignal | null {
        const coldDigits = this.findColdDigits(stats);

        if (coldDigits.length === 0) return null;

        const targetDigit = coldDigits[0];
        const timeSinceLastOccurrence = history.length - (stats.lastOccurrence[targetDigit] || 0);

        // Patel cold digit analysis
        if (timeSinceLastOccurrence > 50) {
            return {
                id: `patel-exact-${market}-${Date.now()}`,
                timestamp: Date.now(),
                market,
                marketDisplay: this.getMarketDisplay(market),
                type: targetDigit % 2 === 0 ? 'EVEN' : 'ODD',
                entry: targetDigit,
                duration: '1t',
                confidence: timeSinceLastOccurrence > 100 ? 'HIGH' : 'MEDIUM',
                strategy: 'Patel Cold Digit Targeting',
                source: 'Patel Signals',
                status: 'ACTIVE',
                entryDigit: targetDigit,
                validityDuration: 50,
                expiresAt: Date.now() + 50000,
                targetDigitsAnalysis: this.createTargetAnalysis(stats, history.length),
                reason: `Digit ${targetDigit} is cold (${timeSinceLastOccurrence} ticks since last occurrence)`,
            };
        }

        return null;
    }

    private findHotDigits(stats: DigitStatistics): number[] {
        const frequencies = Object.entries(stats.frequency)
            .map(([digit, count]) => ({ digit: parseInt(digit), count }))
            .sort((a, b) => b.count - a.count);

        return frequencies.slice(0, 3).map(f => f.digit);
    }

    private findColdDigits(stats: DigitStatistics): number[] {
        const frequencies = Object.entries(stats.frequency)
            .map(([digit, count]) => ({ digit: parseInt(digit), count }))
            .sort((a, b) => a.count - b.count);

        return frequencies.slice(0, 3).map(f => f.digit);
    }

    private createTargetAnalysis(stats: DigitStatistics, totalTicks: number): TargetDigitsAnalysis {
        const hotDigits = this.findHotDigits(stats);
        const coldDigits = this.findColdDigits(stats);

        const probability: Record<number, number> = {};
        for (let digit = 0; digit <= 9; digit++) {
            probability[digit] = (stats.frequency[digit] || 0) / totalTicks;
        }

        return {
            hotDigits,
            coldDigits,
            frequency: stats.frequency,
            probability,
            recommendation: coldDigits[0] || 0,
        };
    }

    private getMarketDisplay(market: string): string {
        const displays: Record<string, string> = {
            // Standard Volatility Indices
            R_10: 'Volatility 10 Index',
            R_25: 'Volatility 25 Index',
            R_50: 'Volatility 50 Index',
            R_75: 'Volatility 75 Index',
            R_100: 'Volatility 100 Index',
            R_150: 'Volatility 150 Index',
            R_250: 'Volatility 250 Index',

            // 1-Second Volatility Indices
            '1HZ10V': 'Volatility 10 (1s) Index',
            '1HZ25V': 'Volatility 25 (1s) Index',
            '1HZ50V': 'Volatility 50 (1s) Index',
            '1HZ75V': 'Volatility 75 (1s) Index',
            '1HZ100V': 'Volatility 100 (1s) Index',

            // Jump Indices
            JD10: 'Jump 10 Index',
            JD25: 'Jump 25 Index',
            JD50: 'Jump 50 Index',
            JD75: 'Jump 75 Index',
            JD100: 'Jump 100 Index',

            // Crash Indices
            CRASH300N: 'Crash 300 Index',
            CRASH500N: 'Crash 500 Index',
            CRASH1000N: 'Crash 1000 Index',

            // Boom Indices
            BOOM300N: 'Boom 300 Index',
            BOOM500N: 'Boom 500 Index',
            BOOM1000N: 'Boom 1000 Index',
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

    public updateConfiguration(config: Partial<PatelConfiguration>): void {
        this.config = { ...this.config, ...config };
    }

    public getConfiguration(): PatelConfiguration {
        return { ...this.config };
    }

    public getMarketStatistics(market: string): DigitStatistics | null {
        return this.digitStats.get(market) || null;
    }

    public getDigitHistory(market: string): number[] {
        return [...(this.digitHistory.get(market) || [])];
    }
}

export const patelSignalGenerator = PatelSignalGeneratorService.getInstance();

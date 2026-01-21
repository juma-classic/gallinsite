import { PatternAnalysis, SignalsCenterSignal } from '@/types/signals';
import { derivConnectionPool } from './deriv-connection-pool.service';

interface PatternDatabase {
    [key: string]: {
        occurrences: number;
        nextDigits: number[];
        lastSeen: number;
        confidence: number;
    };
}

export class PatternPredictorService {
    private static instance: PatternPredictorService;
    private marketData: Map<string, number[]> = new Map();
    private patternDatabases: Map<string, PatternDatabase> = new Map();
    private signalSubscribers: Set<(signals: SignalsCenterSignal[]) => void> = new Set();

    // Pattern analysis configuration
    private readonly MIN_PATTERN_LENGTH = 3;
    private readonly MAX_PATTERN_LENGTH = 8;
    private readonly MIN_OCCURRENCES = 3;
    private readonly MIN_CONFIDENCE = 0.65;
    private readonly LOOKBACK_PERIOD = 1500;

    constructor() {
        if (PatternPredictorService.instance) {
            return PatternPredictorService.instance;
        }
        PatternPredictorService.instance = this;
        this.initializeService();
    }

    static getInstance(): PatternPredictorService {
        if (!PatternPredictorService.instance) {
            PatternPredictorService.instance = new PatternPredictorService();
        }
        return PatternPredictorService.instance;
    }

    private initializeService(): void {
        const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];

        markets.forEach(market => {
            derivConnectionPool.subscribeToTicks(market, tick => {
                this.processTick(market, tick);
            });

            this.marketData.set(market, []);
            this.patternDatabases.set(market, {});
        });

        // Generate pattern signals every 6 seconds
        setInterval(() => {
            this.generatePatternSignals();
        }, 6000);

        // Update pattern database every 15 seconds
        setInterval(() => {
            this.updatePatternDatabases();
        }, 15000);
    }

    private processTick(market: string, tick: any): void {
        if (!tick.tick?.quote) return;

        const digit = this.extractLastDigit(tick.tick.quote);
        const marketData = this.marketData.get(market)!;

        marketData.push(digit);

        // Keep only recent data
        if (marketData.length > this.LOOKBACK_PERIOD) {
            marketData.shift();
        }
    }

    private extractLastDigit(quote: number): number {
        return Math.floor((quote * 10000) % 10);
    }

    private updatePatternDatabases(): void {
        const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];

        markets.forEach(market => {
            this.analyzePatterns(market);
        });
    }

    private analyzePatterns(market: string): void {
        const data = this.marketData.get(market);
        const database = this.patternDatabases.get(market)!;

        if (!data || data.length < this.MIN_PATTERN_LENGTH + 1) return;

        // Clear old patterns
        Object.keys(database).forEach(key => {
            delete database[key];
        });

        // Analyze patterns of different lengths
        for (let length = this.MIN_PATTERN_LENGTH; length <= this.MAX_PATTERN_LENGTH; length++) {
            this.findPatternsOfLength(data, database, length);
        }

        // Calculate confidence scores
        this.calculatePatternConfidence(database);
    }

    private findPatternsOfLength(data: number[], database: PatternDatabase, length: number): void {
        for (let i = 0; i <= data.length - length - 1; i++) {
            const pattern = data.slice(i, i + length);
            const nextDigit = data[i + length];
            const patternKey = pattern.join(',');

            if (!database[patternKey]) {
                database[patternKey] = {
                    occurrences: 0,
                    nextDigits: [],
                    lastSeen: 0,
                    confidence: 0,
                };
            }

            database[patternKey].occurrences++;
            database[patternKey].nextDigits.push(nextDigit);
            database[patternKey].lastSeen = i + length;
        }
    }

    private calculatePatternConfidence(database: PatternDatabase): void {
        Object.keys(database).forEach(patternKey => {
            const pattern = database[patternKey];

            if (pattern.occurrences < this.MIN_OCCURRENCES) {
                pattern.confidence = 0;
                return;
            }

            // Calculate confidence based on consistency of next digits
            const digitCounts: Record<number, number> = {};
            pattern.nextDigits.forEach(digit => {
                digitCounts[digit] = (digitCounts[digit] || 0) + 1;
            });

            const maxCount = Math.max(...Object.values(digitCounts));
            const totalCount = pattern.nextDigits.length;

            // Base confidence on most frequent next digit
            const baseConfidence = maxCount / totalCount;

            // Adjust for recency (more recent patterns get higher confidence)
            const recencyFactor = Math.max(0.5, 1 - pattern.lastSeen / 1000);

            // Adjust for frequency (more occurrences = higher confidence)
            const frequencyFactor = Math.min(1.5, 1 + pattern.occurrences / 10);

            pattern.confidence = baseConfidence * recencyFactor * frequencyFactor;
        });
    }

    private generatePatternSignals(): void {
        const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
        const signals: SignalsCenterSignal[] = [];

        markets.forEach(market => {
            const patternSignal = this.generatePatternSignalForMarket(market);
            if (patternSignal) {
                signals.push(patternSignal);
            }
        });

        if (signals.length > 0) {
            this.notifySubscribers(signals);
        }
    }

    private generatePatternSignalForMarket(market: string): SignalsCenterSignal | null {
        const data = this.marketData.get(market);
        const database = this.patternDatabases.get(market)!;

        if (!data || data.length < this.MIN_PATTERN_LENGTH) return null;

        // Find the best matching pattern for current data
        const bestPattern = this.findBestMatchingPattern(data, database);

        if (!bestPattern || bestPattern.confidence < this.MIN_CONFIDENCE) {
            return null;
        }

        // Predict next digit based on pattern
        const prediction = this.predictNextDigit(bestPattern);
        if (!prediction) return null;

        // Determine signal type
        const signalType = this.determineSignalType(prediction.digit);
        const confidenceLevel = this.mapConfidenceLevel(prediction.confidence);

        // Generate supporting analysis
        const supportingPatterns = this.findSupportingPatterns(data, database, bestPattern.pattern);
        const reasoning = this.generateReasoning(bestPattern, prediction, supportingPatterns);

        return {
            id: `pattern-${market}-${Date.now()}`,
            timestamp: Date.now(),
            market,
            marketDisplay: this.getMarketDisplay(market),
            type: signalType,
            entry: prediction.digit,
            duration: '1t',
            confidence: confidenceLevel,
            strategy: 'Pattern Recognition',
            source: 'Pattern Recognition',
            status: 'ACTIVE',
            entryDigit: prediction.digit,
            digitPattern: bestPattern.pattern,
            validityDuration: 35,
            expiresAt: Date.now() + 35000,
            reason: reasoning,
        };
    }

    private findBestMatchingPattern(
        data: number[],
        database: PatternDatabase
    ): { pattern: number[]; confidence: number; key: string } | null {
        let bestMatch: { pattern: number[]; confidence: number; key: string } | null = null;
        let bestScore = 0;

        // Check patterns of different lengths, starting with longest
        for (let length = this.MAX_PATTERN_LENGTH; length >= this.MIN_PATTERN_LENGTH; length--) {
            if (data.length < length) continue;

            const currentPattern = data.slice(-length);
            const patternKey = currentPattern.join(',');

            if (database[patternKey] && database[patternKey].confidence > bestScore) {
                bestMatch = {
                    pattern: currentPattern,
                    confidence: database[patternKey].confidence,
                    key: patternKey,
                };
                bestScore = database[patternKey].confidence;
            }

            // Also check partial matches for longer patterns
            if (length > this.MIN_PATTERN_LENGTH) {
                const partialMatches = this.findPartialMatches(currentPattern, database);
                partialMatches.forEach(match => {
                    if (match.confidence > bestScore) {
                        bestMatch = match;
                        bestScore = match.confidence;
                    }
                });
            }
        }

        return bestMatch;
    }

    private findPartialMatches(
        pattern: number[],
        database: PatternDatabase
    ): { pattern: number[]; confidence: number; key: string }[] {
        const matches: { pattern: number[]; confidence: number; key: string }[] = [];

        Object.keys(database).forEach(key => {
            const dbPattern = key.split(',').map(Number);

            // Check if database pattern ends with our pattern (suffix match)
            if (dbPattern.length > pattern.length) {
                const suffix = dbPattern.slice(-pattern.length);
                if (JSON.stringify(suffix) === JSON.stringify(pattern)) {
                    matches.push({
                        pattern: dbPattern,
                        confidence: database[key].confidence * 0.8, // Reduce confidence for partial match
                        key,
                    });
                }
            }
        });

        return matches.sort((a, b) => b.confidence - a.confidence);
    }

    private predictNextDigit(patternMatch: {
        pattern: number[];
        confidence: number;
        key: string;
    }): { digit: number; confidence: number } | null {
        const database = this.patternDatabases.get('R_10')!; // Use R_10 as reference
        const patternData = database[patternMatch.key];

        if (!patternData || patternData.nextDigits.length === 0) return null;

        // Count frequency of each next digit
        const digitCounts: Record<number, number> = {};
        patternData.nextDigits.forEach(digit => {
            digitCounts[digit] = (digitCounts[digit] || 0) + 1;
        });

        // Find most frequent next digit
        let bestDigit = 0;
        let bestCount = 0;

        Object.entries(digitCounts).forEach(([digit, count]) => {
            if (count > bestCount) {
                bestDigit = parseInt(digit);
                bestCount = count;
            }
        });

        const confidence = bestCount / patternData.nextDigits.length;

        return { digit: bestDigit, confidence };
    }

    private determineSignalType(predictedDigit: number): 'RISE' | 'FALL' | 'EVEN' | 'ODD' | 'OVER1-5' | 'UNDER1-5' {
        // Primary decision based on predicted digit
        if (predictedDigit >= 5) {
            return 'OVER1-5';
        } else {
            return 'UNDER1-5';
        }
    }

    private mapConfidenceLevel(confidence: number): 'HIGH' | 'MEDIUM' | 'LOW' {
        if (confidence >= 0.8) return 'HIGH';
        if (confidence >= 0.65) return 'MEDIUM';
        return 'LOW';
    }

    private findSupportingPatterns(data: number[], database: PatternDatabase, mainPattern: number[]): string[] {
        const supporting: string[] = [];

        // Find similar patterns
        Object.keys(database).forEach(key => {
            const pattern = key.split(',').map(Number);
            const patternData = database[key];

            if (patternData.confidence > 0.5 && pattern.length >= this.MIN_PATTERN_LENGTH) {
                // Check for overlapping subsequences
                const overlap = this.calculatePatternOverlap(mainPattern, pattern);
                if (overlap > 0.6) {
                    supporting.push(`Similar pattern: ${key} (${patternData.occurrences} occurrences)`);
                }
            }
        });

        return supporting.slice(0, 3); // Limit to top 3 supporting patterns
    }

    private calculatePatternOverlap(pattern1: number[], pattern2: number[]): number {
        const shorter = pattern1.length <= pattern2.length ? pattern1 : pattern2;
        const longer = pattern1.length > pattern2.length ? pattern1 : pattern2;

        let maxOverlap = 0;

        // Check all possible alignments
        for (let i = 0; i <= longer.length - shorter.length; i++) {
            let overlap = 0;
            for (let j = 0; j < shorter.length; j++) {
                if (longer[i + j] === shorter[j]) {
                    overlap++;
                }
            }
            maxOverlap = Math.max(maxOverlap, overlap);
        }

        return maxOverlap / shorter.length;
    }

    private generateReasoning(
        patternMatch: { pattern: number[]; confidence: number; key: string },
        prediction: { digit: number; confidence: number },
        supportingPatterns: string[]
    ): string {
        let reasoning = `Pattern ${patternMatch.key} detected with ${(patternMatch.confidence * 100).toFixed(1)}% confidence. `;
        reasoning += `Historical analysis predicts next digit: ${prediction.digit} (${(prediction.confidence * 100).toFixed(1)}% accuracy). `;

        if (supportingPatterns.length > 0) {
            reasoning += `Supporting evidence: ${supportingPatterns.length} similar patterns found. `;
        }

        return reasoning;
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

    public getPatternAnalysis(market: string): PatternAnalysis[] {
        const database = this.patternDatabases.get(market);
        if (!database) return [];

        return Object.entries(database)
            .filter(([, data]) => data.confidence >= this.MIN_CONFIDENCE)
            .map(([key, data]) => ({
                pattern: key.split(',').map(Number),
                frequency: data.occurrences,
                lastOccurrence: data.lastSeen,
                predictedNext: this.getMostFrequentNextDigits(data.nextDigits),
                confidence: data.confidence,
            }))
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 10); // Return top 10 patterns
    }

    private getMostFrequentNextDigits(nextDigits: number[]): number[] {
        const counts: Record<number, number> = {};
        nextDigits.forEach(digit => {
            counts[digit] = (counts[digit] || 0) + 1;
        });

        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([digit]) => parseInt(digit));
    }

    public getPatternDatabase(market: string): PatternDatabase {
        return { ...this.patternDatabases.get(market) } || {};
    }

    public clearPatternHistory(market?: string): void {
        if (market) {
            this.patternDatabases.set(market, {});
            this.marketData.set(market, []);
        } else {
            // Clear all markets
            const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
            markets.forEach(m => {
                this.patternDatabases.set(m, {});
                this.marketData.set(m, []);
            });
        }
    }
}

export const patternPredictor = PatternPredictorService.getInstance();

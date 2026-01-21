import { HotColdZoneData, SignalsCenterSignal } from '@/types/signals';
import { derivConnectionPool } from './deriv-connection-pool.service';

interface EntryPointAnalysis {
    optimalEntry: number;
    confidence: number;
    reasoning: string;
    supportingFactors: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface MarketMomentum {
    shortTerm: number; // Last 10 ticks
    mediumTerm: number; // Last 30 ticks
    longTerm: number; // Last 100 ticks
    overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

interface DigitZoneAnalysis {
    hotZone: number[]; // Digits 0-9 in hot zone
    coldZone: number[]; // Digits 0-9 in cold zone
    neutralZone: number[]; // Digits 0-9 in neutral zone
    zoneStrengths: Record<number, number>; // Strength of each zone (0-1)
}

export class EntryPointDetectorService {
    private static instance: EntryPointDetectorService;
    private marketData: Map<string, number[]> = new Map();
    private hotColdData: Map<string, HotColdZoneData> = new Map();
    private signalSubscribers: Set<(signals: SignalsCenterSignal[]) => void> = new Set();

    // Raziel Algorithm Configuration
    private readonly RAZIEL_LOOKBACK = 200;
    private readonly HOT_THRESHOLD = 1.3; // Above average frequency
    private readonly COLD_THRESHOLD = 0.7; // Below average frequency
    private readonly ZONE_STRENGTH_PERIODS = [20, 50, 100]; // Different analysis periods

    constructor() {
        if (EntryPointDetectorService.instance) {
            return EntryPointDetectorService.instance;
        }
        EntryPointDetectorService.instance = this;
        this.initializeService();
    }

    static getInstance(): EntryPointDetectorService {
        if (!EntryPointDetectorService.instance) {
            EntryPointDetectorService.instance = new EntryPointDetectorService();
        }
        return EntryPointDetectorService.instance;
    }

    private initializeService(): void {
        const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];

        markets.forEach(market => {
            derivConnectionPool.subscribeToTicks(market, tick => {
                this.processTick(market, tick);
            });

            this.marketData.set(market, []);
            this.hotColdData.set(market, {
                hotDigits: [],
                coldDigits: [],
                neutralDigits: [],
                zoneStrength: {},
                lastUpdate: Date.now(),
            });
        });

        // Generate entry point signals every 8 seconds
        setInterval(() => {
            this.generateEntryPointSignals();
        }, 8000);

        // Update hot/cold zones every 10 seconds
        setInterval(() => {
            this.updateHotColdZones();
        }, 10000);
    }

    private processTick(market: string, tick: any): void {
        if (!tick.tick?.quote) return;

        const digit = this.extractLastDigit(tick.tick.quote);
        const marketData = this.marketData.get(market)!;

        marketData.push(digit);

        // Keep only recent data for analysis
        if (marketData.length > this.RAZIEL_LOOKBACK * 2) {
            marketData.shift();
        }
    }

    private extractLastDigit(quote: number): number {
        return Math.floor((quote * 10000) % 10);
    }

    private updateHotColdZones(): void {
        const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];

        markets.forEach(market => {
            this.analyzeHotColdZones(market);
        });
    }

    private analyzeHotColdZones(market: string): void {
        const data = this.marketData.get(market);
        if (!data || data.length < this.RAZIEL_LOOKBACK) return;

        const recentData = data.slice(-this.RAZIEL_LOOKBACK);
        const digitZones = this.calculateDigitZones(recentData);

        // Update hot/cold data
        const hotColdData = this.hotColdData.get(market)!;
        hotColdData.hotDigits = digitZones.hotZone;
        hotColdData.coldDigits = digitZones.coldZone;
        hotColdData.neutralDigits = digitZones.neutralZone;
        hotColdData.zoneStrength = digitZones.zoneStrengths;
        hotColdData.lastUpdate = Date.now();
    }

    private calculateDigitZones(data: number[]): DigitZoneAnalysis {
        const digitFrequency: Record<number, number> = {};

        // Count digit frequencies
        data.forEach(digit => {
            digitFrequency[digit] = (digitFrequency[digit] || 0) + 1;
        });

        // Calculate expected frequency (should be ~10% for each digit)
        const expectedFreq = data.length / 10;

        const hotZone: number[] = [];
        const coldZone: number[] = [];
        const neutralZone: number[] = [];
        const zoneStrengths: Record<number, number> = {};

        // Classify digits into zones
        for (let digit = 0; digit <= 9; digit++) {
            const frequency = digitFrequency[digit] || 0;
            const ratio = frequency / expectedFreq;

            // Calculate zone strength (0-1 scale)
            zoneStrengths[digit] = Math.min(1, Math.abs(ratio - 1));

            if (ratio >= this.HOT_THRESHOLD) {
                hotZone.push(digit);
            } else if (ratio <= this.COLD_THRESHOLD) {
                coldZone.push(digit);
            } else {
                neutralZone.push(digit);
            }
        }

        // Sort by strength
        hotZone.sort((a, b) => zoneStrengths[b] - zoneStrengths[a]);
        coldZone.sort((a, b) => zoneStrengths[b] - zoneStrengths[a]);

        return {
            hotZone,
            coldZone,
            neutralZone,
            zoneStrengths,
        };
    }

    private generateEntryPointSignals(): void {
        const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
        const signals: SignalsCenterSignal[] = [];

        markets.forEach(market => {
            const entrySignal = this.generateEntrySignalForMarket(market);
            if (entrySignal) {
                signals.push(entrySignal);
            }
        });

        if (signals.length > 0) {
            this.notifySubscribers(signals);
        }
    }

    private generateEntrySignalForMarket(market: string): SignalsCenterSignal | null {
        const data = this.marketData.get(market);
        const hotColdData = this.hotColdData.get(market);

        if (!data || !hotColdData || data.length < 50) return null;

        // Analyze entry point using Raziel algorithm
        const entryAnalysis = this.analyzeOptimalEntry(data, hotColdData);
        if (!entryAnalysis || entryAnalysis.confidence < 0.6) return null;

        // Analyze market momentum
        const momentum = this.analyzeMarketMomentum(data);

        // Determine signal type based on entry analysis
        const signalType = this.determineSignalType(entryAnalysis);
        const confidenceLevel = this.mapConfidenceLevel(entryAnalysis.confidence);

        // Generate comprehensive reasoning
        const reasoning = this.generateComprehensiveReasoning(entryAnalysis, momentum, hotColdData);

        return {
            id: `entry-${market}-${Date.now()}`,
            timestamp: Date.now(),
            market,
            marketDisplay: this.getMarketDisplay(market),
            type: signalType,
            entry: entryAnalysis.optimalEntry,
            duration: '1t',
            confidence: confidenceLevel,
            strategy: 'Entry Point Detection (Raziel)',
            source: 'Hot/Cold Zones',
            status: 'ACTIVE',
            entryDigit: entryAnalysis.optimalEntry,
            validityDuration: 45,
            expiresAt: Date.now() + 45000,
            reason: reasoning,
        };
    }

    private analyzeOptimalEntry(data: number[], hotColdData: HotColdZoneData): EntryPointAnalysis | null {
        const recentData = data.slice(-30); // Last 30 digits
        const supportingFactors: string[] = [];

        // Raziel Algorithm: Look for cold digits that are due to appear
        let optimalEntry = -1;
        let maxConfidence = 0;
        let reasoning = '';

        // Analyze cold digits for potential reversal
        hotColdData.coldDigits.forEach(digit => {
            const timeSinceLastSeen = this.getTimeSinceLastOccurrence(data, digit);
            const zoneStrength = hotColdData.zoneStrength[digit] || 0;

            // Calculate confidence based on how long digit has been absent
            let confidence = 0;

            if (timeSinceLastSeen > 50) {
                confidence = Math.min(0.9, 0.5 + timeSinceLastSeen / 100);
                supportingFactors.push(`Digit ${digit} absent for ${timeSinceLastSeen} ticks`);
            }

            // Boost confidence based on zone strength
            confidence *= 1 + zoneStrength;

            if (confidence > maxConfidence) {
                maxConfidence = confidence;
                optimalEntry = digit;
                reasoning = `Cold digit ${digit} analysis suggests high probability of appearance`;
            }
        });

        // If no strong cold digit signal, look for hot digit exhaustion
        if (maxConfidence < 0.6) {
            hotColdData.hotDigits.forEach(digit => {
                const recentOccurrences = recentData.filter(d => d === digit).length;
                const overheatingFactor = recentOccurrences / recentData.length;

                if (overheatingFactor > 0.4) {
                    // Digit appearing too frequently
                    const confidence = Math.min(0.8, overheatingFactor);

                    if (confidence > maxConfidence) {
                        maxConfidence = confidence;
                        // Predict opposite zone digits
                        const oppositeDigits =
                            hotColdData.coldDigits.length > 0 ? hotColdData.coldDigits : hotColdData.neutralDigits;

                        if (oppositeDigits.length > 0) {
                            optimalEntry = oppositeDigits[0];
                            reasoning = `Hot digit ${digit} overheating (${(overheatingFactor * 100).toFixed(1)}%), predicting cold digit ${optimalEntry}`;
                            supportingFactors.push(
                                `Hot digit ${digit} appeared ${recentOccurrences} times in last ${recentData.length} ticks`
                            );
                        }
                    }
                }
            });
        }

        if (optimalEntry === -1 || maxConfidence < 0.5) return null;

        // Assess risk level
        const riskLevel = this.assessEntryRiskLevel(maxConfidence, supportingFactors.length);

        return {
            optimalEntry,
            confidence: maxConfidence,
            reasoning,
            supportingFactors,
            riskLevel,
        };
    }

    private getTimeSinceLastOccurrence(data: number[], digit: number): number {
        for (let i = data.length - 1; i >= 0; i--) {
            if (data[i] === digit) {
                return data.length - 1 - i;
            }
        }
        return data.length; // Never occurred in available data
    }

    private analyzeMarketMomentum(data: number[]): MarketMomentum {
        const shortTerm = this.calculateMomentum(data.slice(-10));
        const mediumTerm = this.calculateMomentum(data.slice(-30));
        const longTerm = this.calculateMomentum(data.slice(-100));

        // Determine overall momentum
        const momentumScores = [shortTerm, mediumTerm, longTerm];
        const avgMomentum = momentumScores.reduce((sum, m) => sum + m, 0) / momentumScores.length;

        let overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        if (avgMomentum > 0.1) overall = 'BULLISH';
        else if (avgMomentum < -0.1) overall = 'BEARISH';
        else overall = 'NEUTRAL';

        return {
            shortTerm,
            mediumTerm,
            longTerm,
            overall,
        };
    }

    private calculateMomentum(data: number[]): number {
        if (data.length < 2) return 0;

        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));

        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

        return (secondAvg - firstAvg) / 4.5; // Normalize by max possible average (4.5)
    }

    private determineSignalType(
        entryAnalysis: EntryPointAnalysis
    ): 'RISE' | 'FALL' | 'EVEN' | 'ODD' | 'OVER1-5' | 'UNDER1-5' {
        const optimalDigit = entryAnalysis.optimalEntry;

        // Primary decision based on optimal entry digit
        if (optimalDigit >= 5) {
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

    private assessEntryRiskLevel(confidence: number, supportingFactorsCount: number): 'LOW' | 'MEDIUM' | 'HIGH' {
        let riskScore = 0;

        if (confidence < 0.7) riskScore++;
        if (confidence < 0.6) riskScore++;
        if (supportingFactorsCount < 2) riskScore++;

        if (riskScore >= 2) return 'HIGH';
        if (riskScore >= 1) return 'MEDIUM';
        return 'LOW';
    }

    private generateComprehensiveReasoning(
        entryAnalysis: EntryPointAnalysis,
        momentum: MarketMomentum,
        hotColdData: HotColdZoneData
    ): string {
        let reasoning = entryAnalysis.reasoning + '. ';

        // Add momentum analysis
        reasoning += `Market momentum is ${momentum.overall.toLowerCase()} `;
        reasoning += `(Short: ${(momentum.shortTerm * 100).toFixed(1)}%, `;
        reasoning += `Medium: ${(momentum.mediumTerm * 100).toFixed(1)}%, `;
        reasoning += `Long: ${(momentum.longTerm * 100).toFixed(1)}%). `;

        // Add zone analysis
        reasoning += `Hot zone: [${hotColdData.hotDigits.slice(0, 3).join(', ')}], `;
        reasoning += `Cold zone: [${hotColdData.coldDigits.slice(0, 3).join(', ')}]. `;

        // Add supporting factors
        if (entryAnalysis.supportingFactors.length > 0) {
            reasoning += `Supporting factors: ${entryAnalysis.supportingFactors.join(', ')}.`;
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

    public getHotColdZones(market: string): HotColdZoneData | null {
        return this.hotColdData.get(market) || null;
    }

    public getMarketMomentum(market: string): MarketMomentum | null {
        const data = this.marketData.get(market);
        if (!data || data.length < 10) return null;

        return this.analyzeMarketMomentum(data);
    }

    public analyzeEntryTiming(market: string, targetDigit: number): EntryPointAnalysis | null {
        const data = this.marketData.get(market);
        const hotColdData = this.hotColdData.get(market);

        if (!data || !hotColdData) return null;

        // Analyze specific digit for entry timing
        const timeSinceLastSeen = this.getTimeSinceLastOccurrence(data, targetDigit);
        const zoneStrength = hotColdData.zoneStrength[targetDigit] || 0;
        const isInColdZone = hotColdData.coldDigits.includes(targetDigit);
        const isInHotZone = hotColdData.hotDigits.includes(targetDigit);

        let confidence = 0.5; // Base confidence
        const supportingFactors: string[] = [];
        let reasoning = `Analysis for digit ${targetDigit}: `;

        if (isInColdZone && timeSinceLastSeen > 30) {
            confidence += 0.3;
            supportingFactors.push(`In cold zone, absent for ${timeSinceLastSeen} ticks`);
            reasoning += 'Cold zone digit with extended absence suggests high probability. ';
        } else if (isInHotZone && timeSinceLastSeen < 5) {
            confidence -= 0.2;
            supportingFactors.push(`In hot zone, recently appeared`);
            reasoning += 'Hot zone digit with recent appearance suggests lower probability. ';
        }

        // Adjust for zone strength
        confidence += zoneStrength * 0.2;

        const riskLevel = this.assessEntryRiskLevel(confidence, supportingFactors.length);

        return {
            optimalEntry: targetDigit,
            confidence: Math.max(0, Math.min(1, confidence)),
            reasoning,
            supportingFactors,
            riskLevel,
        };
    }

    public getRazielAlgorithmStats(): Record<string, any> {
        const stats: Record<string, any> = {};

        ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'].forEach(market => {
            const data = this.marketData.get(market);
            const hotColdData = this.hotColdData.get(market);

            if (data && hotColdData) {
                stats[market] = {
                    dataPoints: data.length,
                    hotDigits: hotColdData.hotDigits,
                    coldDigits: hotColdData.coldDigits,
                    neutralDigits: hotColdData.neutralDigits,
                    lastUpdate: new Date(hotColdData.lastUpdate).toISOString(),
                    zoneStrengths: hotColdData.zoneStrength,
                };
            }
        });

        return stats;
    }
}

export const entryPointDetector = EntryPointDetectorService.getInstance();

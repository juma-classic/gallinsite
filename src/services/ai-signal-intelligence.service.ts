import { AIEnhancementData, SignalsCenterSignal, TargetDigitsAnalysis } from '@/types/signals';
import { derivConnectionPool } from './deriv-connection-pool.service';

interface NeuralNetworkWeights {
    inputLayer: number[][];
    hiddenLayer: number[][];
    outputLayer: number[][];
}

interface MarketSentimentData {
    bullishIndicators: number;
    bearishIndicators: number;
    neutralIndicators: number;
    overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number;
}

interface TimeframeAnalysis {
    short: { trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number };
    medium: { trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number };
    long: { trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number };
}

export class AISignalIntelligenceService {
    private static instance: AISignalIntelligenceService;
    private marketData: Map<string, number[]> = new Map();
    private neuralWeights: NeuralNetworkWeights;
    private signalSubscribers: Set<(signals: SignalsCenterSignal[]) => void> = new Set();
    private performanceHistory: Map<string, { accuracy: number; trades: number }> = new Map();

    // Neural network configuration
    private readonly INPUT_SIZE = 20; // Last 20 digits
    private readonly HIDDEN_SIZE = 15;
    private readonly OUTPUT_SIZE = 10; // Predict next digit (0-9)
    private readonly LEARNING_RATE = 0.01;

    constructor() {
        if (AISignalIntelligenceService.instance) {
            return AISignalIntelligenceService.instance;
        }
        AISignalIntelligenceService.instance = this;
        this.initializeNeuralNetwork();
        this.initializeService();
    }

    static getInstance(): AISignalIntelligenceService {
        if (!AISignalIntelligenceService.instance) {
            AISignalIntelligenceService.instance = new AISignalIntelligenceService();
        }
        return AISignalIntelligenceService.instance;
    }

    private initializeNeuralNetwork(): void {
        // Initialize neural network weights with random values
        this.neuralWeights = {
            inputLayer: this.createRandomMatrix(this.INPUT_SIZE, this.HIDDEN_SIZE),
            hiddenLayer: this.createRandomMatrix(this.HIDDEN_SIZE, this.HIDDEN_SIZE),
            outputLayer: this.createRandomMatrix(this.HIDDEN_SIZE, this.OUTPUT_SIZE),
        };
    }

    private createRandomMatrix(rows: number, cols: number): number[][] {
        const matrix: number[][] = [];
        for (let i = 0; i < rows; i++) {
            matrix[i] = [];
            for (let j = 0; j < cols; j++) {
                matrix[i][j] = (Math.random() - 0.5) * 2; // Random between -1 and 1
            }
        }
        return matrix;
    }

    private initializeService(): void {
        const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];

        markets.forEach(market => {
            derivConnectionPool.subscribeToTicks(market, tick => {
                this.processTick(market, tick);
            });

            this.marketData.set(market, []);
            this.performanceHistory.set(market, { accuracy: 0.5, trades: 0 });
        });

        // Generate AI signals every 7 seconds
        setInterval(() => {
            this.generateAISignals();
        }, 7000);

        // Train neural network every 30 seconds
        setInterval(() => {
            this.trainNeuralNetwork();
        }, 30000);
    }

    private processTick(market: string, tick: any): void {
        if (!tick.tick?.quote) return;

        const digit = this.extractLastDigit(tick.tick.quote);
        const marketData = this.marketData.get(market)!;

        marketData.push(digit);

        // Keep only last 2000 ticks for training
        if (marketData.length > 2000) {
            marketData.shift();
        }
    }

    private extractLastDigit(quote: number): number {
        return Math.floor((quote * 10000) % 10);
    }

    private generateAISignals(): void {
        const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
        const signals: SignalsCenterSignal[] = [];

        markets.forEach(market => {
            const aiSignal = this.generateAISignalForMarket(market);
            if (aiSignal) {
                signals.push(aiSignal);
            }
        });

        if (signals.length > 0) {
            this.notifySubscribers(signals);
        }
    }

    private generateAISignalForMarket(market: string): SignalsCenterSignal | null {
        const data = this.marketData.get(market);
        if (!data || data.length < this.INPUT_SIZE + 10) {
            return null;
        }

        // Prepare input for neural network
        const input = data.slice(-this.INPUT_SIZE);
        const normalizedInput = input.map(d => d / 9); // Normalize to 0-1

        // Forward pass through neural network
        const prediction = this.forwardPass(normalizedInput);
        const predictedDigit = this.getPredictedDigit(prediction);
        const confidence = Math.max(...prediction);

        // Only generate signal if confidence is high enough
        if (confidence < 0.6) {
            return null;
        }

        // Analyze market sentiment
        const sentiment = this.analyzeMarketSentiment(data);

        // Multi-timeframe analysis
        const timeframeAnalysis = this.performTimeframeAnalysis(data);

        // Calculate adaptive weight based on recent performance
        const performance = this.performanceHistory.get(market)!;
        const adaptiveWeight = this.calculateAdaptiveWeight(performance);

        // Determine signal type and confidence level
        const signalType = this.determineSignalType(predictedDigit);
        const finalConfidence = this.calculateFinalConfidence(confidence, adaptiveWeight, sentiment.confidence);

        // Create AI enhancement data
        const aiData: AIEnhancementData = {
            neuralScore: confidence,
            marketSentiment: sentiment.overallSentiment,
            multiTimeframeAnalysis: {
                short: timeframeAnalysis.short.trend,
                medium: timeframeAnalysis.medium.trend,
                long: timeframeAnalysis.long.trend,
            },
            adaptiveWeight,
            riskLevel: this.assessRiskLevel(confidence, sentiment, timeframeAnalysis),
            supportingPatterns: this.identifySupportingPatterns(data),
            reasoning: this.generateReasoning(predictedDigit, sentiment, timeframeAnalysis, confidence),
        };

        // Create target digits analysis
        const targetAnalysis = this.createTargetDigitsAnalysis(data, prediction);

        return {
            id: `ai-${market}-${Date.now()}`,
            timestamp: Date.now(),
            market,
            marketDisplay: this.getMarketDisplay(market),
            type: signalType,
            entry: predictedDigit,
            duration: '1t',
            confidence: finalConfidence,
            strategy: 'AI Neural Network',
            source: 'AI Intelligence',
            status: 'ACTIVE',
            entryDigit: predictedDigit,
            validityDuration: 40,
            expiresAt: Date.now() + 40000,
            aiData,
            targetDigitsAnalysis: targetAnalysis,
            reason: aiData.reasoning,
        };
    }

    private forwardPass(input: number[]): number[] {
        // Input to hidden layer
        const hidden1 = this.matrixMultiply([input], this.neuralWeights.inputLayer)[0];
        const activatedHidden1 = hidden1.map(x => this.sigmoid(x));

        // Hidden to hidden layer
        const hidden2 = this.matrixMultiply([activatedHidden1], this.neuralWeights.hiddenLayer)[0];
        const activatedHidden2 = hidden2.map(x => this.sigmoid(x));

        // Hidden to output layer
        const output = this.matrixMultiply([activatedHidden2], this.neuralWeights.outputLayer)[0];
        const activatedOutput = output.map(x => this.sigmoid(x));

        // Apply softmax for probability distribution
        return this.softmax(activatedOutput);
    }

    private sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x));
    }

    private softmax(values: number[]): number[] {
        const maxVal = Math.max(...values);
        const expValues = values.map(v => Math.exp(v - maxVal));
        const sumExp = expValues.reduce((sum, val) => sum + val, 0);
        return expValues.map(val => val / sumExp);
    }

    private matrixMultiply(a: number[][], b: number[][]): number[][] {
        const result: number[][] = [];
        for (let i = 0; i < a.length; i++) {
            result[i] = [];
            for (let j = 0; j < b[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < b.length; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    }

    private getPredictedDigit(prediction: number[]): number {
        let maxIndex = 0;
        let maxValue = prediction[0];

        for (let i = 1; i < prediction.length; i++) {
            if (prediction[i] > maxValue) {
                maxValue = prediction[i];
                maxIndex = i;
            }
        }

        return maxIndex;
    }

    private analyzeMarketSentiment(data: number[]): MarketSentimentData {
        const recentData = data.slice(-50);

        let bullishIndicators = 0;
        let bearishIndicators = 0;
        let neutralIndicators = 0;

        // Analyze trends
        const upTrend = this.calculateTrend(recentData.slice(-20));
        const mediumTrend = this.calculateTrend(recentData.slice(-30));
        const longTrend = this.calculateTrend(recentData.slice(-50));

        if (upTrend > 0.1) bullishIndicators++;
        else if (upTrend < -0.1) bearishIndicators++;
        else neutralIndicators++;

        if (mediumTrend > 0.05) bullishIndicators++;
        else if (mediumTrend < -0.05) bearishIndicators++;
        else neutralIndicators++;

        if (longTrend > 0.02) bullishIndicators++;
        else if (longTrend < -0.02) bearishIndicators++;
        else neutralIndicators++;

        // Analyze volatility
        const volatility = this.calculateVolatility(recentData);
        if (volatility > 2.5)
            bearishIndicators++; // High volatility = bearish
        else if (volatility < 1.5)
            bullishIndicators++; // Low volatility = bullish
        else neutralIndicators++;

        const totalIndicators = bullishIndicators + bearishIndicators + neutralIndicators;
        const bullishRatio = bullishIndicators / totalIndicators;
        const bearishRatio = bearishIndicators / totalIndicators;

        let overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        let confidence: number;

        if (bullishRatio > 0.6) {
            overallSentiment = 'BULLISH';
            confidence = bullishRatio;
        } else if (bearishRatio > 0.6) {
            overallSentiment = 'BEARISH';
            confidence = bearishRatio;
        } else {
            overallSentiment = 'NEUTRAL';
            confidence = Math.max(bullishRatio, bearishRatio);
        }

        return {
            bullishIndicators,
            bearishIndicators,
            neutralIndicators,
            overallSentiment,
            confidence,
        };
    }

    private calculateTrend(data: number[]): number {
        if (data.length < 2) return 0;

        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));

        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

        return (secondAvg - firstAvg) / firstAvg;
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

    private performTimeframeAnalysis(data: number[]): TimeframeAnalysis {
        const shortTerm = data.slice(-10);
        const mediumTerm = data.slice(-30);
        const longTerm = data.slice(-100);

        return {
            short: this.analyzeTimeframeTrend(shortTerm),
            medium: this.analyzeTimeframeTrend(mediumTerm),
            long: this.analyzeTimeframeTrend(longTerm),
        };
    }

    private analyzeTimeframeTrend(data: number[]): { trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; strength: number } {
        const trend = this.calculateTrend(data);
        const strength = Math.abs(trend);

        let trendDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        if (trend > 0.05) trendDirection = 'BULLISH';
        else if (trend < -0.05) trendDirection = 'BEARISH';
        else trendDirection = 'NEUTRAL';

        return { trend: trendDirection, strength };
    }

    private calculateAdaptiveWeight(performance: { accuracy: number; trades: number }): number {
        // Weight based on recent performance
        const baseWeight = 0.5;
        const performanceBonus = (performance.accuracy - 0.5) * 0.5; // Bonus/penalty based on accuracy
        const experienceBonus = Math.min(performance.trades / 100, 0.2); // Up to 20% bonus for experience

        return Math.max(0.1, Math.min(1.0, baseWeight + performanceBonus + experienceBonus));
    }

    private determineSignalType(predictedDigit: number): 'RISE' | 'FALL' | 'EVEN' | 'ODD' | 'OVER1-5' | 'UNDER1-5' {
        // Primary decision based on predicted digit
        if (predictedDigit >= 5) {
            return 'OVER1-5';
        } else {
            return 'UNDER1-5';
        }
    }

    private calculateFinalConfidence(
        neuralConfidence: number,
        adaptiveWeight: number,
        sentimentConfidence: number
    ): 'HIGH' | 'MEDIUM' | 'LOW' {
        const combinedConfidence = neuralConfidence * 0.6 + adaptiveWeight * 0.2 + sentimentConfidence * 0.2;

        if (combinedConfidence > 0.8) return 'HIGH';
        if (combinedConfidence > 0.6) return 'MEDIUM';
        return 'LOW';
    }

    private assessRiskLevel(
        confidence: number,
        sentiment: MarketSentimentData,
        timeframe: TimeframeAnalysis
    ): 'LOW' | 'MEDIUM' | 'HIGH' {
        let riskScore = 0;

        // Lower confidence = higher risk
        if (confidence < 0.7) riskScore += 1;
        if (confidence < 0.6) riskScore += 1;

        // Conflicting timeframes = higher risk
        const trends = [timeframe.short.trend, timeframe.medium.trend, timeframe.long.trend];
        const uniqueTrends = new Set(trends).size;
        if (uniqueTrends > 2) riskScore += 1;

        // Neutral sentiment = higher risk
        if (sentiment.overallSentiment === 'NEUTRAL') riskScore += 1;

        if (riskScore >= 3) return 'HIGH';
        if (riskScore >= 2) return 'MEDIUM';
        return 'LOW';
    }

    private identifySupportingPatterns(data: number[]): string[] {
        const patterns: string[] = [];
        const recentData = data.slice(-20);

        // Check for consecutive patterns
        let consecutiveCount = 1;
        for (let i = 1; i < recentData.length; i++) {
            if (recentData[i] === recentData[i - 1]) {
                consecutiveCount++;
            } else {
                if (consecutiveCount >= 3) {
                    patterns.push(`${consecutiveCount} consecutive ${recentData[i - 1]}s`);
                }
                consecutiveCount = 1;
            }
        }

        // Check for alternating patterns
        let alternating = true;
        for (let i = 2; i < Math.min(recentData.length, 8); i++) {
            if (recentData[i] !== recentData[i - 2]) {
                alternating = false;
                break;
            }
        }
        if (alternating) {
            patterns.push('Alternating pattern detected');
        }

        // Check for ascending/descending sequences
        let ascending = true;
        let descending = true;
        for (let i = 1; i < Math.min(recentData.length, 6); i++) {
            if (recentData[i] <= recentData[i - 1]) ascending = false;
            if (recentData[i] >= recentData[i - 1]) descending = false;
        }
        if (ascending) patterns.push('Ascending sequence');
        if (descending) patterns.push('Descending sequence');

        return patterns;
    }

    private generateReasoning(
        predictedDigit: number,
        sentiment: MarketSentimentData,
        timeframe: TimeframeAnalysis,
        confidence: number
    ): string {
        let reasoning = `AI neural network predicts digit ${predictedDigit} with ${(confidence * 100).toFixed(1)}% confidence. `;

        reasoning += `Market sentiment is ${sentiment.overallSentiment.toLowerCase()}. `;

        const timeframeTrends = [timeframe.short.trend, timeframe.medium.trend, timeframe.long.trend];
        const bullishCount = timeframeTrends.filter(t => t === 'BULLISH').length;
        const bearishCount = timeframeTrends.filter(t => t === 'BEARISH').length;

        if (bullishCount > bearishCount) {
            reasoning += 'Multi-timeframe analysis shows bullish bias. ';
        } else if (bearishCount > bullishCount) {
            reasoning += 'Multi-timeframe analysis shows bearish bias. ';
        } else {
            reasoning += 'Multi-timeframe analysis shows mixed signals. ';
        }

        return reasoning;
    }

    private createTargetDigitsAnalysis(data: number[], prediction: number[]): TargetDigitsAnalysis {
        const recentData = data.slice(-100);
        const frequency: Record<number, number> = {};

        // Calculate frequency
        recentData.forEach(digit => {
            frequency[digit] = (frequency[digit] || 0) + 1;
        });

        // Calculate probability
        const probability: Record<number, number> = {};
        for (let i = 0; i <= 9; i++) {
            probability[i] = (frequency[i] || 0) / recentData.length;
        }

        // Find hot and cold digits
        const sortedByFreq = Object.entries(frequency)
            .map(([digit, count]) => ({ digit: parseInt(digit), count }))
            .sort((a, b) => b.count - a.count);

        const hotDigits = sortedByFreq.slice(0, 3).map(item => item.digit);
        const coldDigits = sortedByFreq.slice(-3).map(item => item.digit);

        // Recommendation based on AI prediction
        const recommendation = this.getPredictedDigit(prediction);

        return {
            hotDigits,
            coldDigits,
            frequency,
            probability,
            recommendation,
        };
    }

    private trainNeuralNetwork(): void {
        // Simple training using recent data
        const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];

        markets.forEach(market => {
            const data = this.marketData.get(market);
            if (!data || data.length < this.INPUT_SIZE + 50) return;

            // Create training samples
            const samples = [];
            for (let i = this.INPUT_SIZE; i < data.length - 1; i++) {
                const input = data.slice(i - this.INPUT_SIZE, i).map(d => d / 9);
                const target = data[i];
                samples.push({ input, target });
            }

            // Train on recent samples
            const recentSamples = samples.slice(-20);
            recentSamples.forEach(sample => {
                this.backpropagate(sample.input, sample.target);
            });
        });
    }

    private backpropagate(input: number[], target: number): void {
        // Simplified backpropagation - in a real implementation, this would be more complex
        const prediction = this.forwardPass(input);
        const error = target - this.getPredictedDigit(prediction);

        // Update weights based on error (simplified)
        const learningRate = this.LEARNING_RATE * Math.abs(error);

        // Small random adjustments to weights
        for (let i = 0; i < this.neuralWeights.outputLayer.length; i++) {
            for (let j = 0; j < this.neuralWeights.outputLayer[i].length; j++) {
                this.neuralWeights.outputLayer[i][j] += (Math.random() - 0.5) * learningRate;
            }
        }
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

    public updatePerformance(market: string, wasCorrect: boolean): void {
        const performance = this.performanceHistory.get(market)!;
        const newAccuracy =
            (performance.accuracy * performance.trades + (wasCorrect ? 1 : 0)) / (performance.trades + 1);

        this.performanceHistory.set(market, {
            accuracy: newAccuracy,
            trades: performance.trades + 1,
        });
    }

    public getPerformanceStats(): Map<string, { accuracy: number; trades: number }> {
        return new Map(this.performanceHistory);
    }
}

export const aiSignalIntelligence = AISignalIntelligenceService.getInstance();

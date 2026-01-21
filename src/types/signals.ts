// Signal Types and Interfaces for Signals Center

export interface SignalsCenterSignal {
    id: string;
    timestamp: number;
    market: string;
    marketDisplay: string;
    type: 'RISE' | 'FALL' | 'EVEN' | 'ODD' | 'OVER1-5' | 'UNDER1-5';
    entry: number;
    duration: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'CONSERVATIVE' | 'AGGRESSIVE';
    strategy: string;
    source: string;
    status: 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED' | 'TRADING';
    entryDigit?: number;
    digitPattern?: number[];
    reason?: string;
    validityDuration?: number; // in seconds
    expiresAt?: number;
    remainingTime?: number;
    aiData?: AIEnhancementData;
    targetDigitsAnalysis?: TargetDigitsAnalysis;
}

export interface AIEnhancementData {
    neuralScore: number;
    marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    multiTimeframeAnalysis: {
        short: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        medium: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
        long: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    };
    adaptiveWeight: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    supportingPatterns: string[];
    reasoning: string;
}

export interface TargetDigitsAnalysis {
    hotDigits: number[];
    coldDigits: number[];
    frequency: Record<number, number>;
    probability: Record<number, number>;
    recommendation: number;
}

export interface ConnectionStatus {
    isConnected: boolean;
    connectionId: string;
    appId: string;
    lastPing: number;
    quality: 'EXCELLENT' | 'GOOD' | 'POOR' | 'DISCONNECTED';
    tickCount: number;
}

export interface MarketStats {
    tickCount: number;
    digitFrequency: Record<number, number>;
    recentPattern: number[];
    volatility: number;
    entropy: number;
    lastUpdate: number;
}

export interface TradeRecord {
    contractId: string;
    timestamp: number;
    market: string;
    type: string;
    stake: number;
    profit: number;
    status: 'WON' | 'LOST' | 'ACTIVE';
    signalId?: string;
    entryDigit?: number;
}

export interface SessionStats {
    totalProfit: number;
    totalTrades: number;
    winRate: number;
    consecutiveLosses: number;
    consecutiveWins: number;
    maxDrawdown: number;
    bestWinStreak: number;
    worstLossStreak: number;
}

export interface StakeSettings {
    baseStake: number;
    martingaleMultiplier: number;
    maxMartingaleSteps: number;
    takeProfitLimit: number;
    stopLossLimit: number;
    autoStakeAdjustment: boolean;
}

export interface SignalFilter {
    sources: string[];
    markets: string[];
    strategies: string[];
    confidenceLevels: string[];
    signalTypes: string[];
    minConfidence?: number;
    maxAge?: number; // in seconds
}

export interface BotConfiguration {
    name: string;
    xmlPath: string;
    supportedSignalTypes: string[];
    defaultMarket: string;
    defaultStake: number;
    martingaleSettings: {
        enabled: boolean;
        multiplier: number;
        maxSteps: number;
    };
}

export interface PatternAnalysis {
    pattern: number[];
    frequency: number;
    lastOccurrence: number;
    predictedNext: number[];
    confidence: number;
}

export interface HotColdZoneData {
    hotDigits: number[];
    coldDigits: number[];
    neutralDigits: number[];
    zoneStrength: Record<number, number>;
    lastUpdate: number;
}

export interface SignalGenerationConfig {
    enableAI: boolean;
    enablePatel: boolean;
    enableHotCold: boolean;
    enablePattern: boolean;
    enableTrend: boolean;
    generationInterval: number; // in milliseconds
    signalValidityDuration: number; // in seconds
    minConfidenceThreshold: number;
}

export interface AutoTraderSettings {
    enabled: boolean;
    maxConcurrentTrades: number;
    riskMode: 'NORMAL' | 'LESS_RISKY' | 'OVER3_UNDER6';
    autoLoop: boolean;
    loopCount: number;
    delayBetweenTrades: number; // in milliseconds
}

export interface RiskModeTransformation {
    original: string;
    transformed: string;
    winRateImprovement: number;
    description: string;
}

// Enums for better type safety
export enum SignalType {
    RISE = 'RISE',
    FALL = 'FALL',
    EVEN = 'EVEN',
    ODD = 'ODD',
    OVER1_5 = 'OVER1-5',
    UNDER1_5 = 'UNDER1-5',
}

export enum SignalConfidence {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
    CONSERVATIVE = 'CONSERVATIVE',
    AGGRESSIVE = 'AGGRESSIVE',
}

export enum SignalStatus {
    ACTIVE = 'ACTIVE',
    WON = 'WON',
    LOST = 'LOST',
    EXPIRED = 'EXPIRED',
    TRADING = 'TRADING',
}

export enum SignalSource {
    AI_INTELLIGENCE = 'AI Intelligence',
    PATEL_SIGNALS = 'Patel Signals',
    HOT_COLD_ZONES = 'Hot/Cold Zones',
    PATTERN_RECOGNITION = 'Pattern Recognition',
    TREND_ANALYSIS = 'Trend Analysis',
    DIGIT_HACKER = 'Digit Hacker',
    MULTI_MARKET = 'Multi-Market',
}

export enum RiskMode {
    NORMAL = 'NORMAL',
    LESS_RISKY = 'LESS_RISKY',
    OVER3_UNDER6 = 'OVER3_UNDER6',
}

export enum ConnectionQuality {
    EXCELLENT = 'EXCELLENT',
    GOOD = 'GOOD',
    POOR = 'POOR',
    DISCONNECTED = 'DISCONNECTED',
}

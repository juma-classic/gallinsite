import React, { useEffect,useState } from 'react';
import './SignalsCenter.scss';

type SignalType = 'RISE' | 'FALL' | 'EVEN' | 'ODD' | 'OVER' | 'UNDER';
type SignalCategory = 'rise-fall' | 'even-odd' | 'over-under';

interface Signal {
    id: string;
    market: string;
    type: SignalType;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    timestamp: number;
    entry: number;
    duration: string;
    category: SignalCategory;
    status: 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED';
    expiresAt: number;
}

const SignalsCenterSimplified: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<SignalCategory>('rise-fall');
    const [signals, setSignals] = useState<Signal[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Generate mock signals based on category
    const generateSignals = (category: SignalCategory) => {
        const markets = ['Volatility 75 Index', 'Volatility 100 Index', 'Volatility 25 Index', 'Volatility 50 Index'];
        const confidenceLevels: ('HIGH' | 'MEDIUM' | 'LOW')[] = ['HIGH', 'MEDIUM', 'LOW'];

        let signalTypes: SignalType[] = [];
        switch (category) {
            case 'rise-fall':
                signalTypes = ['RISE', 'FALL'];
                break;
            case 'even-odd':
                signalTypes = ['EVEN', 'ODD'];
                break;
            case 'over-under':
                signalTypes = ['OVER', 'UNDER'];
                break;
        }

        const newSignals: Signal[] = [];
        for (let i = 0; i < 3; i++) {
            const now = Date.now();
            newSignals.push({
                id: `${category}-${i}-${now}`,
                market: markets[Math.floor(Math.random() * markets.length)],
                type: signalTypes[Math.floor(Math.random() * signalTypes.length)],
                confidence: confidenceLevels[Math.floor(Math.random() * confidenceLevels.length)],
                timestamp: now,
                entry: Math.random() * 1000 + 500,
                duration: '1 min',
                category,
                status: 'ACTIVE',
                expiresAt: now + 60000, // 1 minute from now
            });
        }

        return newSignals;
    };

    // Update signals when category changes
    useEffect(() => {
        setIsGenerating(true);
        const timer = setTimeout(() => {
            setSignals(generateSignals(activeCategory));
            setIsGenerating(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [activeCategory]);

    // Update countdown timers
    useEffect(() => {
        const interval = setInterval(() => {
            setSignals(prevSignals =>
                prevSignals.map(signal => {
                    const remaining = signal.expiresAt - Date.now();
                    if (remaining <= 0) {
                        return { ...signal, status: Math.random() > 0.3 ? 'WON' : 'LOST' };
                    }
                    return signal;
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const getTimeRemaining = (expiresAt: number) => {
        const remaining = Math.max(0, expiresAt - Date.now());
        const seconds = Math.floor(remaining / 1000);
        return `${seconds}s`;
    };

    const getCategoryTitle = (category: SignalCategory) => {
        switch (category) {
            case 'rise-fall':
                return 'Rise/Fall Signals';
            case 'even-odd':
                return 'Even/Odd Signals';
            case 'over-under':
                return 'Over/Under Signals';
        }
    };

    return (
        <div className='signals-center-themed'>
            {/* Header */}
            <div className='signals-header-themed'>
                <div className='signals-title-themed'>
                    <h2>🎯 Signals Center</h2>
                    <span className='signals-subtitle-themed'>Real-time Trading Signals</span>
                </div>
                <div className='signals-stats-themed'>
                    <div className='stat-item-themed'>
                        <span className='stat-label-themed'>Active</span>
                        <span className='stat-value-themed'>{signals.filter(s => s.status === 'ACTIVE').length}</span>
                    </div>
                    <div className='stat-item-themed'>
                        <span className='stat-label-themed'>Win Rate</span>
                        <span className='stat-value-themed'>73%</span>
                    </div>
                </div>
            </div>

            {/* Category Selector */}
            <div className='category-selector-themed'>
                <button
                    className={`category-btn-themed ${activeCategory === 'rise-fall' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('rise-fall')}
                >
                    <span className='category-icon-themed'>📈</span>
                    <span>Rise/Fall</span>
                </button>
                <button
                    className={`category-btn-themed ${activeCategory === 'even-odd' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('even-odd')}
                >
                    <span className='category-icon-themed'>🎲</span>
                    <span>Even/Odd</span>
                </button>
                <button
                    className={`category-btn-themed ${activeCategory === 'over-under' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('over-under')}
                >
                    <span className='category-icon-themed'>⚖️</span>
                    <span>Over/Under</span>
                </button>
            </div>

            {/* Signals Content */}
            <div className='signals-content-themed'>
                <div className='signals-section-header-themed'>
                    <h3>{getCategoryTitle(activeCategory)}</h3>
                    <div className='section-controls-themed'>
                        <button
                            className='refresh-btn-themed'
                            onClick={() => setSignals(generateSignals(activeCategory))}
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {isGenerating ? (
                    <div className='loading-state-themed'>
                        <div className='loading-spinner-themed'></div>
                        <span>Generating signals...</span>
                    </div>
                ) : (
                    <div className='signals-grid-themed'>
                        {signals.map(signal => (
                            <div key={signal.id} className={`signal-card-themed ${signal.status.toLowerCase()}`}>
                                <div className='signal-header-themed'>
                                    <div className='signal-market-themed'>
                                        <span className='market-name-themed'>{signal.market}</span>
                                        <span className='signal-time-themed'>
                                            {new Date(signal.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className={`signal-status-themed ${signal.status.toLowerCase()}`}>
                                        {signal.status}
                                    </div>
                                </div>

                                <div className='signal-body-themed'>
                                    <div className='signal-prediction-themed'>
                                        <div className={`prediction-type-themed ${signal.type.toLowerCase()}`}>
                                            <span className='prediction-icon-themed'>
                                                {signal.type === 'RISE' && '↗️'}
                                                {signal.type === 'FALL' && '↘️'}
                                                {signal.type === 'EVEN' && '2️⃣'}
                                                {signal.type === 'ODD' && '1️⃣'}
                                                {signal.type === 'OVER' && '⬆️'}
                                                {signal.type === 'UNDER' && '⬇️'}
                                            </span>
                                            <span className='prediction-text-themed'>{signal.type}</span>
                                        </div>
                                        <div className={`confidence-badge-themed ${signal.confidence.toLowerCase()}`}>
                                            {signal.confidence}
                                        </div>
                                    </div>

                                    <div className='signal-details-themed'>
                                        <div className='detail-item-themed'>
                                            <span className='detail-label-themed'>Entry:</span>
                                            <span className='detail-value-themed'>{signal.entry.toFixed(2)}</span>
                                        </div>
                                        <div className='detail-item-themed'>
                                            <span className='detail-label-themed'>Duration:</span>
                                            <span className='detail-value-themed'>{signal.duration}</span>
                                        </div>
                                        {signal.status === 'ACTIVE' && (
                                            <div className='detail-item-themed'>
                                                <span className='detail-label-themed'>Expires:</span>
                                                <span className='detail-value-themed countdown-themed'>
                                                    {getTimeRemaining(signal.expiresAt)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className='signal-actions-themed'>
                                    {signal.status === 'ACTIVE' ? (
                                        <button className='trade-btn-themed'>
                                            <span>🚀 Trade Now</span>
                                        </button>
                                    ) : (
                                        <div className={`result-badge-themed ${signal.status.toLowerCase()}`}>
                                            {signal.status === 'WON' ? '✅ Won' : '❌ Lost'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {signals.length === 0 && !isGenerating && (
                    <div className='empty-state-themed'>
                        <div className='empty-icon-themed'>📊</div>
                        <h4>No signals available</h4>
                        <p>
                            Click refresh to generate new signals for {getCategoryTitle(activeCategory).toLowerCase()}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignalsCenterSimplified;

import React, { useEffect, useState } from 'react';
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
        const markets = [
            'Volatility 10 Index',
            'Volatility 25 Index',
            'Volatility 50 Index',
            'Volatility 75 Index',
            'Volatility 100 Index',
            'Volatility 150 Index',
            'Volatility 250 Index',
            'Volatility 10 (1s) Index',
            'Volatility 25 (1s) Index',
            'Volatility 50 (1s) Index',
            'Volatility 75 (1s) Index',
            'Volatility 100 (1s) Index',
            'Jump 10 Index',
            'Jump 25 Index',
            'Jump 50 Index',
            'Jump 75 Index',
            'Jump 100 Index',
            'Crash 300 Index',
            'Crash 500 Index',
            'Crash 1000 Index',
            'Boom 300 Index',
            'Boom 500 Index',
            'Boom 1000 Index',
        ];
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
        <div className='signals-center-enhanced'>
            {/* Enhanced Header */}
            <div className='signals-header-enhanced'>
                <div className='signals-title-enhanced'>
                    <h1>🎯 Signals Center</h1>
                    <span className='signals-subtitle-enhanced'>Real-time Trading Signals</span>
                </div>
                <div className='performance-overview-enhanced'>
                    <div className='perf-stat-enhanced'>
                        <span className='perf-label-enhanced'>Win Rate</span>
                        <span className='perf-value-enhanced success'>73%</span>
                    </div>
                    <div className='perf-stat-enhanced'>
                        <span className='perf-label-enhanced'>Active</span>
                        <span className='perf-value-enhanced'>{signals.filter(s => s.status === 'ACTIVE').length}</span>
                    </div>
                    <div className='perf-stat-enhanced'>
                        <span className='perf-label-enhanced'>Profit</span>
                        <span className='perf-value-enhanced profit'>+$2,847</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className='signals-main-content-enhanced'>
                {/* Left Sidebar - Market Overview */}
                <div className='market-sidebar-enhanced'>
                    <div className='sidebar-section-enhanced'>
                        <h3>🏆 Top Markets</h3>
                        <div className='market-list-enhanced'>
                            <div className='market-item-enhanced active'>
                                <div className='market-info-enhanced'>
                                    <span className='market-name-enhanced'>Volatility 75</span>
                                    <span className='market-signals-enhanced'>12 signals</span>
                                </div>
                                <div className='market-stats-enhanced'>
                                    <span className='market-winrate-enhanced high'>78%</span>
                                    <span className='market-time-enhanced'>2m ago</span>
                                </div>
                                <div className='market-status-enhanced active'>ACTIVE</div>
                            </div>
                            <div className='market-item-enhanced'>
                                <div className='market-info-enhanced'>
                                    <span className='market-name-enhanced'>Volatility 100</span>
                                    <span className='market-signals-enhanced'>8 signals</span>
                                </div>
                                <div className='market-stats-enhanced'>
                                    <span className='market-winrate-enhanced high'>72%</span>
                                    <span className='market-time-enhanced'>5m ago</span>
                                </div>
                                <div className='market-status-enhanced active'>ACTIVE</div>
                            </div>
                            <div className='market-item-enhanced'>
                                <div className='market-info-enhanced'>
                                    <span className='market-name-enhanced'>Crash 1000</span>
                                    <span className='market-signals-enhanced'>6 signals</span>
                                </div>
                                <div className='market-stats-enhanced'>
                                    <span className='market-winrate-enhanced medium'>65%</span>
                                    <span className='market-time-enhanced'>8m ago</span>
                                </div>
                                <div className='market-status-enhanced idle'>IDLE</div>
                            </div>
                        </div>
                    </div>

                    <div className='sidebar-section-enhanced'>
                        <h3>🎯 Hot Strategies</h3>
                        <div className='strategy-list-enhanced'>
                            <div className='strategy-item-enhanced'>
                                <span className='strategy-name-enhanced'>Martingale Pro</span>
                                <span className='strategy-rate-enhanced success'>85%</span>
                            </div>
                            <div className='strategy-item-enhanced'>
                                <span className='strategy-name-enhanced'>Pattern Hunter</span>
                                <span className='strategy-rate-enhanced success'>79%</span>
                            </div>
                            <div className='strategy-item-enhanced'>
                                <span className='strategy-name-enhanced'>Trend Rider</span>
                                <span className='strategy-rate-enhanced success'>74%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Content - Signals */}
                <div className='signals-center-content-enhanced'>
                    {/* Category Selector */}
                    <div className='category-selector-enhanced'>
                        <button
                            className={`category-btn-enhanced ${activeCategory === 'rise-fall' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('rise-fall')}
                        >
                            <span className='category-icon-enhanced'>📈</span>
                            <div className='category-text-enhanced'>
                                <span>Rise/Fall</span>
                                <small>Binary Options</small>
                            </div>
                        </button>
                        <button
                            className={`category-btn-enhanced ${activeCategory === 'even-odd' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('even-odd')}
                        >
                            <span className='category-icon-enhanced'>🎲</span>
                            <div className='category-text-enhanced'>
                                <span>Even/Odd</span>
                                <small>Digit Prediction</small>
                            </div>
                        </button>
                        <button
                            className={`category-btn-enhanced ${activeCategory === 'over-under' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('over-under')}
                        >
                            <span className='category-icon-enhanced'>⚖️</span>
                            <div className='category-text-enhanced'>
                                <span>Over/Under</span>
                                <small>Barrier Options</small>
                            </div>
                        </button>
                    </div>

                    {/* Signals Content */}
                    <div className='signals-content-enhanced'>
                        <div className='signals-section-header-enhanced'>
                            <h2>{getCategoryTitle(activeCategory)}</h2>
                            <div className='section-controls-enhanced'>
                                <button
                                    className='refresh-btn-enhanced'
                                    onClick={() => setSignals(generateSignals(activeCategory))}
                                >
                                    🔄 Refresh
                                </button>
                                <button className='auto-trade-btn-enhanced'>🚀 Auto Trade</button>
                            </div>
                        </div>

                        {isGenerating ? (
                            <div className='loading-state-enhanced'>
                                <div className='loading-spinner-enhanced'></div>
                                <span>Generating signals...</span>
                            </div>
                        ) : (
                            <div className='signals-grid-enhanced'>
                                {signals.map(signal => (
                                    <div
                                        key={signal.id}
                                        className={`signal-card-enhanced ${signal.status.toLowerCase()}`}
                                    >
                                        <div className='signal-header-enhanced'>
                                            <div className='signal-market-enhanced'>
                                                <span className='market-name-enhanced'>{signal.market}</span>
                                                <span className='signal-time-enhanced'>
                                                    {new Date(signal.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className={`signal-status-enhanced ${signal.status.toLowerCase()}`}>
                                                {signal.status}
                                            </div>
                                        </div>

                                        <div className='signal-body-enhanced'>
                                            <div className='signal-prediction-enhanced'>
                                                <div className='prediction-type-enhanced'>
                                                    <span className='prediction-icon-enhanced'>
                                                        {signal.type === 'RISE' && '↗️'}
                                                        {signal.type === 'FALL' && '↘️'}
                                                        {signal.type === 'EVEN' && '2️⃣'}
                                                        {signal.type === 'ODD' && '1️⃣'}
                                                        {signal.type === 'OVER' && '⬆️'}
                                                        {signal.type === 'UNDER' && '⬇️'}
                                                    </span>
                                                    <span className='prediction-text-enhanced'>{signal.type}</span>
                                                </div>
                                                <div
                                                    className={`confidence-badge-enhanced ${signal.confidence.toLowerCase()}`}
                                                >
                                                    {signal.confidence}
                                                </div>
                                            </div>

                                            <div className='signal-strategy-enhanced'>
                                                <span className='strategy-label-enhanced'>Strategy:</span>
                                                <span className='strategy-name-enhanced'>Pattern Hunter</span>
                                                <span className='strategy-winrate-enhanced'>79%</span>
                                            </div>

                                            <div className='signal-details-enhanced'>
                                                <div className='detail-item-enhanced'>
                                                    <span className='detail-label-enhanced'>Entry</span>
                                                    <span className='detail-value-enhanced'>
                                                        {signal.entry.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className='detail-item-enhanced'>
                                                    <span className='detail-label-enhanced'>Duration</span>
                                                    <span className='detail-value-enhanced'>{signal.duration}</span>
                                                </div>
                                                {signal.status === 'ACTIVE' && (
                                                    <div className='detail-item-enhanced'>
                                                        <span className='detail-label-enhanced'>Expires</span>
                                                        <span className='detail-value-enhanced countdown-enhanced'>
                                                            {getTimeRemaining(signal.expiresAt)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className='signal-actions-enhanced'>
                                            {signal.status === 'ACTIVE' ? (
                                                <div className='action-buttons-enhanced'>
                                                    <button className='trade-btn-enhanced primary'>🚀 Trade Now</button>
                                                    <button className='trade-btn-enhanced secondary'>📊 Analyze</button>
                                                </div>
                                            ) : (
                                                <div className={`result-badge-enhanced ${signal.status.toLowerCase()}`}>
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
                                    Click refresh to generate new signals for{' '}
                                    {getCategoryTitle(activeCategory).toLowerCase()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Performance & Info */}
                <div className='info-sidebar-enhanced'>
                    <div className='sidebar-section-enhanced'>
                        <h3>📈 Performance</h3>
                        <div className='performance-chart-enhanced'>
                            <div className='chart-placeholder-enhanced'>
                                <div className='chart-bars-enhanced'>
                                    <div className='chart-bar-enhanced' style={{ height: '60%' }}></div>
                                    <div className='chart-bar-enhanced' style={{ height: '80%' }}></div>
                                    <div className='chart-bar-enhanced' style={{ height: '45%' }}></div>
                                    <div className='chart-bar-enhanced' style={{ height: '90%' }}></div>
                                    <div className='chart-bar-enhanced' style={{ height: '70%' }}></div>
                                </div>
                                <span className='chart-label-enhanced'>Last 5 sessions</span>
                            </div>
                        </div>
                    </div>

                    <div className='sidebar-section-enhanced'>
                        <h3>🎯 Recent Results</h3>
                        <div className='recent-results-enhanced'>
                            <div className='result-item-enhanced won'>
                                <div>
                                    <span className='result-market-enhanced'>Vol 75</span>
                                    <span className='result-type-enhanced'>RISE</span>
                                </div>
                                <span className='result-outcome-enhanced positive'>+$45</span>
                            </div>
                            <div className='result-item-enhanced won'>
                                <div>
                                    <span className='result-market-enhanced'>Vol 100</span>
                                    <span className='result-type-enhanced'>FALL</span>
                                </div>
                                <span className='result-outcome-enhanced positive'>+$32</span>
                            </div>
                            <div className='result-item-enhanced lost'>
                                <div>
                                    <span className='result-market-enhanced'>Crash 1000</span>
                                    <span className='result-type-enhanced'>OVER</span>
                                </div>
                                <span className='result-outcome-enhanced negative'>-$20</span>
                            </div>
                        </div>
                    </div>

                    <div className='sidebar-section-enhanced'>
                        <h3>⚙️ Quick Settings</h3>
                        <div className='quick-settings-enhanced'>
                            <div className='setting-item-enhanced'>
                                <label>Auto Refresh</label>
                                <input type='checkbox' defaultChecked />
                            </div>
                            <div className='setting-item-enhanced'>
                                <label>Sound Alerts</label>
                                <input type='checkbox' />
                            </div>
                            <div className='setting-item-enhanced'>
                                <label>High Confidence Only</label>
                                <input type='checkbox' />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignalsCenterSimplified;

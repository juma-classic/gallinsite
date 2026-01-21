import React, { useEffect,useState } from 'react';
import { signalAnalysis } from '@/services/signal-analysis.service';
import { stakeManager } from '@/services/stake-manager.service';
import './PerformanceDashboard.scss';

const PerformanceDashboard: React.FC = () => {
    const [sessionStats, setSessionStats] = useState(stakeManager.getSessionStats());
    const [tradeHistory, setTradeHistory] = useState(stakeManager.getTradeHistory());
    const [marketStats, setMarketStats] = useState<Record<string, any>>({});

    useEffect(() => {
        const interval = setInterval(() => {
            setSessionStats(stakeManager.getSessionStats());
            setTradeHistory(stakeManager.getTradeHistory());

            // Get market statistics
            const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
            const stats: Record<string, any> = {};
            markets.forEach(market => {
                stats[market] = signalAnalysis.getMarketStats(market);
            });
            setMarketStats(stats);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const calculateProfitByTimeframe = () => {
        const now = Date.now();
        const timeframes = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
        };

        const results: Record<string, { profit: number; trades: number; winRate: number }> = {};

        Object.entries(timeframes).forEach(([period, duration]) => {
            const cutoff = now - duration;
            const periodTrades = tradeHistory.filter(trade => trade.timestamp >= cutoff);

            const profit = periodTrades.reduce((sum, trade) => sum + trade.profit, 0);
            const wins = periodTrades.filter(trade => trade.status === 'WON').length;
            const winRate = periodTrades.length > 0 ? (wins / periodTrades.length) * 100 : 0;

            results[period] = {
                profit: Math.round(profit * 100) / 100,
                trades: periodTrades.length,
                winRate: Math.round(winRate * 100) / 100,
            };
        });

        return results;
    };

    const calculateProfitByMarket = () => {
        const marketProfits: Record<string, { profit: number; trades: number; winRate: number }> = {};

        tradeHistory.forEach(trade => {
            if (!marketProfits[trade.market]) {
                marketProfits[trade.market] = { profit: 0, trades: 0, winRate: 0 };
            }

            marketProfits[trade.market].profit += trade.profit;
            marketProfits[trade.market].trades += 1;
        });

        // Calculate win rates
        Object.keys(marketProfits).forEach(market => {
            const marketTrades = tradeHistory.filter(t => t.market === market);
            const wins = marketTrades.filter(t => t.status === 'WON').length;
            marketProfits[market].winRate = marketTrades.length > 0 ? (wins / marketTrades.length) * 100 : 0;
            marketProfits[market].profit = Math.round(marketProfits[market].profit * 100) / 100;
            marketProfits[market].winRate = Math.round(marketProfits[market].winRate * 100) / 100;
        });

        return marketProfits;
    };

    const exportData = () => {
        const data = stakeManager.exportTradeHistory();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trading-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const profitByTimeframe = calculateProfitByTimeframe();
    const profitByMarket = calculateProfitByMarket();

    return (
        <div className='performance-dashboard'>
            <div className='performance-dashboard__header'>
                <h2>Performance Dashboard</h2>
                <div className='dashboard-controls'>
                    <button className='export-button' onClick={exportData}>
                        📊 Export Data
                    </button>
                </div>
            </div>

            <div className='performance-dashboard__content'>
                {/* Overall Statistics */}
                <div className='dashboard-section'>
                    <h3>Overall Performance</h3>
                    <div className='stats-grid stats-grid--large'>
                        <div className='stat-card'>
                            <div className='stat-card__icon'>💰</div>
                            <div className='stat-card__content'>
                                <div className='stat-card__label'>Total Profit</div>
                                <div
                                    className={`stat-card__value ${sessionStats.totalProfit >= 0 ? 'stat-card__value--positive' : 'stat-card__value--negative'}`}
                                >
                                    ${sessionStats.totalProfit}
                                </div>
                            </div>
                        </div>

                        <div className='stat-card'>
                            <div className='stat-card__icon'>📈</div>
                            <div className='stat-card__content'>
                                <div className='stat-card__label'>Win Rate</div>
                                <div className='stat-card__value'>{sessionStats.winRate}%</div>
                            </div>
                        </div>

                        <div className='stat-card'>
                            <div className='stat-card__icon'>🎯</div>
                            <div className='stat-card__content'>
                                <div className='stat-card__label'>Total Trades</div>
                                <div className='stat-card__value'>{sessionStats.totalTrades}</div>
                            </div>
                        </div>

                        <div className='stat-card'>
                            <div className='stat-card__icon'>🔥</div>
                            <div className='stat-card__content'>
                                <div className='stat-card__label'>Current Streak</div>
                                <div className='stat-card__value'>{sessionStats.consecutiveLosses} losses</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profit by Timeframe */}
                <div className='dashboard-section'>
                    <h3>Profit by Timeframe</h3>
                    <div className='timeframe-grid'>
                        {Object.entries(profitByTimeframe).map(([period, data]) => (
                            <div key={period} className='timeframe-card'>
                                <div className='timeframe-card__header'>
                                    <span className='timeframe-period'>{period.toUpperCase()}</span>
                                </div>
                                <div className='timeframe-card__stats'>
                                    <div className='timeframe-stat'>
                                        <span className='timeframe-stat__label'>Profit:</span>
                                        <span
                                            className={`timeframe-stat__value ${data.profit >= 0 ? 'timeframe-stat__value--positive' : 'timeframe-stat__value--negative'}`}
                                        >
                                            ${data.profit}
                                        </span>
                                    </div>
                                    <div className='timeframe-stat'>
                                        <span className='timeframe-stat__label'>Trades:</span>
                                        <span className='timeframe-stat__value'>{data.trades}</span>
                                    </div>
                                    <div className='timeframe-stat'>
                                        <span className='timeframe-stat__label'>Win Rate:</span>
                                        <span className='timeframe-stat__value'>{data.winRate}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Profit by Market */}
                <div className='dashboard-section'>
                    <h3>Performance by Market</h3>
                    <div className='market-grid'>
                        {Object.entries(profitByMarket).map(([market, data]) => (
                            <div key={market} className='market-card'>
                                <div className='market-card__header'>
                                    <span className='market-name'>{market}</span>
                                    <span
                                        className={`market-profit ${data.profit >= 0 ? 'market-profit--positive' : 'market-profit--negative'}`}
                                    >
                                        ${data.profit}
                                    </span>
                                </div>
                                <div className='market-card__stats'>
                                    <div className='market-stat'>
                                        <span>Trades: {data.trades}</span>
                                    </div>
                                    <div className='market-stat'>
                                        <span>Win Rate: {data.winRate}%</span>
                                    </div>
                                </div>
                                <div className='market-card__progress'>
                                    <div className='progress-bar'>
                                        <div
                                            className='progress-fill'
                                            style={{ width: `${Math.min(data.winRate, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Market Statistics */}
                <div className='dashboard-section'>
                    <h3>Market Analysis</h3>
                    <div className='market-analysis-grid'>
                        {Object.entries(marketStats).map(([market, stats]) => (
                            <div key={market} className='market-analysis-card'>
                                <div className='market-analysis-card__header'>
                                    <h4>{market}</h4>
                                    <span className='tick-count'>{stats.tickCount || 0} ticks</span>
                                </div>

                                {stats.digitFrequency && (
                                    <div className='digit-frequency'>
                                        <h5>Digit Frequency</h5>
                                        <div className='frequency-bars'>
                                            {Object.entries(stats.digitFrequency).map(([digit, count]) => {
                                                const total = Object.values(stats.digitFrequency).reduce(
                                                    (sum: number, c: any) => sum + c,
                                                    0
                                                );
                                                const percentage = total > 0 ? ((count as number) / total) * 100 : 0;

                                                return (
                                                    <div key={digit} className='frequency-bar'>
                                                        <span className='frequency-digit'>{digit}</span>
                                                        <div className='frequency-track'>
                                                            <div
                                                                className='frequency-fill'
                                                                style={{ height: `${percentage}%` }}
                                                            />
                                                        </div>
                                                        <span className='frequency-percentage'>
                                                            {percentage.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {stats.recentPattern && (
                                    <div className='recent-pattern'>
                                        <h5>Recent Pattern</h5>
                                        <div className='pattern-digits'>
                                            {stats.recentPattern.slice(-10).map((digit: number, index: number) => (
                                                <span key={index} className='pattern-digit'>
                                                    {digit}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Trades */}
                <div className='dashboard-section'>
                    <h3>Recent Trades</h3>
                    <div className='trades-table'>
                        <div className='trades-table__header'>
                            <span>Time</span>
                            <span>Market</span>
                            <span>Type</span>
                            <span>Stake</span>
                            <span>Profit</span>
                            <span>Status</span>
                        </div>
                        <div className='trades-table__body'>
                            {tradeHistory
                                .slice(-10)
                                .reverse()
                                .map((trade, index) => (
                                    <div key={trade.contractId || index} className='trade-row'>
                                        <span className='trade-time'>
                                            {new Date(trade.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className='trade-market'>{trade.market}</span>
                                        <span className='trade-type'>{trade.type}</span>
                                        <span className='trade-stake'>${trade.stake.toFixed(2)}</span>
                                        <span
                                            className={`trade-profit ${trade.profit >= 0 ? 'trade-profit--positive' : 'trade-profit--negative'}`}
                                        >
                                            ${trade.profit.toFixed(2)}
                                        </span>
                                        <span className={`trade-status trade-status--${trade.status.toLowerCase()}`}>
                                            {trade.status}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDashboard;

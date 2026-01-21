import React, { useEffect, useMemo,useState } from 'react';
import { derivConnectionPool } from '@/services/deriv-connection-pool.service';
import './PerformanceDashboard.scss';

interface PerformanceMetrics {
    totalSignals: number;
    successfulSignals: number;
    failedSignals: number;
    winRate: number;
    averageConfidence: number;
    totalProfit: number;
    bestStreak: number;
    currentStreak: number;
    lastUpdated: number;
}

interface ServicePerformance {
    [key: string]: PerformanceMetrics;
}

interface MarketPerformance {
    market: string;
    totalTrades: number;
    winRate: number;
    profit: number;
    averageConfidence: number;
}

const PerformanceDashboard: React.FC = () => {
    const [servicePerformance, setServicePerformance] = useState<ServicePerformance>({});
    const [marketPerformance, setMarketPerformance] = useState<MarketPerformance[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DEGRADED' | 'DISCONNECTED'>('DISCONNECTED');
    const [realTimeStats, setRealTimeStats] = useState({
        activeSignals: 0,
        signalsToday: 0,
        profitToday: 0,
        ticksReceived: 0,
    });

    // Initialize performance tracking
    useEffect(() => {
        const initializePerformance = () => {
            // Initialize service performance
            const services = ['AI Intelligence', 'Patel Signals', 'Pattern Recognition'];
            const initialPerformance: ServicePerformance = {};

            services.forEach(service => {
                initialPerformance[service] = {
                    totalSignals: 0,
                    successfulSignals: 0,
                    failedSignals: 0,
                    winRate: 0,
                    averageConfidence: 0,
                    totalProfit: 0,
                    bestStreak: 0,
                    currentStreak: 0,
                    lastUpdated: Date.now(),
                };
            });

            setServicePerformance(initialPerformance);

            // Initialize market performance
            const markets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
            const initialMarkets: MarketPerformance[] = markets.map(market => ({
                market,
                totalTrades: 0,
                winRate: 0,
                profit: 0,
                averageConfidence: 0,
            }));

            setMarketPerformance(initialMarkets);
        };

        initializePerformance();

        // Update connection status
        const updateConnectionStatus = () => {
            const status = derivConnectionPool.getOverallStatus();
            setConnectionStatus(status);
        };

        const statusInterval = setInterval(updateConnectionStatus, 5000);
        updateConnectionStatus();

        return () => {
            clearInterval(statusInterval);
        };
    }, []);

    // Simulate performance updates (in real implementation, this would come from actual trading results)
    useEffect(() => {
        const simulatePerformanceUpdates = () => {
            setServicePerformance(prev => {
                const updated = { ...prev };

                Object.keys(updated).forEach(service => {
                    const metrics = updated[service];

                    // Simulate occasional signal results
                    if (Math.random() < 0.1) {
                        // 10% chance per update
                        const isWin = Math.random() > 0.4; // 60% win rate simulation

                        metrics.totalSignals++;
                        if (isWin) {
                            metrics.successfulSignals++;
                            metrics.currentStreak = metrics.currentStreak > 0 ? metrics.currentStreak + 1 : 1;
                            metrics.totalProfit += Math.random() * 10 + 5; // Random profit
                        } else {
                            metrics.failedSignals++;
                            metrics.currentStreak = metrics.currentStreak < 0 ? metrics.currentStreak - 1 : -1;
                            metrics.totalProfit -= Math.random() * 8 + 3; // Random loss
                        }

                        metrics.winRate =
                            metrics.totalSignals > 0 ? (metrics.successfulSignals / metrics.totalSignals) * 100 : 0;

                        metrics.bestStreak = Math.max(metrics.bestStreak, Math.abs(metrics.currentStreak));
                        metrics.lastUpdated = Date.now();
                    }
                });

                return updated;
            });

            // Update real-time stats
            setRealTimeStats(prev => ({
                ...prev,
                activeSignals: Math.floor(Math.random() * 5) + 1,
                signalsToday: prev.signalsToday + (Math.random() < 0.05 ? 1 : 0),
                profitToday: prev.profitToday + (Math.random() < 0.03 ? (Math.random() - 0.4) * 20 : 0),
                ticksReceived: prev.ticksReceived + Math.floor(Math.random() * 3),
            }));
        };

        const performanceInterval = setInterval(simulatePerformanceUpdates, 2000);
        return () => clearInterval(performanceInterval);
    }, []);

    // Calculate overall performance metrics
    const overallMetrics = useMemo(() => {
        const services = Object.values(servicePerformance);
        const totalSignals = services.reduce((sum, s) => sum + s.totalSignals, 0);
        const totalSuccessful = services.reduce((sum, s) => sum + s.successfulSignals, 0);
        const totalProfit = services.reduce((sum, s) => sum + s.totalProfit, 0);
        const overallWinRate = totalSignals > 0 ? (totalSuccessful / totalSignals) * 100 : 0;

        return {
            totalSignals,
            totalSuccessful,
            totalProfit,
            overallWinRate,
        };
    }, [servicePerformance]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONNECTED':
                return '#00a651';
            case 'DEGRADED':
                return '#ff6444';
            case 'DISCONNECTED':
                return '#ec3f3f';
            default:
                return '#999';
        }
    };

    const getWinRateColor = (winRate: number) => {
        if (winRate >= 70) return '#00a651';
        if (winRate >= 50) return '#ff6444';
        return '#ec3f3f';
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toFixed(2)}`;
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    return (
        <div className='performance-dashboard'>
            <div className='dashboard-header'>
                <h2>Performance Dashboard</h2>
                <div className='connection-indicator'>
                    <span className='status-dot' style={{ backgroundColor: getStatusColor(connectionStatus) }} />
                    <span className='status-text'>{connectionStatus}</span>
                </div>
            </div>

            {/* Real-time Stats */}
            <div className='stats-grid'>
                <div className='stat-card'>
                    <div className='stat-value'>{realTimeStats.activeSignals}</div>
                    <div className='stat-label'>Active Signals</div>
                </div>
                <div className='stat-card'>
                    <div className='stat-value'>{realTimeStats.signalsToday}</div>
                    <div className='stat-label'>Signals Today</div>
                </div>
                <div className='stat-card'>
                    <div
                        className='stat-value'
                        style={{ color: realTimeStats.profitToday >= 0 ? '#00a651' : '#ec3f3f' }}
                    >
                        {formatCurrency(realTimeStats.profitToday)}
                    </div>
                    <div className='stat-label'>Profit Today</div>
                </div>
                <div className='stat-card'>
                    <div className='stat-value'>{realTimeStats.ticksReceived.toLocaleString()}</div>
                    <div className='stat-label'>Ticks Received</div>
                </div>
            </div>

            {/* Overall Performance */}
            <div className='performance-section'>
                <h3>Overall Performance</h3>
                <div className='overall-stats'>
                    <div className='overall-stat'>
                        <span className='label'>Total Signals:</span>
                        <span className='value'>{overallMetrics.totalSignals}</span>
                    </div>
                    <div className='overall-stat'>
                        <span className='label'>Win Rate:</span>
                        <span className='value' style={{ color: getWinRateColor(overallMetrics.overallWinRate) }}>
                            {formatPercentage(overallMetrics.overallWinRate)}
                        </span>
                    </div>
                    <div className='overall-stat'>
                        <span className='label'>Total Profit:</span>
                        <span
                            className='value'
                            style={{ color: overallMetrics.totalProfit >= 0 ? '#00a651' : '#ec3f3f' }}
                        >
                            {formatCurrency(overallMetrics.totalProfit)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Service Performance */}
            <div className='performance-section'>
                <h3>Service Performance</h3>
                <div className='service-performance-grid'>
                    {Object.entries(servicePerformance).map(([service, metrics]) => (
                        <div key={service} className='service-card'>
                            <div className='service-header'>
                                <h4>{service}</h4>
                                <span className='last-updated'>
                                    {metrics.lastUpdated
                                        ? `Updated ${Math.floor((Date.now() - metrics.lastUpdated) / 1000)}s ago`
                                        : 'No data'}
                                </span>
                            </div>

                            <div className='service-metrics'>
                                <div className='metric'>
                                    <span className='metric-label'>Signals:</span>
                                    <span className='metric-value'>{metrics.totalSignals}</span>
                                </div>
                                <div className='metric'>
                                    <span className='metric-label'>Win Rate:</span>
                                    <span className='metric-value' style={{ color: getWinRateColor(metrics.winRate) }}>
                                        {formatPercentage(metrics.winRate)}
                                    </span>
                                </div>
                                <div className='metric'>
                                    <span className='metric-label'>Profit:</span>
                                    <span
                                        className='metric-value'
                                        style={{ color: metrics.totalProfit >= 0 ? '#00a651' : '#ec3f3f' }}
                                    >
                                        {formatCurrency(metrics.totalProfit)}
                                    </span>
                                </div>
                                <div className='metric'>
                                    <span className='metric-label'>Current Streak:</span>
                                    <span
                                        className='metric-value'
                                        style={{ color: metrics.currentStreak > 0 ? '#00a651' : '#ec3f3f' }}
                                    >
                                        {metrics.currentStreak > 0 ? '+' : ''}
                                        {metrics.currentStreak}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Market Performance */}
            <div className='performance-section'>
                <h3>Market Performance</h3>
                <div className='market-performance-table'>
                    <div className='table-header'>
                        <div>Market</div>
                        <div>Trades</div>
                        <div>Win Rate</div>
                        <div>Profit</div>
                    </div>
                    {marketPerformance.map(market => (
                        <div key={market.market} className='table-row'>
                            <div className='market-name'>{market.market}</div>
                            <div>{market.totalTrades}</div>
                            <div style={{ color: getWinRateColor(market.winRate) }}>
                                {formatPercentage(market.winRate)}
                            </div>
                            <div style={{ color: market.profit >= 0 ? '#00a651' : '#ec3f3f' }}>
                                {formatCurrency(market.profit)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className='performance-section'>
                <h3>Performance Chart</h3>
                <div className='chart-placeholder'>
                    <div className='chart-info'>
                        <p>📊 Performance chart will show:</p>
                        <ul>
                            <li>Win rate trends over time</li>
                            <li>Profit/loss progression</li>
                            <li>Signal accuracy by service</li>
                            <li>Market volatility correlation</li>
                        </ul>
                        <p>
                            <em>Chart implementation can be added with libraries like Chart.js or D3.js</em>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDashboard;

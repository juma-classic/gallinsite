import React, { useEffect, useState } from 'react';

type SignalType = 'RISE' | 'FALL' | 'EVEN' | 'ODD' | 'OVER' | 'UNDER';

interface SimpleSignal {
    id: string;
    market: string;
    type: SignalType;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    timestamp: number;
    status: 'ACTIVE' | 'WON' | 'LOST';
    expiresAt: number;
}

const SignalsCenterSimpleTest: React.FC = () => {
    const [signals, setSignals] = useState<SimpleSignal[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | SignalType>('all');

    // Generate mock signals
    const generateSignals = () => {
        const markets = [
            'Volatility 10',
            'Volatility 25',
            'Volatility 50',
            'Volatility 75',
            'Volatility 100',
            'Volatility 150',
            'Volatility 250',
            'Volatility 10 (1s)',
            'Volatility 25 (1s)',
            'Volatility 50 (1s)',
            'Volatility 75 (1s)',
            'Volatility 100 (1s)',
            'Jump 10',
            'Jump 25',
            'Jump 50',
            'Jump 75',
            'Jump 100',
            'Crash 300',
            'Crash 500',
            'Crash 1000',
            'Boom 300',
            'Boom 500',
            'Boom 1000',
        ];
        const types: SignalType[] = ['RISE', 'FALL', 'EVEN', 'ODD', 'OVER', 'UNDER'];
        const confidenceLevels: ('HIGH' | 'MEDIUM' | 'LOW')[] = ['HIGH', 'MEDIUM', 'LOW'];

        const newSignals: SimpleSignal[] = [];
        for (let i = 0; i < 6; i++) {
            const now = Date.now();
            newSignals.push({
                id: `signal-${i}-${now}`,
                market: markets[Math.floor(Math.random() * markets.length)],
                type: types[Math.floor(Math.random() * types.length)],
                confidence: confidenceLevels[Math.floor(Math.random() * confidenceLevels.length)],
                timestamp: now,
                status: 'ACTIVE',
                expiresAt: now + 60000, // 1 minute from now
            });
        }

        return newSignals;
    };

    useEffect(() => {
        setSignals(generateSignals());
    }, []);

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

    const filteredSignals = activeFilter === 'all' ? signals : signals.filter(signal => signal.type === activeFilter);

    return (
        <div
            style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '20px',
                color: '#2d3748',
                minHeight: '500px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #319795',
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: '0 0 4px 0',
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#319795',
                        }}
                    >
                        ⚡ Quick Signals
                    </h2>
                    <span style={{ fontSize: '14px', color: '#718096' }}>Fast Trading Opportunities</span>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div
                        style={{
                            textAlign: 'center',
                            background: '#319795',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            color: 'white',
                        }}
                    >
                        <div style={{ fontSize: '12px', opacity: '0.9' }}>ACTIVE</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>
                            {signals.filter(s => s.status === 'ACTIVE').length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div
                style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                }}
            >
                {['all', 'RISE', 'FALL', 'EVEN', 'ODD', 'OVER', 'UNDER'].map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter as 'all' | SignalType)}
                        style={{
                            padding: '6px 12px',
                            border: activeFilter === filter ? '2px solid #319795' : '1px solid #e2e8f0',
                            borderRadius: '6px',
                            background: activeFilter === filter ? '#319795' : '#ffffff',
                            color: activeFilter === filter ? 'white' : '#4a5568',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textTransform: 'uppercase',
                        }}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Signals List */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '12px',
                }}
            >
                {filteredSignals.map(signal => (
                    <div
                        key={signal.id}
                        style={{
                            background: '#ffffff',
                            borderRadius: '8px',
                            padding: '16px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {/* Signal Header */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '12px',
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '14px', color: '#2d3748' }}>
                                    {signal.market}
                                </div>
                                <div style={{ fontSize: '11px', color: '#718096' }}>
                                    {new Date(signal.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                            <div
                                style={{
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    background:
                                        signal.status === 'ACTIVE'
                                            ? '#319795'
                                            : signal.status === 'WON'
                                              ? '#38a169'
                                              : '#e53e3e',
                                    color: 'white',
                                }}
                            >
                                {signal.status}
                            </div>
                        </div>

                        {/* Signal Type */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '12px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '16px' }}>
                                    {signal.type === 'RISE' && '↗️'}
                                    {signal.type === 'FALL' && '↘️'}
                                    {signal.type === 'EVEN' && '2️⃣'}
                                    {signal.type === 'ODD' && '1️⃣'}
                                    {signal.type === 'OVER' && '⬆️'}
                                    {signal.type === 'UNDER' && '⬇️'}
                                </span>
                                <span
                                    style={{
                                        fontWeight: '700',
                                        fontSize: '16px',
                                        color: ['RISE', 'OVER'].includes(signal.type) ? '#319795' : '#fd7f28',
                                    }}
                                >
                                    {signal.type}
                                </span>
                            </div>
                            <div
                                style={{
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    background:
                                        signal.confidence === 'HIGH'
                                            ? '#319795'
                                            : signal.confidence === 'MEDIUM'
                                              ? '#fd7f28'
                                              : '#e53e3e',
                                    color: 'white',
                                }}
                            >
                                {signal.confidence}
                            </div>
                        </div>

                        {/* Timer and Action */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            {signal.status === 'ACTIVE' ? (
                                <>
                                    <div style={{ fontSize: '12px', color: '#718096' }}>
                                        Expires:{' '}
                                        <span style={{ color: '#fd7f28', fontWeight: '700' }}>
                                            {getTimeRemaining(signal.expiresAt)}
                                        </span>
                                    </div>
                                    <button
                                        style={{
                                            padding: '6px 12px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            background: '#319795',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        Trade
                                    </button>
                                </>
                            ) : (
                                <div
                                    style={{
                                        width: '100%',
                                        textAlign: 'center',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        background: signal.status === 'WON' ? '#38a169' : '#e53e3e',
                                        color: 'white',
                                    }}
                                >
                                    {signal.status === 'WON' ? '✅ Won' : '❌ Lost'}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredSignals.length === 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: '#718096',
                    }}
                >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                    <div>No signals available for {activeFilter}</div>
                </div>
            )}

            {/* Refresh Button */}
            <div
                style={{
                    textAlign: 'center',
                    marginTop: '20px',
                }}
            >
                <button
                    onClick={() => setSignals(generateSignals())}
                    style={{
                        padding: '10px 20px',
                        border: '2px solid #319795',
                        borderRadius: '8px',
                        background: '#ffffff',
                        color: '#319795',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                    }}
                >
                    🔄 Refresh Signals
                </button>
            </div>
        </div>
    );
};

export default SignalsCenterSimpleTest;

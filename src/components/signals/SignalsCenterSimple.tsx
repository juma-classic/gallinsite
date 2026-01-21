import React from 'react';

const SignalsCenterSimple: React.FC = () => {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Signals Center</h2>
            <p>Signals system is being loaded...</p>
            <div style={{ marginTop: '2rem' }}>
                <div
                    style={{
                        background: 'var(--general-section-1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        margin: '1rem 0',
                    }}
                >
                    <h3>Real-time Trading Signals</h3>
                    <p>AI-powered signals will appear here once the system is fully loaded.</p>
                </div>

                <div
                    style={{
                        background: 'var(--general-section-1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        margin: '1rem 0',
                    }}
                >
                    <h3>Performance Analytics</h3>
                    <p>Trading performance and statistics will be displayed here.</p>
                </div>

                <div
                    style={{
                        background: 'var(--general-section-1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        margin: '1rem 0',
                    }}
                >
                    <h3>Signal Configuration</h3>
                    <p>Settings and filters for signal generation will be available here.</p>
                </div>
            </div>
        </div>
    );
};

export default SignalsCenterSimple;

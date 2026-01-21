import React from 'react';
import {
    ChartIcon,
    FireIcon,
    LightningIcon,
    MobileIcon,
    PaletteIcon,
    RobotIcon,
    RocketIcon,
    SettingsIcon,
    SparkleIcon,
    TargetIcon,
    TrendUpIcon,
} from './icons/SignalIcons';

const SignalsCenterSimple: React.FC = () => {
    return (
        <div
            style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
                color: 'white',
                height: '100%',
                overflow: 'auto',
            }}
        >
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1
                    style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        margin: '0 0 0.5rem 0',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <LightningIcon size={40} color='#fbbf24' />
                    Super Signals
                    <LightningIcon size={40} color='#fbbf24' />
                </h1>
                <p
                    style={{
                        fontSize: '1.2rem',
                        opacity: 0.9,
                        margin: 0,
                    }}
                >
                    Advanced AI-Powered Trading Intelligence
                </p>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem',
                }}
            >
                <div
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <RobotIcon size={32} color='#60a5fa' style={{ marginRight: '0.5rem' }} />
                        <h3 style={{ margin: 0, fontSize: '1.3rem' }}>AI Signal Intelligence</h3>
                    </div>
                    <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
                        Neural network-powered signal generation with multi-timeframe analysis, market sentiment
                        detection, and adaptive learning algorithms.
                    </p>
                </div>

                <div
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <ChartIcon size={32} color='#34d399' style={{ marginRight: '0.5rem' }} />
                        <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Performance Analytics</h3>
                    </div>
                    <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
                        Real-time performance tracking, win rate analysis, profit/loss statistics, and comprehensive
                        trading insights with exportable reports.
                    </p>
                </div>

                <div
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <TargetIcon size={32} color='#f472b6' style={{ marginRight: '0.5rem' }} />
                        <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Pattern Recognition</h3>
                    </div>
                    <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
                        Advanced pattern detection using Patel signals, hot/cold zone analysis, and entry point
                        optimization for maximum accuracy.
                    </p>
                </div>
            </div>

            <div
                style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '2rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    textAlign: 'center',
                }}
            >
                <h2
                    style={{
                        margin: '0 0 1rem 0',
                        fontSize: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                    }}
                >
                    <RocketIcon size={24} color='#fbbf24' />
                    Coming Soon
                </h2>
                <p style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', opacity: 0.9 }}>
                    The full Super Signals system is being prepared with all advanced features including:
                </p>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginTop: '1.5rem',
                    }}
                >
                    <div style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <SparkleIcon size={16} color='#fbbf24' />
                        Real-time Signal Generation
                    </div>
                    <div style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FireIcon size={16} color='#ef4444' />
                        Hot/Cold Zone Detection
                    </div>
                    <div style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendUpIcon size={16} color='#10b981' />
                        Multi-Market Analysis
                    </div>
                    <div style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <SettingsIcon size={16} color='#8b5cf6' />
                        Auto-Trading Integration
                    </div>
                    <div style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MobileIcon size={16} color='#06b6d4' />
                        Mobile Optimization
                    </div>
                    <div style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PaletteIcon size={16} color='#f59e0b' />
                        Advanced Visualizations
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignalsCenterSimple;

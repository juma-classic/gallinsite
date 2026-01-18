import React, { useEffect, useState } from 'react';

export type LandingWithIntroProps = {
    onFinish: () => void;
};

const IntroLoader: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Animate progress bar
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    setTimeout(() => onFinish(), 500); // Small delay before finishing
                    return 100;
                }
                return prev + 2; // Increment by 2% every 60ms for smooth animation
            });
        }, 60);

        return () => {
            clearInterval(progressInterval);
        };
    }, [onFinish]);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'linear-gradient(135deg, #0a1628 0%, #1a2332 50%, #0f1419 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                fontFamily: 'Inter, system-ui, sans-serif',
            }}
        >
            <div
                style={{
                    textAlign: 'center',
                    animation: 'fadeInUp 1s ease-out',
                }}
            >
                <div
                    style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(0, 255, 136, 0.2)',
                        borderRadius: '16px',
                        padding: '3rem 2.5rem',
                        backdropFilter: 'blur(10px)',
                        boxShadow: `
                            0 8px 32px rgba(0, 0, 0, 0.3),
                            0 0 0 1px rgba(0, 255, 136, 0.1),
                            0 0 20px rgba(0, 255, 136, ${0.1 + (progress / 1000)})
                        `,
                        minWidth: '320px',
                        transition: 'box-shadow 0.3s ease',
                    }}
                >
                    {/* Header */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h1
                            style={{
                                fontFamily: 'Orbitron, monospace',
                                fontSize: '2.2rem',
                                fontWeight: 700,
                                color: '#e8f4fd',
                                margin: '0 0 0.5rem 0',
                                letterSpacing: '2px',
                                textShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
                            }}
                        >
                            GTRADE<span
                                style={{
                                    color: '#00ff88',
                                    textShadow: '0 0 20px rgba(0, 255, 136, 0.6)',
                                    animation: 'textGlow 2s ease-in-out infinite alternate',
                                }}
                            >RS</span> HUB
                        </h1>
                        <p
                            style={{
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '0.9rem',
                                color: '#b8d4f0',
                                margin: 0,
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                opacity: 0.8,
                            }}
                        >
                            Smart Trading Solutions
                        </p>
                    </div>

                    {/* Chart Icon */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                            gap: '8px',
                            margin: '2rem 0',
                            height: '60px',
                        }}
                    >
                        {[30, 45, 35].map((height, index) => (
                            <div
                                key={index}
                                style={{
                                    width: '12px',
                                    height: `${height}px`,
                                    background: 'linear-gradient(to top, #00ff88, #00cc6a)',
                                    borderRadius: '6px 6px 0 0',
                                    boxShadow: '0 0 10px rgba(0, 255, 136, 0.4)',
                                    animation: `barPulse 1.5s ease-in-out infinite ${index * 0.2}s`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginTop: '2rem' }}>
                        <div
                            style={{
                                width: '100%',
                                height: '4px',
                                background: 'rgba(184, 212, 240, 0.2)',
                                borderRadius: '2px',
                                overflow: 'hidden',
                                marginBottom: '1rem',
                            }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    width: `${progress}%`,
                                    background: 'linear-gradient(90deg, #00ff88, #00cc6a, #00ff88)',
                                    backgroundSize: '200% 100%',
                                    borderRadius: '2px',
                                    animation: 'progressShimmer 2s linear infinite',
                                    transition: 'width 0.3s ease',
                                }}
                            />
                        </div>
                        <p
                            style={{
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '0.85rem',
                                color: '#b8d4f0',
                                margin: 0,
                                opacity: 0.9,
                                animation: 'textFade 2s ease-in-out infinite alternate',
                            }}
                        >
                            Loading Neural Network Models ... {Math.round(progress)}%
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes textGlow {
                    from {
                        text-shadow: 0 0 20px rgba(0, 255, 136, 0.6);
                    }
                    to {
                        text-shadow: 0 0 30px rgba(0, 255, 136, 0.9);
                    }
                }

                @keyframes barPulse {
                    0%, 100% {
                        transform: scaleY(1);
                        opacity: 0.8;
                    }
                    50% {
                        transform: scaleY(1.3);
                        opacity: 1;
                    }
                }

                @keyframes progressShimmer {
                    0% {
                        background-position: -200% 0;
                    }
                    100% {
                        background-position: 200% 0;
                    }
                }

                @keyframes textFade {
                    from {
                        opacity: 0.7;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @media (max-width: 480px) {
                    h1 {
                        font-size: 1.8rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

const LandingWithIntro: React.FC<LandingWithIntroProps> = ({ onFinish }) => {
    const [showLoader, setShowLoader] = useState(true);

    useEffect(() => {
        if (!showLoader) {
            onFinish();
        }
    }, [showLoader, onFinish]);

    return showLoader ? <IntroLoader onFinish={() => setShowLoader(false)} /> : null;
};

export default LandingWithIntro;

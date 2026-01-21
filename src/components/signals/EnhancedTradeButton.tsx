import React, { useEffect,useState } from 'react';
import { signalExecution } from '@/services/signal-execution.service';
import { stakeManager } from '@/services/stake-manager.service';
import { SignalsCenterSignal } from '@/types/signals';
import './EnhancedTradeButton.scss';

interface EnhancedTradeButtonProps {
    signal: SignalsCenterSignal;
    onTradeExecuted?: (contractId: string) => void;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
    variant?: 'primary' | 'secondary' | 'success' | 'warning';
}

const EnhancedTradeButton: React.FC<EnhancedTradeButtonProps> = ({
    signal,
    onTradeExecuted,
    disabled = false,
    size = 'medium',
    variant = 'primary',
}) => {
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<'success' | 'error' | null>(null);
    const [stake, setStake] = useState(0);
    const [countdown, setCountdown] = useState(0);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Calculate stake and countdown
    useEffect(() => {
        const performance = { winRate: 0.6, totalTrades: 10 }; // Mock performance
        const calculatedStake = stakeManager.calculateStake(signal, performance);
        setStake(calculatedStake);

        // Calculate countdown if signal has expiry
        if (signal.expiresAt) {
            const updateCountdown = () => {
                const remaining = Math.max(0, signal.expiresAt! - Date.now());
                setCountdown(Math.floor(remaining / 1000));
            };

            updateCountdown();
            const interval = setInterval(updateCountdown, 1000);

            return () => clearInterval(interval);
        }
    }, [signal]);

    const handleTradeClick = () => {
        if (signal.confidence === 'LOW' || stake > 10) {
            setShowConfirmation(true);
        } else {
            executeTrade();
        }
    };

    const executeTrade = async () => {
        setIsExecuting(true);
        setExecutionResult(null);
        setShowConfirmation(false);

        try {
            const result = await signalExecution.executeSignalManually(signal);

            if (result.success) {
                setExecutionResult('success');
                onTradeExecuted?.(result.contractId!);

                // Auto-hide success state after 3 seconds
                setTimeout(() => {
                    setExecutionResult(null);
                }, 3000);
            } else {
                setExecutionResult('error');
                console.error('Trade execution failed:', result.error);

                // Auto-hide error state after 5 seconds
                setTimeout(() => {
                    setExecutionResult(null);
                }, 5000);
            }
        } catch (error) {
            setExecutionResult('error');
            console.error('Trade execution error:', error);

            setTimeout(() => {
                setExecutionResult(null);
            }, 5000);
        } finally {
            setIsExecuting(false);
        }
    };

    const getButtonText = () => {
        if (isExecuting) return 'Executing...';
        if (executionResult === 'success') return 'Trade Placed!';
        if (executionResult === 'error') return 'Failed - Retry';
        return `Trade ${signal.type}`;
    };

    const getButtonClass = () => {
        let className = `enhanced-trade-button ${size} ${variant}`;

        if (disabled || countdown === 0) className += ' disabled';
        if (isExecuting) className += ' executing';
        if (executionResult === 'success') className += ' success';
        if (executionResult === 'error') className += ' error';

        return className;
    };

    const getConfidenceColor = () => {
        switch (signal.confidence) {
            case 'HIGH':
                return '#00a651';
            case 'MEDIUM':
                return '#ff6444';
            case 'LOW':
                return '#ec3f3f';
            case 'CONSERVATIVE':
                return '#0066cc';
            case 'AGGRESSIVE':
                return '#ff3366';
            default:
                return '#999';
        }
    };

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (showConfirmation) {
        return (
            <div className='trade-confirmation'>
                <div className='confirmation-content'>
                    <h4>Confirm Trade</h4>
                    <div className='trade-details'>
                        <p>
                            <strong>Signal:</strong> {signal.type} on {signal.marketDisplay}
                        </p>
                        <p>
                            <strong>Confidence:</strong>{' '}
                            <span style={{ color: getConfidenceColor() }}>{signal.confidence}</span>
                        </p>
                        <p>
                            <strong>Stake:</strong> ${stake.toFixed(2)}
                        </p>
                        <p>
                            <strong>Strategy:</strong> {signal.strategy}
                        </p>
                        {signal.reason && (
                            <p>
                                <strong>Reason:</strong> {signal.reason}
                            </p>
                        )}
                    </div>
                    <div className='confirmation-actions'>
                        <button className='confirm-button' onClick={executeTrade} disabled={isExecuting}>
                            {isExecuting ? 'Executing...' : 'Confirm Trade'}
                        </button>
                        <button
                            className='cancel-button'
                            onClick={() => setShowConfirmation(false)}
                            disabled={isExecuting}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='enhanced-trade-button-container'>
            <button
                className={getButtonClass()}
                onClick={handleTradeClick}
                disabled={disabled || countdown === 0 || isExecuting}
            >
                <div className='button-content'>
                    <div className='button-text'>{getButtonText()}</div>

                    {!isExecuting && executionResult !== 'success' && (
                        <div className='button-details'>
                            <span className='stake-amount'>${stake.toFixed(2)}</span>
                            <span className='confidence-badge' style={{ backgroundColor: getConfidenceColor() }}>
                                {signal.confidence}
                            </span>
                        </div>
                    )}
                </div>

                {isExecuting && (
                    <div className='loading-spinner'>
                        <div className='spinner'></div>
                    </div>
                )}

                {executionResult === 'success' && <div className='success-icon'>✓</div>}

                {executionResult === 'error' && <div className='error-icon'>✗</div>}
            </button>

            {countdown > 0 && (
                <div className='countdown-timer'>
                    <span className='countdown-label'>Expires in:</span>
                    <span className='countdown-value'>{formatCountdown(countdown)}</span>
                </div>
            )}

            {countdown === 0 && signal.expiresAt && <div className='expired-notice'>Signal Expired</div>}

            <div className='signal-metadata'>
                <div className='metadata-item'>
                    <span className='label'>Source:</span>
                    <span className='value'>{signal.source}</span>
                </div>
                <div className='metadata-item'>
                    <span className='label'>Strategy:</span>
                    <span className='value'>{signal.strategy}</span>
                </div>
                {signal.entryDigit !== undefined && (
                    <div className='metadata-item'>
                        <span className='label'>Entry Digit:</span>
                        <span className='value'>{signal.entryDigit}</span>
                    </div>
                )}
            </div>

            {signal.aiData && (
                <div className='ai-enhancement-info'>
                    <div className='ai-score'>
                        <span className='label'>AI Score:</span>
                        <span className='value'>{(signal.aiData.neuralScore * 100).toFixed(1)}%</span>
                    </div>
                    <div className='market-sentiment'>
                        <span className='label'>Sentiment:</span>
                        <span className={`value sentiment-${signal.aiData.marketSentiment.toLowerCase()}`}>
                            {signal.aiData.marketSentiment}
                        </span>
                    </div>
                    <div className='risk-level'>
                        <span className='label'>Risk:</span>
                        <span className={`value risk-${signal.aiData.riskLevel.toLowerCase()}`}>
                            {signal.aiData.riskLevel}
                        </span>
                    </div>
                </div>
            )}

            {signal.targetDigitsAnalysis && (
                <div className='target-analysis'>
                    <div className='hot-digits'>
                        <span className='label'>Hot Digits:</span>
                        <span className='digits'>{signal.targetDigitsAnalysis.hotDigits.join(', ')}</span>
                    </div>
                    <div className='cold-digits'>
                        <span className='label'>Cold Digits:</span>
                        <span className='digits'>{signal.targetDigitsAnalysis.coldDigits.join(', ')}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedTradeButton;

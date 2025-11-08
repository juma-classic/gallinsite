import React, { useState, useEffect } from 'react';
import './speed-bot.scss';

interface SpeedBotProps {
    onExecute?: (params: any) => void;
}

interface TradePosition {
    id: number;
    symbol: string;
    type: string;
    entrySpot: number;
    exitSpot?: number;
    buyPrice: number;
    profit?: number;
    isCompleted: boolean;
    timestamp: number;
}

interface TradeUpdate {
    trade_update: {
        result: 'win' | 'loss';
        profit: number;
        symbol: string;
        entry_spot: number;
        exit_spot: number;
        stake: number;
    };
}

// Map market names to symbols
const marketSymbolMap: Record<string, string> = {
    R10: 'R_10',
    R25: 'R_25',
    R50: 'R_50',
    R75: 'R_75',
    R100: 'R_100',
};

declare global {
    interface Window {
        startSpeedBotTrading: (params: any) => void;
        stopSpeedBotTrading: () => void;
    }
}

export const SpeedBot: React.FC<SpeedBotProps> = ({ onExecute }) => {
    const [market, setMarket] = useState<string>('R50');
    const [stake, setStake] = useState<number>(10);
    const [martingale, setMartingale] = useState<string>('1.25');
    const [strategy, setStrategy] = useState<string>('Over');
    const [prediction, setPrediction] = useState<string>('2');
    const [ticks, setTicks] = useState<string>('1');
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [totalPL, setTotalPL] = useState<number>(0);
    const [runs, setRuns] = useState<number>(0);
    const [wins, setWins] = useState<number>(0);
    const [losses, setLosses] = useState<number>(0);
    const [positions, setPositions] = useState<TradePosition[]>([]);
    const [currentStake, setCurrentStake] = useState<number>(10);

    // Listen for trade updates from the SpeedBot API
    useEffect(() => {
        const handleTradeUpdate = (event: MessageEvent) => {
            try {
                if (typeof event.data === 'string') {
                    const data = JSON.parse(event.data);

                    if (data.trade_update) {
                        const update = data.trade_update;

                        // Create a new position
                        const newPosition: TradePosition = {
                            id: Date.now(),
                            symbol: update.symbol,
                            type: update.result === 'win' ? 'CALL' : 'PUT',
                            entrySpot: update.entry_spot,
                            exitSpot: update.exit_spot,
                            buyPrice: update.stake,
                            profit: update.result === 'win' ? update.profit : -update.stake,
                            isCompleted: true,
                            timestamp: Date.now(),
                        };

                        // Update positions
                        setPositions(prev => [newPosition, ...prev].slice(0, 50));

                        // Update stats
                        if (update.result === 'win') {
                            setWins(prev => prev + 1);
                            setTotalPL(prev => prev + update.profit);
                            setCurrentStake(stake); // Reset stake on win
                        } else {
                            setLosses(prev => prev + 1);
                            setTotalPL(prev => prev - update.stake);
                            setCurrentStake(prev => prev * parseFloat(martingale)); // Apply martingale
                        }

                        setRuns(prev => prev + 1);
                    }
                }
            } catch (error) {
                console.error('Error processing trade update:', error);
            }
        };

        window.addEventListener('message', handleTradeUpdate);

        return () => {
            window.removeEventListener('message', handleTradeUpdate);
        };
    }, [stake, martingale]);

    const handleMarketChange = (value: string) => {
        setMarket(value);
    };

    const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStake = Number(e.target.value);
        setStake(newStake);
        setCurrentStake(newStake);
    };

    const handleMartingaleChange = (value: string) => {
        setMartingale(value);
    };

    const handleStrategyChange = (value: string) => {
        setStrategy(value);
    };

    const handlePredictionChange = (value: string) => {
        setPrediction(value);
    };

    const handleTicksChange = (value: string) => {
        setTicks(value);
    };

    const toggleRun = () => {
        const newRunningState = !isRunning;
        setIsRunning(newRunningState);

        const symbol = marketSymbolMap[market] || 'R_50';
        const martingaleFactor = parseFloat(martingale);
        const tradeParams = {
            market: symbol,
            stake,
            martingale: martingaleFactor,
            strategy,
            prediction,
            ticks,
        };

        if (newRunningState) {
            // Initialize with current stake
            setCurrentStake(stake);

            // Start trading using SpeedBot API
            if (window.startSpeedBotTrading) {
                window.startSpeedBotTrading(tradeParams);
                console.log(`Started SpeedBot trading with params:`, tradeParams);
            } else {
                console.error('SpeedBot API not loaded');
            }
        } else {
            // Stop trading
            if (window.stopSpeedBotTrading) {
                window.stopSpeedBotTrading();
                console.log('Stopped SpeedBot trading');
            } else {
                console.error('SpeedBot API not loaded');
            }
        }

        if (onExecute) {
            onExecute({
                ...tradeParams,
                isRunning: newRunningState,
            });
        }
    };

    const handleReset = () => {
        if (isRunning) {
            toggleRun(); // Stop trading first
        }

        // Reset all stats
        setTotalPL(0);
        setRuns(0);
        setWins(0);
        setLosses(0);
        setPositions([]);
        setCurrentStake(stake);
    };

    // Function to render market selection dropdown
    const renderMarketDropdown = () => {
        const markets = ['R10', 'R25', 'R50', 'R75', 'R100'];
        return (
            <div className='dropdown-menu'>
                {markets.map(m => (
                    <div key={m} className='dropdown-item' onClick={() => handleMarketChange(m)}>
                        {m}
                    </div>
                ))}
            </div>
        );
    };

    // Function to render martingale selection dropdown
    const renderMartingaleDropdown = () => {
        const martingaleOptions = ['1.0', '1.25', '1.5', '2.0', '3.0'];
        return (
            <div className='dropdown-menu'>
                {martingaleOptions.map(m => (
                    <div key={m} className='dropdown-item' onClick={() => handleMartingaleChange(m)}>
                        {m}
                    </div>
                ))}
            </div>
        );
    };

    // Function to render strategy selection dropdown
    const renderStrategyDropdown = () => {
        const strategies = ['Over', 'Under', 'Even', 'Odd'];
        return (
            <div className='dropdown-menu'>
                {strategies.map(s => (
                    <div key={s} className='dropdown-item' onClick={() => handleStrategyChange(s)}>
                        {s}
                    </div>
                ))}
            </div>
        );
    };

    // Function to render prediction selection dropdown
    const renderPredictionDropdown = () => {
        const predictions = ['1', '2', '3', '4', '5'];
        return (
            <div className='dropdown-menu'>
                {predictions.map(p => (
                    <div key={p} className='dropdown-item' onClick={() => handlePredictionChange(p)}>
                        {p}
                    </div>
                ))}
            </div>
        );
    };

    // Function to render ticks selection dropdown
    const renderTicksDropdown = () => {
        const tickOptions = ['1', '2', '3', '5', '10'];
        return (
            <div className='dropdown-menu'>
                {tickOptions.map(t => (
                    <div key={t} className='dropdown-item' onClick={() => handleTicksChange(t)}>
                        {t}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className='speed-bot-container'>
            <div className='speed-bot-header'>
                <div className='speed-bot-title'>
                    <h3>Speed Bot V1 | Buys Every Tick ▲</h3>
                </div>
            </div>

            <div className='speed-bot-main'>
                <div className='speed-bot-controls'>
                    <div className='control-section'>
                        <label>Market</label>
                        <div className='control-button-container dropdown'>
                            <button className='control-button'>{market}</button>
                            {renderMarketDropdown()}
                        </div>
                    </div>

                    <div className='control-section'>
                        <label>Stake</label>
                        <div className='control-input-container'>
                            <input type='text' value={stake} onChange={handleStakeChange} className='control-input' />
                        </div>
                    </div>

                    <div className='control-section'>
                        <label>Martingale</label>
                        <div className='control-button-container dropdown'>
                            <button className='control-button'>{martingale}</button>
                            {renderMartingaleDropdown()}
                        </div>
                    </div>

                    <div className='control-section'>
                        <label>Strategy</label>
                        <div className='control-button-container dropdown'>
                            <button className='control-button'>{strategy}</button>
                            {renderStrategyDropdown()}
                        </div>
                    </div>

                    <div className='control-section'>
                        <label>Prediction</label>
                        <div className='control-button-container dropdown'>
                            <button className='control-button'>{prediction}</button>
                            {renderPredictionDropdown()}
                        </div>
                    </div>

                    <div className='control-section'>
                        <label>Ticks</label>
                        <div className='control-button-container dropdown'>
                            <button className='control-button'>{ticks}</button>
                            {renderTicksDropdown()}
                        </div>
                    </div>

                    <div className='control-section'>
                        <label>Run</label>
                        <div className='control-button-container'>
                            <button className={`run-button ${isRunning ? 'running' : ''}`} onClick={toggleRun}>
                                {isRunning ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className='trade-info'>
                    <div className='trade-info-left'>
                        <span>Type/Market</span>
                        {positions.length === 0 && <span className='no-positions'>No positions</span>}
                    </div>
                    <div className='trade-info-right'>
                        <span>Entry/Exit spot</span>
                        <span>Buy price & P/L</span>
                    </div>
                </div>

                <div className='trade-display-area'>
                    {positions.map(position => (
                        <div key={position.id} className='position-item'>
                            <div className='position-left'>
                                <div className='position-type'>{position.type}</div>
                                <div className='position-market'>{position.symbol}</div>
                            </div>
                            <div className='position-middle'>
                                <div className='position-entry'>{position.entrySpot.toFixed(2)}</div>
                                <div className='position-exit'>
                                    {position.exitSpot ? position.exitSpot.toFixed(2) : '-'}
                                </div>
                            </div>
                            <div className='position-right'>
                                <div className='position-buy'>${position.buyPrice.toFixed(2)}</div>
                                <div
                                    className={`position-pl ${position.profit && position.profit >= 0 ? 'positive' : 'negative'}`}
                                >
                                    {position.profit
                                        ? (position.profit >= 0 ? '+' : '') + position.profit.toFixed(2)
                                        : '-'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className='reset-container'>
                    <button className='reset-button' onClick={handleReset}>
                        Reset
                    </button>
                </div>
            </div>

            <div className='speed-bot-footer'>
                <div className='stats-info'>
                    <span>
                        Losses: {losses} Next stake: ${currentStake.toFixed(2)} Session P/L: {totalPL >= 0 ? '+' : ''}
                        {totalPL.toFixed(2)}
                    </span>
                </div>
                <div className='stats-container'>
                    <div className='stat-item'>
                        <span>TOTAL P/L</span>
                        <span className={`stat-value ${totalPL >= 0 ? 'positive' : 'negative'}`}>
                            {totalPL >= 0 ? '+' : ''}
                            {totalPL.toFixed(2)} USD
                        </span>
                    </div>
                    <div className='stat-item'>
                        <span>NO. OF RUNS</span>
                        <span className='stat-value'>{runs}</span>
                    </div>
                    <div className='stat-item'>
                        <span>WON</span>
                        <span className='stat-value'>{wins}</span>
                    </div>
                    <div className='stat-item'>
                        <span>LOST</span>
                        <span className='stat-value'>{losses}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpeedBot;

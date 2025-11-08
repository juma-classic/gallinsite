// SpeedBot API for live trading
const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=82255');

// Store ticks for different symbols
const ticksStorage = {
    R_10: [],
    R_25: [],
    R_50: [],
    R_75: [],
    R_100: [],
};

// Trading state
let isTrading = false;
let currentStake = 10;
let martingaleFactor = 1.25;
let currentStrategy = 'Over';
let currentPrediction = 2;
let currentTicks = 1;
let currentSymbol = 'R_50';

// Subscribe to ticks for a symbol
const subscribeTicks = symbol => {
    ws.send(
        JSON.stringify({
            ticks_history: symbol,
            count: 255,
            end: 'latest',
            style: 'ticks',
            subscribe: 1,
        })
    );
};

// Initialize WebSocket connection
ws.onopen = () => {
    console.log('SpeedBot API connected to Deriv WebSocket');
    ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'].forEach(subscribeTicks);
};

// Process incoming ticks
ws.onmessage = event => {
    const data = JSON.parse(event.data);

    if (data.history && data.history.prices) {
        const symbol = data.echo_req.ticks_history;
        ticksStorage[symbol] = data.history.prices.map(price => parseFloat(price));
    } else if (data.tick) {
        const symbol = data.tick.symbol;
        const price = parseFloat(data.tick.quote);

        ticksStorage[symbol].push(price);
        if (ticksStorage[symbol].length > 255) ticksStorage[symbol].shift();

        // Execute trade if trading is active and symbol matches
        if (isTrading && symbol === currentSymbol) {
            processTick(symbol, price);
        }
    }
};

// Process a new tick for trading
const processTick = (symbol, price) => {
    // Get previous tick for comparison
    const ticks = ticksStorage[symbol];
    if (ticks.length < 2) return;

    const previousPrice = ticks[ticks.length - 2];

    // Determine if the prediction was correct based on strategy
    let isWin = false;

    switch (currentStrategy) {
        case 'Over':
            isWin = price > previousPrice + currentPrediction / 100;
            break;
        case 'Under':
            isWin = price < previousPrice - currentPrediction / 100;
            break;
        case 'Even':
            isWin = price % 2 === 0;
            break;
        case 'Odd':
            isWin = price % 2 !== 0;
            break;
        default:
            isWin = Math.random() > 0.5; // Fallback
    }

    // Calculate profit (simplified)
    const profit = isWin ? currentStake * 0.95 : 0;

    // Create trade update event
    const tradeUpdate = {
        trade_update: {
            result: isWin ? 'win' : 'loss',
            profit: profit,
            symbol: symbol,
            entry_spot: previousPrice,
            exit_spot: price,
            stake: currentStake,
        },
    };

    // Dispatch event to notify SpeedBot component
    window.postMessage(JSON.stringify(tradeUpdate), '*');

    // Apply martingale strategy
    if (!isWin) {
        currentStake *= martingaleFactor;
    } else {
        currentStake = 10; // Reset stake on win
    }
};

// Start trading with given parameters
window.startSpeedBotTrading = params => {
    const { stake, martingale, strategy, prediction, ticks, market } = params;

    // Update trading parameters
    currentStake = parseFloat(stake) || 10;
    martingaleFactor = parseFloat(martingale) || 1.25;
    currentStrategy = strategy || 'Over';
    currentPrediction = parseFloat(prediction) || 2;
    currentTicks = parseInt(ticks) || 1;
    currentSymbol = market || 'R_50';

    // Start trading
    isTrading = true;
    console.log(`SpeedBot trading started with: ${JSON.stringify(params)}`);
};

// Stop trading
window.stopSpeedBotTrading = () => {
    isTrading = false;
    console.log('SpeedBot trading stopped');
};

console.log('SpeedBot API loaded');

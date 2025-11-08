import { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthWrapper } from './app/AuthWrapper';
import LandingWithIntro from './components/LandingWithIntro';
import { AnalyticsInitializer } from './utils/analytics';
import './styles/index.scss';

// Load SpeedBot API script
const loadSpeedBotAPI = () => {
    const script = document.createElement('script');
    script.src = '/components/speed-bot/speedbot-api.js';
    script.async = true;
    document.body.appendChild(script);
    console.log('SpeedBot API script loaded');
};

// Load the SpeedBot API when the app starts
window.addEventListener('DOMContentLoaded', loadSpeedBotAPI);

AnalyticsInitializer();

function AppWrapper() {
    const [hasFinishedIntro, setHasFinishedIntro] = useState(false);

    return hasFinishedIntro ? <AuthWrapper /> : <LandingWithIntro onFinish={() => setHasFinishedIntro(true)} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<AppWrapper />);

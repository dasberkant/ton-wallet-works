import { App } from './App.js';
import { initializeWalletConnector } from './components/WalletConnector/WalletConnector.js';
// We might create a dedicated telegramService.js later for this

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();

        // Configure Telegram Main Button (optional but good for Mini Apps)
        if (tg.MainButton) {
            // Make sure the main button is visible and set its properties
            tg.MainButton.setText('Close App');
            tg.MainButton.textColor = '#FFFFFF';
            tg.MainButton.color = '#FF0000'; // Red color for close
            tg.MainButton.show();
            tg.MainButton.onClick(() => {
                tg.close(); // Close the Mini App
            });
        }
    } else {
        console.warn('Telegram WebApp SDK not found. Running in browser mode?');
    }

    // Initialize the main application logic
    // Pass the root element where the app can mount or find its components
    // For now, document.body or a specific app container can be used.
    const appRootElement = document.getElementById('app'); // Assuming you have <div id="app"> in your HTML
    if (appRootElement) {
        App(appRootElement);
    } else {
        console.error('Root element with id "app" not found. App cannot initialize.');
        // Fallback to body if #app is not found, for basic functionality.
        // App(document.body);
    }

    // Initialize Wallet Connector
    // The actual spendAreaCallback will be connected via the App/MoonMap later
    const { handleSpendAction } = initializeWalletConnector('tonconnect-button-root', (areaId, buyerAddress) => {
        console.log(`Placeholder: Area ${areaId} purchase by ${buyerAddress} confirmed by WalletConnector.`);
        // This callback would eventually trigger updates in MoonMap or other game state logic
        // For example, by calling a function exposed by the MoonMap component or a central state manager.
    });

    // Make handleSpendAction globally accessible for now (for debugging, or if MoonMap calls it directly)
    // Ideally, this would be passed down through components.
    window.tonkeyGameHandleSpendAction = handleSpendAction;
    console.log('Tonkey Game initialized. Wallet Connector and App started.');
}); 
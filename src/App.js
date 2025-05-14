// Main Application Component
// Placeholder - we will build this out to include MoonMap and WalletConnector

// Example of how it might look later (conceptual):
/*
import { initializeWalletConnector } from './components/WalletConnector/WalletConnector.js';
import { initializeMoonMap } from './components/MoonMap/MoonMap.js';
import { loadAreas } from './game_logic/areaService.js';

export async function App(rootElement) {
    console.log('App initializing...');

    // Setup Wallet Connector
    // The spendAreaCallback will be passed from MoonMap to WalletConnector
    // to trigger transactions when an area is clicked for purchase.
    let spendAreaHandler = null;
    const walletConnector = initializeWalletConnector('tonconnect-button-root', 
        (areaId, buyerAddress) => {
            console.log(`Area ${areaId} purchased by ${buyerAddress} - update map!`)
            // This is where MoonMap's state would be updated
        }
    );

    // Load area data
    const areas = await loadAreas(); // This would fetch from moonAreas.json or a backend

    // Setup Moon Map
    const moonMapContainer = document.getElementById('moon-map-container'); // Assuming an element in index.html
    if (moonMapContainer) {
        initializeMoonMap(moonMapContainer, areas, (area) => {
            // This callback is invoked when an area is clicked in the map
            // It will then call the handleSpendAction from the walletConnector
            console.log('Area clicked in map:', area);
            if (walletConnector.tonConnectUI.connected) {
                walletConnector.handleSpendAction(area.id, area.name, area.cost);
            } else {
                alert('Please connect your wallet to buy an area.');
            }
        });
    }

    console.log('App initialized.');
}

*/

import { initializeWalletConnector } from './components/WalletConnector/WalletConnector.js';
import { initializeMoonMap, updateAreaDisplay } from './components/MoonMap/MoonMap.js';
import { loadAreas, updateAreaOwner } from './game_logic/areaService.js';

export async function App(appRootElement) {
    console.log('App initializing...');

    if (!appRootElement) {
        console.error('App root element not provided. Cannot initialize.');
        return;
    }

    // Get the handleSpendAction function from the WalletConnector
    // This function will be called when a user clicks an area on the map and confirms purchase.
    const { tonConnectUI, handleSpendAction } = initializeWalletConnector(
        'tonconnect-button-root',
        (areaId, buyerAddress) => {
            // This is the callback executed *after* a successful transaction via WalletConnector
            console.log(`App: Area ${areaId} purchase confirmed by ${buyerAddress}. Updating game state and UI.`);
            updateAreaOwner(areaId, buyerAddress); // Update local game state
            updateAreaDisplay(areaId, buyerAddress); // Update the MoonMap UI
            // TODO: Persist this change to a backend database
        }
    );

    // Load area data
    const areas = await loadAreas();

    // Setup Moon Map
    const moonMapContainer = document.getElementById('moon-map-container');
    if (moonMapContainer) {
        initializeMoonMap(moonMapContainer, areas, (clickedArea) => {
            // This callback is invoked when an area is clicked in the map
            console.log('App: Area clicked in map:', clickedArea);

            if (clickedArea.ownerAddress) {
                alert(`Area "${clickedArea.name}" is already owned by ${clickedArea.ownerAddress.slice(0,6)}...`);
                return;
            }

            if (tonConnectUI.connected) {
                // Call the handleSpendAction from WalletConnector
                // It will handle the confirmation and transaction sending
                handleSpendAction(clickedArea.id, clickedArea.name, clickedArea.cost);
            } else {
                alert('Please connect your wallet to buy an area.');
            }
        });
    } else {
        console.error('Moon map container (moon-map-container) not found.');
    }

    console.log('App initialized with Moon Map and Wallet Connector.');
} 
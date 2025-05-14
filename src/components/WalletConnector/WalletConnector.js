import { TonConnectUI } from '@tonconnect/ui';
import {
    initializeTonClient,
    getNativeBalance,
    getJettonWalletAddress,
    getJettonBalance,
    prepareJettonTransferPayload,
    TONKEY_MASTER_ADDRESS,
    CHAIN,
    Address,
    toNano,
    fromNano
} from '../../services/tonService';

// Helper function to introduce a delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper functions for Telegram UI (can be moved to a telegramService.js later)
function showAlertFallback(message) {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.showAlert && typeof tg.showAlert === 'function') {
        try {
            tg.showAlert(message);
        } catch (e) {
            console.warn("tg.showAlert failed, falling back to window.alert:", e);
            window.alert(message);
        }
    } else {
        window.alert(message);
    }
}

async function showConfirmFallback(message) {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.showConfirm && typeof tg.showConfirm === 'function') {
        try {
            return await new Promise(resolve => {
                tg.showConfirm(message, (ok) => resolve(ok));
            });
        } catch (e) {
            console.warn("tg.showConfirm failed, falling back to window.confirm:", e);
            return window.confirm(message);
        }
    } else {
        return window.confirm(message);
    }
}

export function initializeWalletConnector(rootElementId, spendAreaCallback) {
    const walletInfoDiv = document.getElementById('wallet-info'); // Assuming these IDs exist in your HTML
    const walletAddressSpan = document.getElementById('wallet-address');
    const walletNetworkSpan = document.getElementById('wallet-network');
    const tonBalanceSpan = document.getElementById('ton-balance');
    const tonkeyBalanceSpan = document.getElementById('tonkey-balance');
    const spendSectionDiv = document.getElementById('spend-section');
    // const spendAmountInput = document.getElementById('spend-amount-input'); // Will be part of map area UI
    // const spendButton = document.getElementById('spend-button'); // Will be part of map area UI

    let userTonkeyWalletAddress = null;

    const tonConnectUI = new TonConnectUI({
        manifestUrl: 'https://dasberkant.github.io/tonkey_game/tonconnect-manifest.json', // Ensure this is correct
        buttonRootId: rootElementId, // e.g., 'tonconnect-button-root'
        uiOptions: {
            twaReturnUrl: 'https://dasberkant.github.io/tonkey_game/' // Ensure this is correct
        }
    });

    tonConnectUI.onStatusChange(async wallet => {
        const tg = window.Telegram?.WebApp;
        if (wallet) {
            console.log('TonConnectUI onStatusChange - Wallet object:', JSON.stringify(wallet, null, 2));
            const address = wallet.account.address;
            const networkChainId = wallet.account.chain;
            initializeTonClient(networkChainId);

            if (walletAddressSpan) walletAddressSpan.textContent = `${Address.parse(address).toString({ bounceable: false }).slice(0, 6)}...${Address.parse(address).toString({ bounceable: false }).slice(-4)}`;
            if (walletNetworkSpan) walletNetworkSpan.textContent = networkChainId === CHAIN.MAINNET ? 'Mainnet' : 'Testnet';
            if (walletInfoDiv) walletInfoDiv.style.display = 'block';
            if (spendSectionDiv) spendSectionDiv.style.display = 'block'; // This might be controlled by map interaction later
            if (tonBalanceSpan) tonBalanceSpan.textContent = 'Fetching...';
            if (tonkeyBalanceSpan) tonkeyBalanceSpan.textContent = 'Fetching...';

            try {
                const nativeBalance = await getNativeBalance(address);
                if (tonBalanceSpan) tonBalanceSpan.textContent = `${parseFloat(fromNano(nativeBalance)).toFixed(4)} TON`;
            } catch (e) {
                console.error('Error fetching native TON balance:', e);
                if (tonBalanceSpan) tonBalanceSpan.textContent = 'Error fetching TON';
            }

            await sleep(1100);

            userTonkeyWalletAddress = await getJettonWalletAddress(address, TONKEY_MASTER_ADDRESS);
            if (userTonkeyWalletAddress) {
                console.log('User Tonkey Wallet Address:', userTonkeyWalletAddress);
                await sleep(1100);
                const balance = await getJettonBalance(userTonkeyWalletAddress);
                if (tonkeyBalanceSpan) {
                    if (balance !== null) {
                        tonkeyBalanceSpan.textContent = `${parseFloat(balance).toFixed(2)} TONKEY`;
                    } else {
                        tonkeyBalanceSpan.textContent = 'Error fetching';
                    }
                }
            } else {
                if (tonkeyBalanceSpan) tonkeyBalanceSpan.textContent = 'Wallet not found for Tonkey';
            }
            
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        } else {
            if (walletAddressSpan) walletAddressSpan.textContent = '';
            if (walletNetworkSpan) walletNetworkSpan.textContent = '';
            if (tonBalanceSpan) tonBalanceSpan.textContent = '--';
            if (walletInfoDiv) walletInfoDiv.style.display = 'none';
            if (spendSectionDiv) spendSectionDiv.style.display = 'none';
            if (tonkeyBalanceSpan) tonkeyBalanceSpan.textContent = '-- (Connect to fetch)';
            userTonkeyWalletAddress = null;
            // tonClient = null; // tonClient is managed in tonService.js now
        }
    });

    // This function will be called by the MoonMap component when a user tries to buy an area
    // For now, it contains the spend logic from your original script.js
    async function handleSpendAction(areaId, areaName, areaCost) {
        if (!tonConnectUI.connected || !userTonkeyWalletAddress) {
            const message = !tonConnectUI.connected ? 'Please connect your wallet.' :
                            'Tonkey wallet address not found.';
            showAlertFallback(message);
            return;
        }

        if (!tonConnectUI.wallet || !tonConnectUI.wallet.account) {
            showAlertFallback('Wallet account information is missing. Please reconnect.');
            return;
        }

        const jettonAmount = areaCost; // areaCost should be in Tonkey units (not nano)
        const recipientAddress = 'UQC4PB_Zs2z-1CetayPu1qE5yokaoZCoYc2TIrb3ZZDMwUIj'; // This should be the game's treasury/collection address
        const forwardTonAmount = '0.005'; // Min TON for gas

        try {
            const body = prepareJettonTransferPayload(
                tonConnectUI.wallet.account.address, // sender of jettons (user's wallet)
                recipientAddress, // recipient of jettons (game treasury)
                jettonAmount,
                forwardTonAmount
            );

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 360,
                messages: [{
                    address: userTonkeyWalletAddress, // User's Jetton Wallet address
                    amount: toNano(forwardTonAmount).toString(), // Amount for the transaction itself (gas etc)
                    payload: body.toBoc().toString('base64')
                }]
            };

            const confirmed = await showConfirmFallback(
                `Buy "${areaName}" for ${jettonAmount} TONKEY? This is a REAL transaction.`
            );

            if (confirmed) {
                try {
                    const result = await tonConnectUI.sendTransaction(transaction);
                    console.log('Transaction sent for area purchase:', result);
                    showAlertFallback(`Successfully bought ${areaName}! Transaction sent.`);
                    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                    
                    // TODO: Update area ownership locally and potentially on backend
                    // Call the spendAreaCallback if provided, to notify other parts of the app
                    if (spendAreaCallback) spendAreaCallback(areaId, tonConnectUI.wallet.account.address);

                    // Refresh balance after a delay
                    setTimeout(async () => {
                        if (userTonkeyWalletAddress && tonConnectUI.connected) {
                            const balance = await getJettonBalance(userTonkeyWalletAddress);
                            if (tonkeyBalanceSpan && balance !== null) {
                                tonkeyBalanceSpan.textContent = `${parseFloat(balance).toFixed(2)} TONKEY`;
                            }
                        }
                    }, 7000);
                } catch (error) {
                    console.error('Transaction error (area purchase):', error);
                    const errorMessage = typeof error === 'string' ? error : (error.message || 'Unknown transaction error');
                    showAlertFallback('Transaction failed: ' + errorMessage);
                    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
                }
            }
        } catch (e) {
            console.error('Error preparing transaction for area purchase:', e);
            showAlertFallback('Error preparing transaction: ' + (e.message || 'Unknown error'));
            if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
    }
    // Expose the spend function so App.js/MoonMap.js can call it
    return { tonConnectUI, handleSpendAction }; 
} 
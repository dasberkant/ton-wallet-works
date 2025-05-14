import { TonConnectUI } from '@tonconnect/ui';
import { TonClient, Address, Cell, beginCell, toNano, fromNano } from 'ton';

// Destructuring for TonClient etc. is now handled by the import
// let TonClient, Address, Cell, beginCell, toNano, fromNano; // Remove this

// function initializeTonLib() { // This function is no longer needed with direct imports
//    ({ TonClient, Address, Cell, beginCell, toNano, fromNano } = window.Ton);
// }

// Helper function to introduce a delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // The polling for window.Ton is no longer needed as we import 'ton' directly
    // const MAX_POLL_COUNT = 10;
    // let pollCount = 0;

    // function checkTonLibAndInit() { ... } // Remove this function
    // checkTonLibAndInit(); // Remove this call

    // Directly call initializeAppLogic as dependencies are handled by the bundler
    initializeAppLogic();

    // --------------- APP LOGIC STARTS HERE (moved into a function) ----------------- 
    function initializeAppLogic() {
        const walletInfoDiv = document.getElementById('wallet-info');
        const walletAddressSpan = document.getElementById('wallet-address');
        const walletNetworkSpan = document.getElementById('wallet-network');
        const tonBalanceSpan = document.getElementById('ton-balance');
        const tonkeyBalanceSpan = document.getElementById('tonkey-balance');
        const spendSectionDiv = document.getElementById('spend-section');
        const spendAmountInput = document.getElementById('spend-amount-input');
        const spendButton = document.getElementById('spend-button');

        const tonkeyMasterAddress = 'EQCn9sEMALm9Np1tkKZmKuK9h9z1mSbyDWQOPOup9mhe5pFB';
        const TONKEY_DECIMALS = 9; // IMPORTANT: Replace with your Tonkey's actual decimals
        let userTonkeyWalletAddress = null;
        let tonClient = null;

        const CHAIN = {
            MAINNET: '-239',
            TESTNET: '-3'
        };

        // const tonConnectUI = new window.TON_CONNECT_UI.TonConnectUI({ // Remove this instantiation
        const tonConnectUI = new TonConnectUI({ // Use the imported TonConnectUI
            manifestUrl: 'https://dasberkant.github.io/tonkey_game/tonconnect-manifest.json',
            buttonRootId: 'tonconnect-button-root',
            uiOptions: {
                twaReturnUrl: 'https://dasberkant.github.io/tonkey_game/' // TODO: Replace with your actual TMA URL
            }
        });

        function getTonClient(networkChainId) {
            if (networkChainId === CHAIN.MAINNET) {
                return new TonClient({
                    // endpoint: 'https://ton.orbs.network/json-rpc', // Switched to Orbs Network RPC
                    endpoint: 'https://toncenter.com/api/v2/jsonRPC', // Reverted to toncenter.com for Mainnet
                });
            }
            // Default to Testnet if not Mainnet (or add more specific checks if other networks are possible)
            return new TonClient({
                // endpoint: 'https://testnet.tonhubapi.com/jsonRPC', // Assuming Tonhub has a similar testnet endpoint structure
                endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC', // Reverted to toncenter for Testnet
            });
        }

        async function getJettonWalletAddress(ownerAddress, jettonMasterAddr) {
            if (!tonClient) return null;
            try {
                const masterAddress = Address.parse(jettonMasterAddr);
                const ownerAddr = Address.parse(ownerAddress);

                // console.log(`Attempting get_wallet_address for owner ${ownerAddress} on master ${jettonMasterAddr}`);

                const result = await tonClient.runMethod(
                    masterAddress,
                    'get_wallet_address',
                    [{ type: 'slice', cell: beginCell().storeAddress(ownerAddr).endCell() }] // Reverted to standard slice argument
                );
                // console.log('get_wallet_address result:', result);
                return result.stack.readAddress().toString();
            } catch (error) {
                console.error('Error getting Jetton wallet address:', error);
                // Log more details from the error if available
                if (error.response && error.response.data) {
                    console.error('RPC Error details:', error.response.data);
                }
                return null;
            }
        }

        async function getJettonBalance(jettonWalletAddr) {
            if (!tonClient || !jettonWalletAddr) return null;
            try {
                const walletAddress = Address.parse(jettonWalletAddr);
                const result = await tonClient.runMethod(walletAddress, 'get_wallet_data');
                const balance = result.stack.readBigNumber();
                return fromNano(balance); 
            } catch (error) {
                console.error('Error getting Jetton balance:', error);
                if (error.message && (error.message.includes('exit_code: -13') || error.message.includes('method not found'))){
                    return '0'; 
                }
                console.error('Error fetching balance: ' + (error.message || error.toString()));
                return null;
            }
        }

        tonConnectUI.onStatusChange(async wallet => {
            if (wallet) {
                console.log('TonConnectUI onStatusChange - Wallet object:', JSON.stringify(wallet, null, 2)); // DETAILED LOGGING
                const address = wallet.account.address;
                const networkChainId = wallet.account.chain; // Get the actual chain ID
                tonClient = getTonClient(networkChainId); // Pass the chain ID
                if (!tonClient) return; // Stop if client couldn't be initialized

                walletAddressSpan.textContent = `${Address.parse(address).toString({ bounceable: false }).slice(0, 6)}...${Address.parse(address).toString({ bounceable: false }).slice(-4)}`;
                walletNetworkSpan.textContent = networkChainId === CHAIN.MAINNET ? 'Mainnet' : 'Testnet'; // Display based on chain ID
                walletInfoDiv.style.display = 'block';
                spendSectionDiv.style.display = 'block';
                tonBalanceSpan.textContent = 'Fetching...';
                tonkeyBalanceSpan.textContent = 'Fetching...';

                // Fetch and display native TON balance
                try {
                    const nativeBalance = await tonClient.getBalance(Address.parse(address));
                    tonBalanceSpan.textContent = `${parseFloat(fromNano(nativeBalance)).toFixed(4)} TON`;
                } catch (e) {
                    console.error('Error fetching native TON balance:', e);
                    tonBalanceSpan.textContent = 'Error fetching TON';
                }

                await sleep(1100); // Wait a bit more than 1 second to be safe

                // Re-enable Tonkey balance fetching
                userTonkeyWalletAddress = await getJettonWalletAddress(address, tonkeyMasterAddress);
                if (userTonkeyWalletAddress) {
                    console.log('User Tonkey Wallet Address:', userTonkeyWalletAddress);
                    
                    await sleep(1100); // Wait a bit more than 1 second before fetching Jetton balance

                    const balance = await getJettonBalance(userTonkeyWalletAddress);
                    if (balance !== null) {
                        tonkeyBalanceSpan.textContent = `${parseFloat(balance).toFixed(2)} TONKEY`; 
                    } else {
                        tonkeyBalanceSpan.textContent = 'Error fetching';
                    }
                } else {
                    tonkeyBalanceSpan.textContent = 'Wallet not found for Tonkey';
                }
                
                if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            } else {
                walletAddressSpan.textContent = '';
                walletNetworkSpan.textContent = '';
                tonBalanceSpan.textContent = '--'; // Reset TON balance display
                walletInfoDiv.style.display = 'none';
                spendSectionDiv.style.display = 'none';
                tonkeyBalanceSpan.textContent = '-- (Connect to fetch)';
                userTonkeyWalletAddress = null;
                tonClient = null;
            }
        });

        // Helper function for alerts with fallback
        function showAlertFallback(message) {
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

        // Helper function for confirmations with fallback
        async function showConfirmFallback(message) {
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

        spendButton.addEventListener('click', async () => {
            if (!tonConnectUI.connected || !userTonkeyWalletAddress || !tonClient) {
                const message = !tonConnectUI.connected ? 'Please connect your wallet.' :
                                !userTonkeyWalletAddress ? 'Tonkey wallet address not found.' :
                                'TON client not ready.';
                showAlertFallback(message); // Use fallback
                return;
            }

            // --- BEGIN ADDED DEBUG LOGGING ---
            console.log('Spend Action: Debugging tonConnectUI.wallet object:');
            try {
                console.log(JSON.stringify(tonConnectUI.wallet, null, 2));
            } catch (e) {
                console.log('Could not stringify tonConnectUI.wallet:', e);
                console.log('tonConnectUI.wallet direct:', tonConnectUI.wallet);
            }

            if (tonConnectUI.wallet && tonConnectUI.wallet.account) {
                console.log('Spend Action: tonConnectUI.wallet.account.address is:', tonConnectUI.wallet.account.address);
                console.log('Spend Action: typeof tonConnectUI.wallet.account.address is:', typeof tonConnectUI.wallet.account.address);
            } else {
                console.error('Spend Action: tonConnectUI.wallet or tonConnectUI.wallet.account is not available!');
                if (tg && tg.showAlert) tg.showAlert('Wallet account information is missing. Please reconnect.');
                else alert('Wallet account information is missing. Please reconnect.');
                return;
            }
            // --- END ADDED DEBUG LOGGING ---

            const amountString = spendAmountInput.value;
            if (!amountString || parseFloat(amountString) <= 0) {
                showAlertFallback('Please enter a valid amount to spend.'); // Use fallback
                return;
            }
            
            const jettonAmount = toNano(amountString);
            const recipientAddress = 'UQC4PB_Zs2z-1CetayPu1qE5yokaoZCoYc2TIrb3ZZDMwUIj'; // Placeholder
            const forwardTonAmount = toNano('0.005'); 

            try { // Added try-catch around address parsing and cell creation
                const body = beginCell()
                    .storeUint(0x0f8a7ea5, 32)
                    .storeUint(0, 64)
                    .storeCoins(jettonAmount)
                    .storeAddress(Address.parse(recipientAddress)) // User might have changed this
                    .storeAddress(Address.parse(tonConnectUI.wallet.account.address)) // Error occurs here
                    .storeMaybeRef(null)
                    .storeCoins(forwardTonAmount)
                    .storeMaybeRef(null)
                    .endCell();

                const transaction = {
                    validUntil: Math.floor(Date.now() / 1000) + 360,
                    messages: [{
                        address: userTonkeyWalletAddress,
                        amount: toNano('0.005').toString(),
                        payload: body.toBoc().toString('base64')
                    }]
                };

                // Use a more robust way to confirm, checking for tg.showConfirm first
                let confirmed = false;
                // --- MODIFIED CONFIRMATION LOGIC ---
                confirmed = await showConfirmFallback(
                    `Send ${amountString} TONKEY to ${recipientAddress.slice(0,6)}...? This is a REAL transaction.`
                );
                // --- END MODIFIED CONFIRMATION LOGIC ---

                if (confirmed) {
                    try {
                        const result = await tonConnectUI.sendTransaction(transaction);
                        console.log('Transaction sent:', result);
                        showAlertFallback('Transaction sent successfully! Check your wallet.'); // Use fallback
                        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                        
                        setTimeout(async () => {
                            if (userTonkeyWalletAddress && tonConnectUI.connected && tonClient) {
                                const balance = await getJettonBalance(userTonkeyWalletAddress);
                                if (balance !== null) {
                                    tonkeyBalanceSpan.textContent = `${parseFloat(balance).toFixed(2)} TONKEY`; 
                                }
                            }
                        }, 7000); // Increased delay for balance update
                    } catch (error) {
                        console.error('Transaction error:', error);
                        // Log the full error object for more details
                        console.error('Full transaction error object:', error);
                        const errorMessage = typeof error === 'string' ? error : (error.message || 'Unknown transaction error');
                        showAlertFallback('Transaction failed: ' + errorMessage); // Use fallback
                        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
                    }
                }
            } catch (e) {
                console.error('Error with address parsing, or transaction preparation:', e); // Removed "confirmation popup"
                // Log the full error object
                console.error('Full preparation error object:', e);
                showAlertFallback('Error preparing transaction: ' + (e.message || 'Unknown error')); // Use fallback
                if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
            }
        });

        // Configure Telegram Main Button (optional but good for Mini Apps)
        if (tg && tg.MainButton) {
            tg.MainButton.setText('Close App');
            tg.MainButton.textColor = '#FFFFFF';
            tg.MainButton.color = '#FF0000'; // Red color for close
            tg.MainButton.show();
            tg.MainButton.onClick(() => {
                tg.close(); // Close the Mini App
            });
        }
    } // --------------- APP LOGIC ENDS HERE -----------------
}); 
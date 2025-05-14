import { TonClient, Address, Cell, beginCell, toNano, fromNano } from 'ton';

const CHAIN = {
    MAINNET: '-239',
    TESTNET: '-3'
};

let tonClient = null;

export function initializeTonClient(networkChainId) {
    if (networkChainId === CHAIN.MAINNET) {
        tonClient = new TonClient({
            endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        });
    } else {
        tonClient = new TonClient({
            endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        });
    }
    console.log(`TonClient initialized for ${networkChainId === CHAIN.MAINNET ? 'Mainnet' : 'Testnet'}`);
    return tonClient;
}

export function getTonClientInstance() {
    return tonClient;
}

export async function getNativeBalance(address) {
    if (!tonClient) throw new Error('TonClient not initialized');
    const walletAddress = Address.parse(address);
    return tonClient.getBalance(walletAddress);
}

export async function getJettonWalletAddress(ownerAddress, jettonMasterAddr) {
    if (!tonClient) throw new Error('TonClient not initialized');
    try {
        const masterAddress = Address.parse(jettonMasterAddr);
        const ownerAddr = Address.parse(ownerAddress);
        const result = await tonClient.runMethod(
            masterAddress,
            'get_wallet_address',
            [{ type: 'slice', cell: beginCell().storeAddress(ownerAddr).endCell() }]
        );
        return result.stack.readAddress().toString();
    } catch (error) {
        console.error('Error getting Jetton wallet address:', error);
        if (error.response && error.response.data) {
            console.error('RPC Error details:', error.response.data);
        }
        return null;
    }
}

export async function getJettonBalance(jettonWalletAddr) {
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

export function prepareJettonTransferPayload(senderAddress, recipientAddress, jettonAmount, forwardTonAmount) {
    // Note: senderAddress here is the owner of the jetton wallet (your wallet address)
    // recipientAddress is the *destination* for the jettons
    return beginCell()
        .storeUint(0x0f8a7ea5, 32) // op code for jetton transfer
        .storeUint(0, 64) // query_id
        .storeCoins(toNano(jettonAmount.toString())) // jetton_amount (ensure it's BigNumber compatible)
        .storeAddress(Address.parse(recipientAddress)) // destination address for jettons
        .storeAddress(Address.parse(senderAddress)) // response_destination (owner of this jetton wallet)
        .storeMaybeRef(null) // custom_payload
        .storeCoins(toNano(forwardTonAmount.toString())) // forward_ton_amount (ensure it's BigNumber compatible)
        .storeMaybeRef(null) // forward_payload
        .endCell();
}

// Constants for your game (can be moved to a config file later)
export const TONKEY_MASTER_ADDRESS = 'EQCn9sEMALm9Np1tkKZmKuK9h9z1mSbyDWQOPOup9mhe5pFB';
export const TONKEY_DECIMALS = 9;

export { Address, Cell, beginCell, toNano, fromNano, CHAIN }; 
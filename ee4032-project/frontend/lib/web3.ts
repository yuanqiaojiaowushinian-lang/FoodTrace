import { ethers } from 'ethers';

// @ts-ignore
const SEPOLIA_CHAIN_ID_DEC = 11155111n;
const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

export async function ensureSepoliaNetwork(ethereum: any) {
    const provider = new ethers.BrowserProvider(ethereum);
    const net = await provider.getNetwork();
    if (net.chainId !== SEPOLIA_CHAIN_ID_DEC) {
        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
            });
        } catch (err: any) {
            // 钱包里没有 Sepolia，则尝试添加
            if (err?.code === 4902) {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: SEPOLIA_CHAIN_ID_HEX,
                            chainName: 'Sepolia Test Network',
                            rpcUrls: ["https://sepolia.infura.io/v3/e28e157769754701b47eabe46ae6d8f9"],
                            nativeCurrency: { name: 'SepoliaETH', symbol: 'SepoliaETH', decimals: 18 },
                            blockExplorerUrls: ['https://sepolia.etherscan.io'],
                        },
                    ],
                });
            } else {
                throw err;
            }
        }
    }
    return provider;
}

/** 连接钱包 + 确保网络为 Sepolia，返回 { provider, signer, account } */
export async function connectWalletAndEnsureSepolia() {
    if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('未检测到 MetaMask，请先安装。');
    }
    // 请求账户
    const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts',
    });
    if (!accounts?.length) throw new Error('未能获取到账户。');

    // 确保在 Sepolia
    const provider = await ensureSepoliaNetwork(window.ethereum);
    const signer = await provider.getSigner();

    return { provider, signer, account: accounts[0] };
}

/** 仅检测当前连接与网络（用于主页守卫） */
export async function checkConnectedAndSepolia() {
    if (typeof window === 'undefined' || !window.ethereum) return { connected: false, onSepolia: false };
    const provider = new ethers.BrowserProvider(window.ethereum);
    const net = await provider.getNetwork();
    const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' });
    return {
        connected: accounts?.length > 0,
        onSepolia: net.chainId === SEPOLIA_CHAIN_ID_DEC,
    };
}

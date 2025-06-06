// src/contexts/Web3Context.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers'; // Correct import for Ethers v6
import TokenABI from '../abis/GovernanceTokenABI.json';
import DaoABI from '../abis/SimpleDAOABI.json';

// --- IMPORTANT: REPLACE WITH YOUR ACTUAL VALUES ---
const TOKEN_CONTRACT_ADDRESS = 'your_token_contract(governance token)address';
const DAO_CONTRACT_ADDRESS = 'your_dao_contract(address)';

const TARGET_DAO_NETWORK = {
    id: '0xaa36a7', // Sepolia Hex Chain ID (11155111)
    name: 'Sepolia Test Network',
};
// --- END OF VALUES TO REPLACE ---

const Web3Context = createContext();
export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    const [currentNetwork, setCurrentNetwork] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [tokenContract, setTokenContract] = useState(null);
    const [daoContract, setDaoContract] = useState(null);
    const [tokenBalance, setTokenBalance] = useState('0');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userHasVotingPower, setUserHasVotingPower] = useState(false);
    const [isOnCorrectNetwork, setIsOnCorrectNetwork] = useState(false);

    // Helper to initialize contracts
    const initializeContracts = useCallback((currentSigner) => {
        if (currentSigner) {
            try {
                // Ensure ABI paths and structure are correct.
                // If ABI is directly the array: TokenABI, DaoABI
                // If ABI is under an "abi" key: TokenABI.abi, DaoABI.abi
                const token = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TokenABI, currentSigner);
                const dao = new ethers.Contract(DAO_CONTRACT_ADDRESS, DaoABI, currentSigner);
                setTokenContract(token);
                setDaoContract(dao);
                return true;
            } catch (e) {
                console.error("Error initializing contracts:", e);
                setError("Failed to initialize smart contracts. Check ABI and addresses.");
                setTokenContract(null);
                setDaoContract(null);
                return false;
            }
        }
        setTokenContract(null);
        setDaoContract(null);
        return false;
    }, []); // TOKEN_CONTRACT_ADDRESS, DAO_CONTRACT_ADDRESS, TokenABI, DaoABI are constants, not needed in deps


    const connectWallet = useCallback(async () => {
        setError('');
        setIsLoading(true);
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const web3Provider = new ethers.BrowserProvider(window.ethereum); // Ethers v6: BrowserProvider
                const web3Signer = await web3Provider.getSigner(); // Ethers v6: getSigner is async
                const userAccount = web3Signer.address; // Ethers v6: signer.address
                const net = await web3Provider.getNetwork();

                setProvider(web3Provider);
                setSigner(web3Signer);
                setAccount(userAccount);
                setCurrentNetwork(net);
                setIsConnected(true);

                if (net.chainId.toString() === parseInt(TARGET_DAO_NETWORK.id, 16).toString()) {
                    setIsOnCorrectNetwork(true);
                    initializeContracts(web3Signer);
                } else {
                    setIsOnCorrectNetwork(false);
                    setTokenContract(null);
                    setDaoContract(null);
                    setError(`Connected, but on wrong network. Switch to ${TARGET_DAO_NETWORK.name}.`);
                }
            } catch (err) {
                console.error("Connection Error:", err);
                setError(err.message || 'Failed to connect wallet.');
                setIsConnected(false);
                setIsOnCorrectNetwork(false);
            }
        } else {
            setError('MetaMask is not installed.');
        }
        setIsLoading(false);
    }, [initializeContracts]);


    const switchToCorrectNetwork = useCallback(async () => {
        if (!window.ethereum) {
            setError("MetaMask is not installed.");
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: TARGET_DAO_NETWORK.id }],
            });
            // 'chainChanged' event will handle re-initialization
        } catch (switchError) {
            const typedError = switchError; // Type assertion if needed for specific error codes
            if (typedError.code === 4902) {
                 setError(`${TARGET_DAO_NETWORK.name} (Chain ID: ${TARGET_DAO_NETWORK.id}) not added to MetaMask.`);
            } else {
                setError(`Failed to switch network. Please do it manually.`);
            }
            console.error("Switch network error:", typedError);
        }
        setIsLoading(false);
    }, []);


    const disconnectWallet = useCallback(() => {
        setProvider(null);
        setSigner(null);
        setAccount(null);
        setCurrentNetwork(null);
        setIsConnected(false);
        setTokenContract(null);
        setDaoContract(null);
        setTokenBalance('0');
        setUserHasVotingPower(false);
        setError('');
        setIsOnCorrectNetwork(false);
    }, []);


    const fetchTokenBalance = useCallback(async () => {
        if (tokenContract && account && isOnCorrectNetwork) {
            try {
                const balance = await tokenContract.balanceOf(account);
                const formattedBalance = ethers.formatUnits(balance, 18); // Ethers v6: ethers.formatUnits
                setTokenBalance(formattedBalance);
                setUserHasVotingPower(balance > 0n); // Ethers v6 returns BigInt, compare with BigInt zero
            } catch (err) {
                console.error("Error fetching token balance:", err);
                setTokenBalance('0');
                setUserHasVotingPower(false);
            }
        } else {
            setTokenBalance('0');
            setUserHasVotingPower(false);
        }
    }, [tokenContract, account, isOnCorrectNetwork]);


    useEffect(() => {
        if (isConnected && isOnCorrectNetwork && tokenContract && account) {
            fetchTokenBalance();
        }
    }, [isConnected, isOnCorrectNetwork, tokenContract, account, fetchTokenBalance]);


    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                // Re-trigger connection flow or update account and re-initialize
                // connectWallet(); // This is a full reconnect
                // More subtle update:
                setAccount(accounts[0]);
                if (provider && currentNetwork) { // provider and currentNetwork should exist if connected
                    (async () => {
                        const web3Signer = await provider.getSigner(accounts[0]);
                        setSigner(web3Signer);
                        if (currentNetwork.chainId.toString() === parseInt(TARGET_DAO_NETWORK.id, 16).toString()) {
                            setIsOnCorrectNetwork(true);
                            initializeContracts(web3Signer);
                        } else {
                            setIsOnCorrectNetwork(false);
                            setTokenContract(null);
                            setDaoContract(null);
                        }
                    })();
                }
            }
        };

        const handleChainChanged = (_chainIdHex) => {
            // When chain changes, re-evaluate everything
            // A simple way is to just recall connectWallet, which re-checks network and re-inits
            // connectWallet();
            // Or, more detailed:
            if (provider) { // Check if provider exists
                (async () => {
                    const net = await provider.getNetwork();
                    setCurrentNetwork(net);
                    if (net.chainId.toString() === parseInt(TARGET_DAO_NETWORK.id, 16).toString()) {
                        setIsOnCorrectNetwork(true);
                        setError('');
                        if (account && signer) { // If already connected and have signer
                            initializeContracts(signer); // Re-init contracts with existing signer
                        } else if (account) { // Account connected but signer might be stale
                             const newSigner = await provider.getSigner();
                             setSigner(newSigner);
                             initializeContracts(newSigner);
                        }
                        // else: not fully connected, connectWallet would handle
                    } else {
                        setIsOnCorrectNetwork(false);
                        setTokenContract(null);
                        setDaoContract(null);
                        setTokenBalance('0');
                        setUserHasVotingPower(false);
                        setError(`Switched to wrong network. Please switch to ${TARGET_DAO_NETWORK.name}.`);
                    }
                })();
            }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        // Optional: Check for existing connection on initial load
        // This is often tricky; for simplicity, many dApps require manual connect on first load.
        // (async () => {
        //     if (window.ethereum && (await window.ethereum.request({ method: 'eth_accounts' })).length > 0) {
        //        // Might attempt to connectWallet() here if you want auto-reconnect behavior
        //        // Be careful with race conditions or multiple calls.
        //     }
        // })();


        return () => {
            if (window.ethereum.removeListener) { // Check if removeListener exists
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [provider, account, signer, currentNetwork, initializeContracts, connectWallet, disconnectWallet]);


    return (
        <Web3Context.Provider value={{
            provider,
            signer,
            account,
            currentNetwork,
            isConnected,
            tokenContract,
            daoContract,
            tokenBalance,
            userHasVotingPower,
            isOnCorrectNetwork,
            switchToCorrectNetwork,
            targetNetwork: TARGET_DAO_NETWORK,
            connectWallet,
            disconnectWallet,
            fetchTokenBalance,
            error,
            setError, // Expose setError for components to potentially clear global errors
            isLoading,
            setIsLoading, // Expose setIsLoading if components need to trigger global loading
        }}>
            {children}
        </Web3Context.Provider>
    );
};
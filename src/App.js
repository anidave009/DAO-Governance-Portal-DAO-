// src/App.js
import React, { useState } from 'react';
import './App.css';
import CreateProposalComponent from './components/CreateProposal';
import ActiveProposalsComponent from './components/ActiveProposals'; // THIS IS THE CORRECT IMPORT
import ResultsComponent from './components/Results';
import { Web3Provider, useWeb3 } from './contexts/Web3Context';

const WalletConnector = () => {
    const {
        connectWallet, disconnectWallet, account, isConnected, error, isLoading,
        currentNetwork, isOnCorrectNetwork, switchToCorrectNetwork, targetNetwork
    } = useWeb3();

    return (
        <div className="wallet-connector">
            {/* ... (WalletConnector content as you have it) ... */}
            {isConnected ? (
                <div>
                    <p>Connected: {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'No Account'}</p>
                    {currentNetwork && <p>Current Network: {currentNetwork.name} (ID: {currentNetwork.chainId})</p>}
                    {!isOnCorrectNetwork && currentNetwork && targetNetwork && ( // Added targetNetwork check
                        <>
                            <p style={{ color: 'orange' }}>
                                DAO functionality requires {targetNetwork.name}.
                            </p>
                            <button onClick={switchToCorrectNetwork} disabled={isLoading}>
                                {isLoading ? 'Switching...' : `Switch to ${targetNetwork.name}`}
                            </button>
                        </>
                    )}
                    <button onClick={disconnectWallet}>Disconnect Wallet</button>
                </div>
            ) : (
                <button onClick={connectWallet} disabled={isLoading}>
                    {isLoading ? 'Connecting...' : 'Connect MetaMask Wallet'}
                </button>
            )}
            {error && <p className="error-message" style={{color: 'red'}}>{error}</p>}
        </div>
    );
};

function AppContent() {
    const [currentView, setCurrentView] = useState('home');
    const {
        isConnected,
        isOnCorrectNetwork,
        targetNetwork,
        daoContract,         // <<< Needed for button state and rendering gate
        account,             // <<< Needed for button state
        userHasVotingPower   // For the note about not having tokens
    } = useWeb3();

    // Determine if the core DAO functionalities (like create/active proposals) should be accessible
    const canAccessCoreDaoFeatures = isConnected && isOnCorrectNetwork && daoContract && account;

    const renderContent = () => {
        // If core features are required for the current view but not available, show a message.
        if ((currentView === 'create' || currentView === 'active') && !canAccessCoreDaoFeatures) {
            let message = "Please connect your wallet.";
            if (isConnected && !isOnCorrectNetwork) {
                message = `Please switch your MetaMask network to ${targetNetwork?.name || "the correct network"}.`;
            } else if (isConnected && isOnCorrectNetwork && (!daoContract || !account)) {
                message = "Initializing DAO components, please wait...";
            }
            return (
                <div style={{ textAlign: 'center', paddingTop: '20px' }}>
                    <p>{message}</p>
                </div>
            );
        }

        // At this point, if view is 'create' or 'active', canAccessCoreDaoFeatures is true.
        switch (currentView) {
            case 'create':
                // Show a note if user has no voting power, but still allow creation
                const createProposalNote = (userHasVotingPower === false && canAccessCoreDaoFeatures) // Check userHasVotingPower is explicitly false
                    ? <p>Note: Your connected account does not have GOV tokens, so you won't be able to vote.</p>
                    : null;
                return (
                    <div>
                        {createProposalNote}
                        <CreateProposalComponent />
                    </div>
                );
            case 'active':
                return <ActiveProposalsComponent />; // Assumes ActiveProposalsComponent has similar internal safeguards
            case 'results':
                return <ResultsComponent />;
            case 'home':
            default:
                return (
                    <div style={{ textAlign: 'center', paddingTop: '50px' }}>
                        <h2>Welcome to the SimpleDAO Governance Portal</h2>
                        <p>Connect your wallet, then select an option above to get started.</p>
                        {isConnected && !isOnCorrectNetwork && targetNetwork &&
                            <p style={{color: 'orange'}}>Please switch to {targetNetwork.name} to fully use the DAO.</p>
                        }
                    </div>
                );
        }
    };

    return (
        <div className="App">
            <header className="app-header">
                <h1>SimpleDAO Governance</h1>
                <WalletConnector />
            </header>

            <div className="navigation-options">
                <button
                    className={`nav-button ${currentView === 'create' ? 'active' : ''}`}
                    onClick={() => setCurrentView('create')}
                    disabled={!canAccessCoreDaoFeatures} // <<< Main gate for this button
                    >
                    Create Proposal
                </button>
                <button
                    className={`nav-button ${currentView === 'active' ? 'active' : ''}`}
                    onClick={() => setCurrentView('active')}
                    disabled={!canAccessCoreDaoFeatures} // <<< Main gate for this button
                    >
                    Active Proposals
                </button>
                <button
                    className={`nav-button ${currentView === 'results' ? 'active' : ''}`}
                    onClick={() => setCurrentView('results')}>
                    Voting Results
                </button>
            </div>

            <main className="content-section">
                {renderContent()}
            </main>
        </div>
    );
}

// ... (App component wrapping AppContent with Web3Provider)
// export default App;

function App() {
    return (
        <Web3Provider>
            <AppContent />
        </Web3Provider>
    );
}

export default App;
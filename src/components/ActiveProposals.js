// src/components/ActiveProposals.js
import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
// import { ethers } from 'ethers'; // No longer strictly needed here unless for other utils

function ActiveProposalsComponent() {
    const { daoContract, account, isConnected, userHasVotingPower, setError: setGlobalError, setIsLoading: setGlobalLoading } = useWeb3();
    const [proposals, setProposals] = useState([]);
    const [componentLoading, setComponentLoading] = useState(true);
    const [voteLoading, setVoteLoading] = useState({});
    const [localError, setLocalError] = useState('');

    const fetchProposals = useCallback(async () => {
        if (!daoContract) {
            if(isConnected) setLocalError("DAO contract not available. Still initializing or wrong network?");
            setComponentLoading(false);
            return;
        }
        setComponentLoading(true);
        setLocalError('');
        if(setGlobalError) setGlobalError(''); // Check if setGlobalError exists before calling

        try {
            const countBigInt = await daoContract.getProposalCount(); // Ethers v6 returns BigInt
            const count = Number(countBigInt);                        // Convert BigInt to Number

            const fetchedProposals = [];
            const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

            for (let i = 0; i < count; i++) {
                const pData = await daoContract.getProposal(i);
                // pData values (deadline, voteFor, voteAgainst) are BigInts in Ethers v6

                const deadlineSeconds = Number(pData.deadline); // Convert BigInt to Number

                if (currentTime < deadlineSeconds && !pData.executed) { // Only active and not executed
                    let userVoted = false;
                    if(account) {
                        userVoted = await daoContract.voted(i, account);
                    }
                    fetchedProposals.push({
                        id: i,
                        description: pData.description,
                        votesFor: Number(pData.voteFor),         // Convert BigInt to Number
                        votesAgainst: Number(pData.voteAgainst),   // Convert BigInt to Number
                        deadline: deadlineSeconds * 1000,        // Convert seconds to JS milliseconds
                        executed: pData.executed,
                        userVoted: userVoted
                    });
                }
            }
            setProposals(fetchedProposals.sort((a,b) => b.id - a.id)); // Show newest first
        } catch (err) {
            console.error("Failed to fetch proposals:", err);
            const errMsg = err.reason || err.data?.message || err.message || "Could not load proposals.";
            setLocalError(errMsg);
            if(setGlobalError) setGlobalError(errMsg);
        } finally {
            setComponentLoading(false);
            if(setGlobalLoading) setGlobalLoading(false);
        }
    }, [daoContract, account, isConnected, setGlobalError, setGlobalLoading]);

    useEffect(() => {
        if (isConnected && daoContract) { // Ensure daoContract is also available
            fetchProposals();
        } else {
            setProposals([]);
            setComponentLoading(false); // If not connected or no contract, don't show loading
        }
    }, [isConnected, daoContract, fetchProposals]); // Added daoContract dependency

    const handleVote = async (proposalId, support) => {
        if (!daoContract || !account || !userHasVotingPower) {
            setLocalError("Cannot vote. Ensure wallet is connected, on the correct network, and you have GOV tokens.");
            return;
        }
        if (proposals.find(p => p.id === proposalId)?.userVoted) {
            setLocalError("You have already voted on this proposal.");
            return;
        }

        setVoteLoading(prev => ({ ...prev, [proposalId]: true }));
        setLocalError('');
        if(setGlobalError) setGlobalError('');

        try {
            const tx = await daoContract.vote(proposalId, support);
            console.log("Vote transaction sent:", tx.hash);
            await tx.wait();
            console.log("Vote transaction mined!");
            alert(`Successfully voted on proposal #${proposalId}!`);
            fetchProposals(); // Re-fetch proposals
        } catch (err) {
            console.error("Voting Error:", err);
            let errMsg = "Transaction failed or was rejected.";
            if (err.code === 4001 || err.message?.includes("User denied transaction signature")) {
                errMsg = "Transaction rejected by user.";
            } else {
                errMsg = err.reason || err.data?.message || err.message || errMsg;
            }
            setLocalError(`Voting failed: ${errMsg}`);
            if(setGlobalError) setGlobalError(`Voting failed: ${errMsg}`); // Optionally set global error
            alert(`Voting failed: ${errMsg}`);
        } finally {
            setVoteLoading(prev => ({ ...prev, [proposalId]: false }));
        }
    };

    // These early returns are fine, but App.js/AppContent should ideally gate rendering
    // so these conditions aren't met often when the component is visible.
    if (!isConnected) {
        return <p>Please connect your wallet to view active proposals.</p>;
    }
    // If daoContract is not yet initialized (e.g. still connecting or wrong network)
    if (!daoContract && isConnected) {
        return <p>Initializing DAO features or please check your network...</p>;
    }

    if (componentLoading) {
        return <p>Loading active proposals...</p>;
    }
    if (localError) {
        return <p className="error-message" style={{color: 'red'}}>Error: {localError}</p>;
    }

    return (
        <div className="active-proposals-container">
            <h2>Active Proposals</h2>
            {!userHasVotingPower && isConnected && daoContract && <p style={{color: 'orange'}}>You do not have GOV tokens, so you cannot vote.</p>}
            {proposals.length === 0 && !componentLoading && <p>No active proposals at the moment.</p>}
            <ul className="proposals-list"> {/* Added class for consistency if needed */}
                {proposals.map(proposal => (
                    <li key={proposal.id} className="proposal-item">
                        <h3>Proposal #{proposal.id}: {proposal.description}</h3>
                        <p>Votes For: {proposal.votesFor} | Votes Against: {proposal.votesAgainst}</p>
                        <p>Voting Ends: {new Date(proposal.deadline).toLocaleString()}</p>
                        {Date.now() > proposal.deadline ? (
                            <p style={{color: 'red'}}>Voting has ended for this proposal.</p>
                        ) : proposal.userVoted ? (
                            <p style={{color: 'green'}}>You have voted on this proposal.</p>
                        ) : (
                            userHasVotingPower ? (
                                <div className="vote-actions">
                                    <button
                                        onClick={() => handleVote(proposal.id, true)}
                                        disabled={voteLoading[proposal.id]}
                                    >
                                        {voteLoading[proposal.id] ? 'Voting Yes...' : 'Vote Yes'}
                                    </button>
                                    <button
                                        onClick={() => handleVote(proposal.id, false)}
                                        disabled={voteLoading[proposal.id]}
                                        className="vote-no" // Added class for specific styling if needed
                                        style={{ marginLeft: '10px' }}
                                    >
                                        {voteLoading[proposal.id] ? 'Voting No...' : 'Vote No'}
                                    </button>
                                </div>
                            ) : (
                                <p>You need GOV tokens to vote.</p>
                            )
                        )}
                    </li>
                ))}
            </ul>
            <button onClick={fetchProposals} disabled={componentLoading || !daoContract} className="action-button"> {/* Added class */}
                Refresh Proposals
            </button>
        </div>
    );
}

export default ActiveProposalsComponent;
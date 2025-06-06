// src/components/Results.js
import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

function ResultsComponent() {
    const { daoContract, isConnected, setError: setGlobalError, setIsLoading: setGlobalLoading } = useWeb3();
    const [proposals, setProposals] = useState([]);
    const [componentLoading, setComponentLoading] = useState(true);
    const [localError, setLocalError] = useState('');
    // resultsCache can be useful if getVotingResult is expensive or to avoid re-fetching,
    // but for simplicity in debugging, let's ensure it's not causing issues.
    // We can re-introduce a more robust cache later if needed. For now, let's clear it on each fetch.
    // const [resultsCache, setResultsCache] = useState({});

    const fetchProposalsAndResults = useCallback(async () => {
        if (!daoContract) {
            if(isConnected) setLocalError("DAO contract not available. Still initializing or wrong network?");
            setComponentLoading(false);
            return;
        }
        setComponentLoading(true);
        setLocalError('');
        if(setGlobalError) setGlobalError('');

        try {
            const countBigInt = await daoContract.getProposalCount();
            const count = Number(countBigInt);

            const fetchedProposals = [];
            const currentTimeSeconds = Math.floor(Date.now() / 1000); // Current time in seconds

            console.log(`Results: Found ${count} total proposals. Current time (s): ${currentTimeSeconds}`);

            for (let i = 0; i < count; i++) {
                const pData = await daoContract.getProposal(i); // { description, voteFor, voteAgainst, deadline, executed }
                const deadlineSeconds = Number(pData.deadline);

                // Log data for each proposal to understand its state
                console.log(`Results: Proposal ID ${i}, Deadline (s): ${deadlineSeconds}, Executed: ${pData.executed}, VotesFor: ${Number(pData.voteFor)}, VotesAgainst: ${Number(pData.voteAgainst)}`);

                // Condition for a proposal to be considered for results:
                // 1. Its deadline has passed OR
                // 2. It has been marked as executed (even if deadline hasn't passed, though unusual for this contract)
                if (currentTimeSeconds >= deadlineSeconds || pData.executed) {
                    let resultOutcome = "Result Undetermined"; // Default

                    if (pData.executed) {
                        // If marked as executed, derive result from votes
                        const voteForNum = Number(pData.voteFor);
                        const voteAgainstNum = Number(pData.voteAgainst);
                        if (voteForNum > voteAgainstNum) resultOutcome = "Approved (Executed)";
                        else if (voteAgainstNum > voteForNum) resultOutcome = "Rejected (Executed)";
                        else resultOutcome = "Tie (Executed)";
                        console.log(`Results: Proposal ID ${i} is EXECUTED. Derived result: ${resultOutcome}`);
                    } else if (currentTimeSeconds >= deadlineSeconds) {
                        // If deadline passed AND not executed, call getVotingResult from contract
                        try {
                            resultOutcome = await daoContract.getVotingResult(i);
                            console.log(`Results: Proposal ID ${i} deadline passed, NOT EXECUTED. Contract getVotingResult: "${resultOutcome}"`);
                        } catch (getResultError) {
                            console.error(`Results: Error calling getVotingResult for proposal ${i}:`, getResultError);
                            resultOutcome = "Error fetching result";
                        }
                    }
                    // If for some reason it's still "Result Undetermined" (e.g., error fetching result),
                    // it will remain so or be caught by the fallback below.

                    fetchedProposals.push({
                        id: i,
                        description: pData.description,
                        votesFor: Number(pData.voteFor),
                        votesAgainst: Number(pData.voteAgainst),
                        deadline: deadlineSeconds * 1000, // JS milliseconds for display
                        executed: pData.executed,
                        // Fallback if resultOutcome is still "Result Undetermined"
                        result: resultOutcome === "Result Undetermined" ? "Awaiting Finalization" : resultOutcome
                    });
                } else {
                    console.log(`Results: Proposal ID ${i} is still active (deadline ${deadlineSeconds} > current ${currentTimeSeconds}) and not executed. Skipping for results view.`);
                }
            }
            setProposals(fetchedProposals.sort((a,b) => b.id - a.id));
            // setResultsCache(newResultsCache); // Not using cache in this simplified version
        } catch (err) {
            console.error("Failed to fetch proposal results:", err);
            const errMsg = err.reason || err.data?.message || err.message || "Could not load proposal results.";
            setLocalError(errMsg);
            if(setGlobalError) setGlobalError(errMsg);
        } finally {
            setComponentLoading(false);
            if(setGlobalLoading) setGlobalLoading(false);
        }
    // Removed resultsCache from dependency array as we're not using it actively for this debug version
    }, [daoContract, isConnected, setGlobalError, setGlobalLoading]);

    // ... (useEffect and render logic remain the same as your provided code) ...

    useEffect(() => {
        if (isConnected && daoContract) {
             fetchProposalsAndResults();
        } else if (isConnected && !daoContract) {
            setComponentLoading(true);
        } else {
            setProposals([]);
            setComponentLoading(false);
        }
    }, [isConnected, daoContract, fetchProposalsAndResults]);


    if (!isConnected && !daoContract) {
        return <p>Connect your wallet to view DAO results.</p>;
    }
    if (isConnected && !daoContract) {
        return <p>Initializing DAO results or please check your network...</p>;
    }
    if (componentLoading && daoContract) {
        return <p>Loading proposal results...</p>;
    }
    if (localError) {
        return <p className="error-message" style={{color: 'red'}}>Error: {localError}</p>;
    }

    return (
        <div className="results-container">
            <h2>Voting Results</h2>
            {proposals.length === 0 && !componentLoading && <p>No past proposals found.</p>} {/* Simplified message */}
            <ul className="proposals-list">
                {proposals.map(proposal => (
                    <li key={proposal.id} className="proposal-item">
                        <h3>Proposal #{proposal.id}: {proposal.description}</h3>
                        <p>Votes For: {proposal.votesFor} | Votes Against: {proposal.votesAgainst}</p>
                        <p>Voting Ended: {new Date(proposal.deadline).toLocaleString()}</p>
                        <p><strong>Result: {proposal.result}</strong></p>
                        {proposal.executed && <p style={{color: 'blue'}}>(This proposal has been marked as executed)</p>}
                    </li>
                ))}
            </ul>
            <button onClick={fetchProposalsAndResults} disabled={componentLoading || !daoContract} className="action-button">
                Refresh Results
            </button>
        </div>
    );
}

export default ResultsComponent;
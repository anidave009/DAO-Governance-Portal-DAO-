// src/components/CreateProposal.js
import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

function CreateProposalComponent() {
    // We rely on App.js to only render this component when daoContract and account are ready.
    const { daoContract, account, setError: setGlobalError } = useWeb3();

    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGlobalError(''); // Clear global error from previous attempts, if any
        setMessage('');     // Clear local message

        // Minimal crucial checks:
        // Even if App.js gates access, these are good final safeguards inside the function.
        if (!account) {
            setMessage("Error: Account not available. Please try reconnecting.");
            console.error("CreateProposal handleSubmit: Account is missing.");
            return;
        }
        if (!daoContract) {
            setMessage("Error: DAO Contract is not available. This shouldn't happen if the button was enabled. Please refresh or reconnect.");
            console.error("CreateProposal handleSubmit: daoContract is unexpectedly null or undefined.");
            return;
        }

        // THE CRITICAL TEST: Does the daoContract object actually have the function?
        if (typeof daoContract.createProposal !== 'function') {
            setMessage("CRITICAL ERROR: The DAO contract object is missing the 'createProposal' function. This indicates an issue with the ABI or the contract address.");
            console.error("CreateProposal handleSubmit: daoContract.createProposal is NOT a function. Inspect daoContract:", daoContract);
            // Log the daoContract to see what it actually is
            console.log("Detailed daoContract object:", JSON.stringify(daoContract, null, 2)); // Might be too large or circular for stringify
            // Better: iterate and log properties if above fails
            if (daoContract) {
                console.log("Inspecting daoContract's actual properties:");
                for (const prop in daoContract) {
                    if (Object.prototype.hasOwnProperty.call(daoContract, prop)) {
                         console.log(`  ${prop}: (type: ${typeof daoContract[prop]})`);
                    }
                }
            }
            return;
        }

        if (!description.trim()) {
            setMessage("Proposal description cannot be empty.");
            return;
        }

        setIsSubmitting(true);
        setMessage('Submitting proposal...');

        try {
            const tx = await daoContract.createProposal(description);
            setMessage('Transaction sent! Waiting for confirmation...');
            await tx.wait();
            setMessage(`Proposal created successfully! Tx: ${tx.hash.substring(0,10)}...`);
            setDescription('');
        } catch (err) {
            console.error("Error during daoContract.createProposal transaction:", err);
            if (err.code === 4001 || err.message?.includes("User denied transaction signature")) {
                setMessage("Transaction rejected by user.");
            } else {
                const errMsg = err.reason || err.data?.message || err.message || "Failed to create proposal transaction.";
                setMessage(`Error: ${errMsg}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // If App.js correctly gates the rendering of this component,
    // these early returns for !isConnected or !isOnCorrectNetwork are not strictly needed here.
    // The main check is for daoContract and account for the button.

    return (
        <div className="create-proposal-container">
            <h2>Create New Proposal</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="description">Proposal Description:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                        required
                        // Button is disabled if daoContract or account is missing, or during submission.
                        disabled={isSubmitting || !daoContract || !account}
                    />
                </div>
                <button
                    type="submit"
                    className="submit-button"
                    // Key disabling logic:
                    // - isSubmitting: Prevents double-submit.
                    // - !description.trim(): Ensures form is filled.
                    // - !daoContract: Ensures contract object is available.
                    // - !account: Ensures account is available.
                    disabled={isSubmitting || !description.trim() || !daoContract || !account}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
            </form>
            {message && (
                <p className={message.toLowerCase().startsWith("error:") || message.toLowerCase().includes("failed") || message.toLowerCase().includes("rejected") ? "error-message" : "success-message"}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default CreateProposalComponent;
# DAO-Governance-Portal
# Simple DAO Governance Portal

A basic Decentralized Autonomous Organization (DAO) governance portal built with React. Users can connect their MetaMask wallet, create proposals, view active proposals, vote on proposals (if they hold the DAO's governance token), and view the results of past proposals.

This project demonstrates core concepts of dApp development including wallet integration, smart contract interaction, and token-gated functionality.

## Features

*   MetaMask wallet connection.
*   Network validation (prompts to switch to the target network, e.g., Sepolia).
*   Create new governance proposals.
*   View and vote on active proposals (requires holding Governance Tokens).
*   View results of completed proposals.
*   Token balance display for the connected account.

## Tech Stack

*   **Frontend:** React.js
*   **Ethereum Interaction:** Ethers.js (v6.x)
*   **Wallet:** MetaMask
*   **Smart Contracts:** Solidity (`^0.8.20`)
    *   `GovernanceToken.sol`: An ERC20 token for voting.
    *   `SimpleDAO.sol`: The core DAO logic contract.
*   **Target Network (Default):** Sepolia Testnet

## Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js and npm/yarn:**
    *   Node.js (v16.x or later recommended): [Download Node.js](https://nodejs.org/)
    *   npm (comes with Node.js) or Yarn: [Install Yarn](https://classic.yarnpkg.com/en/docs/install)
2.  **MetaMask Browser Extension:**
    *   Install MetaMask: [MetaMask.io](https://metamask.io/)
    *   Create or import an Ethereum wallet.
    *   Fund your wallet with Sepolia ETH (or ETH for your target testnet) from a faucet (e.g google sepolia faucet)
3.  **Remix IDE (Online) or a local Solidity development environment (e.g., Hardhat, Truffle):**
    *   We'll use Remix for these instructions for simplicity: [Remix Ethereum IDE](https://remix.ethereum.org/)

## Project Setup and Running Locally
1. Install Dependencies and install react app first : 'watch youtube video ,its basic '.
2. Follow these steps :-
4. In the app change App.js , index.js and index.css(if present) with the files above.
5. Create one folder (components )  and add (createproposal.js,activeproposal,results) in it and create another folder (contexts) and add (web3context.js) in it. Included an image which describes
the flow of project / directory of files.

6. Deploy Smart Contracts (using Remix IDE):
   
a. Deploy GovernanceToken.sol:
* Go to Remix Ethereum IDE.
* Create a new file named GovernanceToken.sol and paste the contract code into it.
* Go to the "Solidity Compiler" tab (third icon on the left).
* Select a compatible compiler version (e.g., 0.8.20).
* Click "Compile GovernanceToken.sol".
* Go to the "Deploy & Run Transactions" tab (fourth icon).
* Under "ENVIRONMENT", select "Injected Provider - MetaMask". (Ensure MetaMask is connected to the Sepolia Testnet).
* Under "CONTRACT", ensure GovernanceToken is selected.
* Click the "Deploy" button.
* Confirm the transaction in MetaMask.
* Once deployed, find the "Deployed Contracts" section in Remix. Copy the address of your deployed GovernanceToken contract. Save this address – you'll need it.

  
b. Deploy SimpleDAO.sol:
* Create a new file named SimpleDAO.sol in Remix and paste its code.
* Compile SimpleDAO.sol using the same compiler version.
* In the "Deploy & Run Transactions" tab, ensure SimpleDAO is selected under "CONTRACT".
* Next to the "Deploy" button, there's an input field for the _govTokenAddress constructor argument. Paste the GovernanceToken contract address you copied in the previous step into this field.
* Click the "Deploy" button.
* Confirm the transaction in MetaMask.
* Once deployed, copy the address of your deployed SimpleDAO contract. Save this too.

* PASTE BOTH CONTRACT ADDRESS (GOVTOKEN.SOL AND SIMPLEDAO.SOL) FROM YOUR REMIX/ETHERSCAN IN WEB3CONTEXT.SOL FILE IN CONTEXTS FOLDER in PLACEHOLDERS .

4. Obtain ABIs (Application Binary Interfaces):
While still in Remix, for each compiled contract (GovernanceToken and SimpleDAO):
Go to the "Solidity Compiler" tab.
Ensure the correct contract is selected in the "CONTRACT" dropdown.
Below the contract selection, find the "ABI" button. Click it to copy the ABI to your clipboard.
For GovernanceToken:
* Create a file src/abis/GovernanceTokenABI.json in your project.
* Paste the copied ABI into this file. Ensure the content is just the JSON array (starts with [ and ends with ]).
For SimpleDAO:
* Create a file src/abis/SimpleDAOABI.json in your project.
* Paste the copied ABI into this file. Ensure the content is just the JSON array

5. Run the React Application :  'npm start'

6.How to Use the DAO :
* Connect Wallet: Click the "Connect MetaMask Wallet" button. Ensure MetaMask is on the Sepolia Testnet (or the TARGET_DAO_NETWORK you configured).
* Get Governance Tokens:
* The GovernanceToken contract mints tokens to the deployer's address upon deployment.
* To vote, other users will need these tokens. You'll need to implement a way to distribute them (e.g., by using MetaMask to transfer tokens from the deployer's account to other test accounts).
* Create a Proposal: Navigate to "Create Proposal", fill in the description, and submit.
* Vote on Proposals: Go to "Active Proposals". If you have GOV tokens and haven't voted yet, you can vote "Yes" or "No".
* View Results: After a proposal's deadline has passed (default is 2 days, or as configured in SimpleDAO.sol), navigate to "Voting Results" to see the outcome.


7.Troubleshooting :
* MetaMask is not installed": Ensure MetaMask extension is installed and enabled.
* Wrong Network": Your MetaMask is not connected to the TARGET_DAO_NETWORK (e.g., Sepolia). Use the "Switch Network" button or change it manually in MetaMask.
* Failed to initialize smart contracts...":
* Double-check that REACT_APP_TOKEN_CONTRACT_ADDRESS and REACT_APP_DAO_CONTRACT_ADDRESS in your .env file are correct and that the contracts are deployed on the target network.
* Verify that src/abis/GovernanceTokenABI.json and src/abis/SimpleDAOABI.json contain the correct ABIs for your deployed contracts.
* Transactions failing: Ensure your connected account has enough Sepolia ETH for gas fees.
* Functions not found (e.g., createProposal is not a function): This usually means the ABI in your .json file does not match the contract deployed at the address, or the address is incorrect. Re-check ABIs and contract addresses

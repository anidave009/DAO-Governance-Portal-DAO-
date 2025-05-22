// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract SimpleDAO {
    struct Proposal {
        string description;
        uint256 voteFor;
        uint256 voteAgainst;
        uint256 deadline;
        bool executed;
    }

    IERC20 public govToken;
    Proposal[] public proposals;
    mapping(uint256 => mapping(address => bool)) public voted;

    constructor(address _govTokenAddress) {
        govToken = IERC20(_govTokenAddress);
    }

    function createProposal(string memory _description) external {
        proposals.push(Proposal({
            description: _description,
            voteFor: 0,
            voteAgainst: 0,
            deadline: block.timestamp + 2 days,
            executed: false
        }));
    }

    function vote(uint256 _proposalId, bool support) external {
        require(block.timestamp < proposals[_proposalId].deadline, "Voting ended");
        require(!voted[_proposalId][msg.sender], "Already voted");
        require(govToken.balanceOf(msg.sender) > 0, "No voting power");

        voted[_proposalId][msg.sender] = true;

        if (support) {
            proposals[_proposalId].voteFor += 1;
        } else {
            proposals[_proposalId].voteAgainst += 1;
        }
    }

    function getProposal(uint256 _id) external view returns (
        string memory description,
        uint256 voteFor,
        uint256 voteAgainst,
        uint256 deadline,
        bool executed
    ) {
        Proposal memory p = proposals[_id];
        return (p.description, p.voteFor, p.voteAgainst, p.deadline, p.executed);
    }

    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }

    function getVotingResult(uint256 _id) external view returns (string memory) {
        Proposal memory p = proposals[_id];
        if (block.timestamp < p.deadline) {
            return "Voting is still active.";
        }

        if (p.voteFor > p.voteAgainst) return "Approved";
        if (p.voteAgainst > p.voteFor) return "Rejected";
        return "Tie";
    }
}

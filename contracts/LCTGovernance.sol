// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LCTGovernance is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Vote {
        address voter;
        uint256 stakeAmount;
    }

    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 finalDate;
        uint256 startingDate;
        address proposer;
        Vote[] positive;
        Vote[] negative;
    }

    IERC20 public immutable governanceToken;
    uint256 public immutable minimumStake;

    Proposal[] public proposals;

    mapping(address => uint256) public stakedBalances;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    mapping(uint256 => mapping(address => uint256))
        public stakedBalanceByProposal;
    mapping(uint256 => mapping(address => uint256)) public userLockByProposal;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 stakeAmount
    );
    event StakeWithdrawn(
        uint256 indexed proposalId,
        address indexed user,
        uint256 amount
    );

    constructor(IERC20 _token, uint256 _minimumStake) {
        governanceToken = _token;
        minimumStake = _minimumStake;
    }

    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _finalDate
    ) external {
        require(
            _finalDate > (block.timestamp / 1 days),
            "Final date must be in the future"
        );

        uint256 proposalId = proposals.length;

        proposals.push(
            Proposal({
                id: proposalId,
                title: _title,
                description: _description,
                finalDate: _finalDate,
                proposer: msg.sender,
                startingDate: block.timestamp / 1 days,
                positive: new Vote[](0),
                negative: new Vote[](0)
            })
        );

        emit ProposalCreated(proposalId, msg.sender);
    }

    function vote(
        uint256 _proposalId,
        bool _support,
        uint256 _stakeAmount
    ) external nonReentrant {
        require(_proposalId < proposals.length, "Invalid proposal ID");

        Proposal storage proposal = proposals[_proposalId];
        uint256 currentDay = block.timestamp / 1 days;

        require(
            currentDay <= proposal.finalDate,
            "Voting has ended for this proposal"
        );
        require(
            !hasVoted[_proposalId][msg.sender],
            "Already voted on this proposal"
        );

        hasVoted[_proposalId][msg.sender] = true;

        require(_stakeAmount > 0, "Cannot stake 0 tokens");
        require(
            governanceToken.allowance(msg.sender, address(this)) >=
                _stakeAmount,
            "Insufficient token allowance, call approve() first"
        );

        governanceToken.safeTransferFrom(
            msg.sender,
            address(this),
            _stakeAmount
        );
        stakedBalances[msg.sender] += _stakeAmount;

        require(
            stakedBalances[msg.sender] >= minimumStake,
            "Insufficient stake to vote"
        );

        stakedBalanceByProposal[_proposalId][msg.sender] += _stakeAmount;

        if (_support) {
            proposal.positive.push(Vote(msg.sender, _stakeAmount));
        } else {
            proposal.negative.push(Vote(msg.sender, _stakeAmount));
        }

        if (proposal.finalDate > userLockByProposal[_proposalId][msg.sender]) {
            userLockByProposal[_proposalId][msg.sender] = proposal.finalDate;
        }

        emit VoteCast(_proposalId, msg.sender, _support, _stakeAmount);
    }

    function withdraw(uint256 _proposalId) external nonReentrant {
        require(_proposalId < proposals.length, "Invalid proposal ID");

        uint256 currentDay = block.timestamp / 1 days;
        uint256 lockedUntil = userLockByProposal[_proposalId][msg.sender];
        require(
            currentDay > lockedUntil,
            "Cannot unstake before final date for this proposal"
        );

        uint256 stakedAmount = stakedBalanceByProposal[_proposalId][msg.sender];
        require(stakedAmount > 0, "No tokens to unstake from this proposal");

        stakedBalances[msg.sender] -= stakedAmount;
        stakedBalanceByProposal[_proposalId][msg.sender] = 0;

        bool success = governanceToken.transfer(msg.sender, stakedAmount);
        require(success, "Token transfer failed");

        emit StakeWithdrawn(_proposalId, msg.sender, stakedAmount);
    }

    function getProposals() external view returns (Proposal[] memory) {
        return proposals;
    }
}

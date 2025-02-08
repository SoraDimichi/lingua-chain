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
    mapping(address => uint256) public userLock;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support
    );
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);

    constructor(IERC20 _token, uint256 _minimumStake) {
        governanceToken = _token;
        minimumStake = _minimumStake;
    }

    function stakeTokens(uint256 _amount) internal {
        require(_amount > 0, "Cannot stake 0 tokens");
        // Check allowance
        require(
            governanceToken.allowance(msg.sender, address(this)) >= _amount,
            "Insufficient token allowance, call approve() first"
        );

        // Transfer tokens from voter to contract
        governanceToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Increase staked balance
        stakedBalances[msg.sender] += _amount;

        emit TokensStaked(msg.sender, _amount);
    }

    function unstakeTokens(uint256 _amount) external nonReentrant {
        uint256 currentDay = block.timestamp / 1 days;

        require(
            currentDay > userLock[msg.sender],
            "Cannot unstake before final date"
        );
        require(
            _amount <= stakedBalances[msg.sender],
            "Insufficient staked balance"
        );

        stakedBalances[msg.sender] -= _amount;

        governanceToken.safeTransfer(msg.sender, _amount);

        emit TokensUnstaked(msg.sender, _amount);
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

    function voteOnProposal(
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

        stakeTokens(_stakeAmount);

        require(
            stakedBalances[msg.sender] >= minimumStake,
            "Insufficient stake to vote"
        );

        if (_support) {
            proposal.positive.push(Vote(msg.sender, _stakeAmount));
        } else {
            proposal.negative.push(Vote(msg.sender, _stakeAmount));
        }

        if (proposal.finalDate > userLock[msg.sender]) {
            userLock[msg.sender] = proposal.finalDate;
        }

        emit VoteCast(_proposalId, msg.sender, _support);
    }

    function getAllProposals() external view returns (Proposal[] memory) {
        return proposals;
    }
}

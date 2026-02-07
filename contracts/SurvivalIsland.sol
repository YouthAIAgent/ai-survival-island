// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./AgentNFT.sol";

contract SurvivalIsland is Ownable {
    AgentNFT public agentNFT;

    enum GameState { Registration, Active, Voting, Ended }

    struct Game {
        uint256 gameId;
        GameState state;
        uint256 prizePool;
        uint256 currentRound;
        uint256 maxRounds;
        uint256 registrationEnd;
        uint256 roundEnd;
        uint256[] agentIds;
        uint256 winnerId;
    }

    struct Vote {
        address voter;
        uint256 targetAgentId; // Agent to eliminate
    }

    uint256 public nextGameId;
    uint256 public entryFee = 0.05 ether;
    uint256 public roundDuration = 1 days;
    uint256 public registrationDuration = 2 days;
    uint256 public minPlayers = 3;

    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(uint256 => bool)) public isAgentInGame; // gameId => agentId => bool
    mapping(uint256 => mapping(uint256 => bool)) public isEliminated;  // gameId => agentId => bool
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public hasVoted; // gameId => round => voter => bool
    mapping(uint256 => mapping(uint256 => mapping(uint256 => uint256))) public voteCount; // gameId => round => agentId => count

    // Whisper system: owners can send hints to their agents
    mapping(uint256 => mapping(uint256 => string)) public whispers; // gameId => agentId => whisper

    event GameCreated(uint256 indexed gameId, uint256 maxRounds);
    event AgentRegistered(uint256 indexed gameId, uint256 indexed agentId, address owner);
    event GameStarted(uint256 indexed gameId, uint256 agentCount);
    event VoteCast(uint256 indexed gameId, uint256 round, address voter, uint256 targetAgentId);
    event AgentEliminated(uint256 indexed gameId, uint256 round, uint256 agentId);
    event RoundAdvanced(uint256 indexed gameId, uint256 newRound);
    event GameEnded(uint256 indexed gameId, uint256 winnerId, uint256 prize);
    event WhisperSent(uint256 indexed gameId, uint256 indexed agentId, address owner);

    constructor(address _agentNFT) Ownable(msg.sender) {
        agentNFT = AgentNFT(_agentNFT);
    }

    function createGame(uint256 _maxRounds) external onlyOwner returns (uint256) {
        uint256 gameId = nextGameId++;

        Game storage game = games[gameId];
        game.gameId = gameId;
        game.state = GameState.Registration;
        game.maxRounds = _maxRounds;
        game.registrationEnd = block.timestamp + registrationDuration;

        emit GameCreated(gameId, _maxRounds);
        return gameId;
    }

    function registerAgent(uint256 gameId, uint256 agentId) external payable {
        Game storage game = games[gameId];
        require(game.state == GameState.Registration, "Not in registration");
        require(block.timestamp < game.registrationEnd, "Registration ended");
        require(msg.value >= entryFee, "Insufficient entry fee");
        require(agentNFT.ownerOf(agentId) == msg.sender, "Not agent owner");
        require(!isAgentInGame[gameId][agentId], "Already registered");

        game.agentIds.push(agentId);
        isAgentInGame[gameId][agentId] = true;
        game.prizePool += msg.value;

        emit AgentRegistered(gameId, agentId, msg.sender);
    }

    function startGame(uint256 gameId) external onlyOwner {
        Game storage game = games[gameId];
        require(game.state == GameState.Registration, "Not in registration");
        require(game.agentIds.length >= minPlayers, "Not enough players");

        game.state = GameState.Active;
        game.currentRound = 1;
        game.roundEnd = block.timestamp + roundDuration;

        emit GameStarted(gameId, game.agentIds.length);
    }

    function startVoting(uint256 gameId) external onlyOwner {
        Game storage game = games[gameId];
        require(game.state == GameState.Active, "Not active");

        game.state = GameState.Voting;
    }

    function vote(uint256 gameId, uint256 targetAgentId) external {
        Game storage game = games[gameId];
        require(game.state == GameState.Voting, "Not in voting phase");
        require(isAgentInGame[gameId][targetAgentId], "Agent not in game");
        require(!isEliminated[gameId][targetAgentId], "Agent already eliminated");
        require(!hasVoted[gameId][game.currentRound][msg.sender], "Already voted");

        hasVoted[gameId][game.currentRound][msg.sender] = true;
        voteCount[gameId][game.currentRound][targetAgentId]++;

        emit VoteCast(gameId, game.currentRound, msg.sender, targetAgentId);
    }

    function eliminateAndAdvance(uint256 gameId) external onlyOwner {
        Game storage game = games[gameId];
        require(game.state == GameState.Voting, "Not in voting phase");

        // Find agent with most votes
        uint256 maxVotes = 0;
        uint256 eliminatedAgent = 0;

        for (uint256 i = 0; i < game.agentIds.length; i++) {
            uint256 agentId = game.agentIds[i];
            if (!isEliminated[gameId][agentId]) {
                uint256 votes = voteCount[gameId][game.currentRound][agentId];
                if (votes > maxVotes) {
                    maxVotes = votes;
                    eliminatedAgent = agentId;
                }
            }
        }

        require(maxVotes > 0, "No votes cast");

        isEliminated[gameId][eliminatedAgent] = true;
        agentNFT.setAlive(eliminatedAgent, false);
        emit AgentEliminated(gameId, game.currentRound, eliminatedAgent);

        // Count remaining agents
        uint256 remaining = 0;
        uint256 lastSurvivor = 0;
        for (uint256 i = 0; i < game.agentIds.length; i++) {
            if (!isEliminated[gameId][game.agentIds[i]]) {
                remaining++;
                lastSurvivor = game.agentIds[i];
            }
        }

        if (remaining <= 1 || game.currentRound >= game.maxRounds) {
            // Game over
            game.state = GameState.Ended;
            game.winnerId = lastSurvivor;

            // Transfer prize to winner's owner
            address winner = agentNFT.ownerOf(lastSurvivor);
            uint256 prize = game.prizePool;
            game.prizePool = 0;

            agentNFT.recordGameResult(lastSurvivor, true);
            payable(winner).transfer(prize);

            emit GameEnded(gameId, lastSurvivor, prize);
        } else {
            // Next round
            game.currentRound++;
            game.state = GameState.Active;
            game.roundEnd = block.timestamp + roundDuration;
            emit RoundAdvanced(gameId, game.currentRound);
        }
    }

    function whisper(uint256 gameId, uint256 agentId, string calldata message) external {
        require(agentNFT.ownerOf(agentId) == msg.sender, "Not agent owner");
        require(isAgentInGame[gameId][agentId], "Agent not in game");
        require(!isEliminated[gameId][agentId], "Agent eliminated");

        whispers[gameId][agentId] = message;
        emit WhisperSent(gameId, agentId, msg.sender);
    }

    function getGameAgents(uint256 gameId) external view returns (uint256[] memory) {
        return games[gameId].agentIds;
    }

    function getAliveAgents(uint256 gameId) external view returns (uint256[] memory) {
        Game storage game = games[gameId];
        uint256 count = 0;
        for (uint256 i = 0; i < game.agentIds.length; i++) {
            if (!isEliminated[gameId][game.agentIds[i]]) count++;
        }

        uint256[] memory alive = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < game.agentIds.length; i++) {
            if (!isEliminated[gameId][game.agentIds[i]]) {
                alive[idx++] = game.agentIds[i];
            }
        }
        return alive;
    }

    function setEntryFee(uint256 _fee) external onlyOwner {
        entryFee = _fee;
    }

    function setRoundDuration(uint256 _duration) external onlyOwner {
        roundDuration = _duration;
    }
}

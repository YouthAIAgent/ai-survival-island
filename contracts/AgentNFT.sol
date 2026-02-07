// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AgentNFT is ERC721Enumerable, Ownable {
    uint256 public nextTokenId;
    uint256 public constant MAX_AGENTS = 1000;
    uint256 public mintPrice = 0.1 ether;

    struct AgentTraits {
        string name;
        uint8 charisma;    // 1-100: How persuasive the agent is
        uint8 strategy;    // 1-100: How well they plan
        uint8 loyalty;     // 1-100: How likely to keep alliances
        uint8 aggression;  // 1-100: How confrontational
        uint8 wit;         // 1-100: How clever in conversations
        string personality; // e.g., "manipulator", "hero", "wildcard"
    }

    mapping(uint256 => AgentTraits) public agentTraits;
    mapping(uint256 => bool) public isAlive;
    mapping(uint256 => uint256) public gamesPlayed;
    mapping(uint256 => uint256) public gamesWon;

    event AgentMinted(uint256 indexed tokenId, address indexed owner, string name, string personality);
    event AgentEliminated(uint256 indexed tokenId, uint256 gameId);

    constructor() ERC721("AI Survival Agent", "AGENT") Ownable(msg.sender) {}

    function mint(
        string calldata _name,
        string calldata _personality
    ) external payable returns (uint256) {
        require(nextTokenId < MAX_AGENTS, "Max agents reached");
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 tokenId = nextTokenId++;

        // Generate pseudo-random traits based on block data and token ID
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp, block.prevrandao, msg.sender, tokenId
        )));

        AgentTraits memory traits = AgentTraits({
            name: _name,
            charisma: uint8((seed % 80) + 20),
            strategy: uint8(((seed >> 8) % 80) + 20),
            loyalty: uint8(((seed >> 16) % 80) + 20),
            aggression: uint8(((seed >> 24) % 80) + 20),
            wit: uint8(((seed >> 32) % 80) + 20),
            personality: _personality
        });

        agentTraits[tokenId] = traits;
        isAlive[tokenId] = true;

        _safeMint(msg.sender, tokenId);

        emit AgentMinted(tokenId, msg.sender, _name, _personality);
        return tokenId;
    }

    function getAgentTraits(uint256 tokenId) external view returns (AgentTraits memory) {
        require(tokenId < nextTokenId, "Agent does not exist");
        return agentTraits[tokenId];
    }

    function setAlive(uint256 tokenId, bool alive) external onlyOwner {
        isAlive[tokenId] = alive;
    }

    function recordGameResult(uint256 tokenId, bool won) external onlyOwner {
        gamesPlayed[tokenId]++;
        if (won) gamesWon[tokenId]++;
    }

    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}

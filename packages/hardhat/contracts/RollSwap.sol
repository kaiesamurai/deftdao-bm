// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

interface AggregatorV3Interface {
  function decimals() external view returns (uint8);

  function description() external view returns (string memory);

  function version() external view returns (uint256);

  function getRoundData(
    uint80 _roundId
  ) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);

  function latestRoundData()
    external
    view
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

contract RollSwap is ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    AggregatorV3Interface internal priceFeed;

    struct Quote {
        uint256 id;
        address maker;
        address taker;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 expiry;
        bool isActive;
    }

    uint256 private _quoteIdCounter;
    mapping(uint256 => Quote) public quotes;
    EnumerableSet.AddressSet private makers;

    event QuoteCreated(uint256 indexed id, address indexed maker, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, uint256 expiry);
    event QuoteAccepted(uint256 indexed id, address indexed taker);

    constructor() {
        _quoteIdCounter = 0;
        // Initialize the Chainlink Price Feed (this is an example address for ETH/USD on Scroll Sepolia)
        priceFeed = AggregatorV3Interface(0x59F1ec1f10bD7eD9B938431086bC1D9e233ECf41);
    }

    function createQuote(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, uint256 duration) external returns (uint256) {
        uint256 expiry = block.timestamp + duration;
        uint256 quoteId = ++_quoteIdCounter;

        // Example check: ensure that the price for ETH/USD (if applicable) is within a certain range
        if (tokenIn == address(0x59F1ec1f10bD7eD9B938431086bC1D9e233ECf41) || tokenOut == address(0x59F1ec1f10bD7eD9B938431086bC1D9e233ECf41)) {
            require(validatePrice(amountIn, amountOut), "Price not within acceptable range");
        }

        quotes[quoteId] = Quote({
            id: quoteId,
            maker: msg.sender,
            taker: address(0),
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            expiry: expiry,
            isActive: true
        });

        makers.add(msg.sender);
        emit QuoteCreated(quoteId, msg.sender, tokenIn, tokenOut, amountIn, amountOut, expiry);
        return quoteId;
    }

    function validatePrice(uint256 amountIn, uint256 amountOut) internal view returns (bool) {
        int256 currentPrice = getLatestPrice();
        // Custom logic to validate the price
        // For example, check if the price is within a certain percentage of the market price
        return amountOut >= amountIn * uint256(currentPrice) / 1e8;
    }

    function getLatestPrice() public view returns (int256) {
        (
            uint80 roundID,
            int256 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }
    
    function acceptQuote(uint256 quoteId) external nonReentrant {
        Quote storage quote = quotes[quoteId];
        require(quote.isActive && block.timestamp <= quote.expiry, "Quote is not active or has expired");
        require(IERC20(quote.tokenIn).transferFrom(msg.sender, quote.maker, quote.amountIn), "Failed to transfer tokens to maker");
        require(IERC20(quote.tokenOut).transferFrom(quote.maker, msg.sender, quote.amountOut), "Failed to transfer tokens from maker");

        quote.isActive = false;
        quote.taker = msg.sender;
        emit QuoteAccepted(quoteId, msg.sender);
    }
}

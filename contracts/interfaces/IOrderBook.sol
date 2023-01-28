/// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

/**
 * @title OrderBook Interface
 * @author Hadi Khairallah
**/

interface IOrderBook {

    // @notice Status specific for each Order
    enum Status {
        OPENED,
        PARTIALLY_FILLED,
        FULFILLED,
        CANCELED
    }

    /// @notice Order Struct
    struct Order{
        address maker;
        address makeAsset;
        uint256 makeAmount;
        address taker;
        address takeAsset;
        uint256 takeAmount;
        uint256 salt;
        uint256 startBlock;
        uint256 endBlock;
        uint256 id;
    }

    struct Bid{
        address taker;
        uint256 makeAmountBought;
    }

    // @notice Open Order Event
    event OpenOrderEvent(
        uint256 indexed orderId,
        address indexed maker,
        uint256 makeAmount,
        uint256 takeAmount,
        uint256 startBlock,
        uint256 endBlock,
        address makeAsset,
        address takeAsset
    );

    // @notice Filling Order Event
    event FillingOrderEvent(
        uint256 indexed orderId,
        address indexed maker,
        address indexed taker,
        address makeAsset,
        address takeAsset,
        uint256 startBlock,
        uint256 endBlock,
        uint256 quantity,
        uint256 fulfilledQuantity
    );
    // @notice Cancel Order Event
    event CancelOrderEvent(
        uint256 indexed orderId,
        address indexed maker,
        address makeAsset,
        address takeAsset,
        uint256 makeAmount,
        uint256 takeAmount,
        uint256 startBlock,
        uint256 endBlock
    );

}
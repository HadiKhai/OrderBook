
/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

//@notice OrderBook Interface
import "./interfaces/IOrderBook.sol";
/**s
 * @title OrderBookV2 Contract
 * @author Hadi Khairallah
 **/
contract OrderBookV2 is Initializable,ReentrancyGuardUpgradeable, IOrderBook{

    /// @notice Using a counter to increment Order count
    using CountersUpgradeable for CountersUpgradeable.Counter;

    /// @notice using safe math for uints
    using SafeMathUpgradeable for uint256;

    /// @notice Order Id counter
    CountersUpgradeable.Counter public _currentOrderId;

    // @notice OrderBooks
    mapping(uint256 => Order) public _orderBooks;

    // @notice Status for Orders (can be part of the Order Struct)
    mapping(uint256 => Status) public _orderStatus;

    // @notice Bids for Order
    mapping(uint256 => Bid[]) public _orderBids;

    function initialize() public initializer {}

    modifier onlyMaker(uint id) {
        require(
            _orderBooks[id].maker == msg.sender,
            "Only Marker can cancel their orders"
        );
        _;
    }

    function getCurrentId () public view returns (uint){
        return _currentOrderId.current();
    }

    function checkOrderExists(uint id) public view returns(bool){
        return id <= _currentOrderId.current();
    }

    function canFill(uint256 id) public view returns (bool){
        require(checkOrderExists(id), "Order doesn't exist");
        require(_orderBooks[id].endBlock > block.timestamp, "Order Expired");
        return (_orderStatus[id] == Status.OPENED || _orderStatus[id] == Status.PARTIALLY_FILLED );
    }

    function getOrders() external view returns (Order[] memory, Status[] memory, Bid[][] memory){
        Order[] memory order = new Order[](_currentOrderId.current());
        Status[] memory status = new Status[](_currentOrderId.current());
        Bid[][] memory bids = new Bid[][](_currentOrderId.current());
        for (uint i = 0; i < _currentOrderId.current(); i++) {
            order[i] = _orderBooks[i];
            status[i] = _orderStatus[i];
            bids[i] = _orderBids[i];
        }
        return (order,status,bids);
    }

    function getOrderById(uint id) external view returns (Order memory, Status, Bid[] memory){
        return (_orderBooks[id], _orderStatus[id], _orderBids[id]);
    }

    function getOrdersByMakeAsset(address asset) public view returns (Order[] memory, Status[] memory, Bid[][] memory){
        Order[] memory order = new Order[](_currentOrderId.current());
        Status[] memory status = new Status[](_currentOrderId.current());
        Bid[][] memory bids = new Bid[][](_currentOrderId.current());
        for (uint i = 0; i < _currentOrderId.current(); i++) {
            if(canFill(i)){
                if(_orderBooks[i].makeAsset==asset){
                    order[i] = _orderBooks[i];
                    status[i] = _orderStatus[i];
                    bids[i] = _orderBids[i];
                }
            }
        }
        return (order,status,bids);
    }

    function getOrdersByTakeAsset(address asset) public view returns (Order[] memory, Status[] memory, Bid[][] memory){
        Order[] memory order = new Order[](_currentOrderId.current());
        Status[] memory status = new Status[](_currentOrderId.current());
        Bid[][] memory bids = new Bid[][](_currentOrderId.current());
        for (uint i = 0; i < _currentOrderId.current(); i++) {
            if(canFill(i)){
                if(_orderBooks[i].takeAsset==asset){
                    order[i] = _orderBooks[i];
                    status[i] = _orderStatus[i];
                    bids[i] = _orderBids[i];
                }
            }
        }
        return (order,status,bids);
    }

    function getOrdersByAddress(address makerAddress) public view returns (Order[] memory, Status[] memory, Bid[][] memory){
        Order[] memory order = new Order[](_currentOrderId.current());
        Status[] memory status = new Status[](_currentOrderId.current());
        Bid[][] memory bids = new Bid[][](_currentOrderId.current());
        for (uint i = 0; i < _currentOrderId.current(); i++) {
            if(_orderBooks[i].maker== makerAddress){
                order[i] = _orderBooks[i];
                status[i] = _orderStatus[i];
                bids[i] = _orderBids[i];
            }
        }
        return (order,status,bids);
    }

    function getOrdersWithBidsByAddress(address bidderAddress)  public view returns (Order[] memory, Status[] memory, Bid[][] memory){
        Order[] memory order = new Order[](_currentOrderId.current());
        Status[] memory status = new Status[](_currentOrderId.current());
        Bid[][] memory bids = new Bid[][](_currentOrderId.current());
        for (uint i = 0; i < _currentOrderId.current(); i++) {
            for(uint j = 0; j < _orderBids[i].length ; j++){
                if(_orderBids[i][j].taker == bidderAddress){
                    order[i] = _orderBooks[i];
                    status[i] = _orderStatus[i];
                    bids[i] = _orderBids[i];
                }
            }
        }
        return (order,status,bids);
    }
    // @notice Get Remaining amount by Order Id
    function getRemainingAmount(uint id) public view returns (uint _remaining){
        Bid[] memory bids = _orderBids[id];
        uint remaining = _orderBooks[id].makeAmount;
        for (uint i = 0; i < bids.length; i++) {
            remaining = remaining - bids[i].makeAmountBought;
        }
        return remaining;
    }

    // @notice Open Order
    function openOrder (
        uint256 makeAmount,
        uint256 takeAmount,
        address makeAsset,
        address takeAsset,
        uint256 endBlockTime
    ) external nonReentrant returns(Order memory){
        require(makeAsset != address(0), "Invalid Make Asset Address");
        require(takeAsset != address(0), "Invalid Take Asset Address");
        require(makeAmount > 0, "Make amount can't be 0");
        require(takeAmount > 0, "Take amount can't be 0");
        require(makeAsset != takeAsset, "Take and Make are the same tokens");
        require(endBlockTime > block.timestamp, "Invalid Date");
        require(
            ERC20Upgradeable(makeAsset).balanceOf(msg.sender) >= makeAmount,
            "Insufficient Make Asset Balance"
        );



        Order memory _order;

        _order.maker = msg.sender;
        _order.makeAmount = makeAmount;
        _order.takeAmount = takeAmount;
        _order.makeAsset = makeAsset;
        _order.takeAsset = takeAsset;
        _order.startBlock = block.timestamp;
        _order.endBlock = endBlockTime;
        _order.id = _currentOrderId.current();
        _orderBooks[_currentOrderId.current()] = _order;

        bool success = ERC20Upgradeable(makeAsset).transferFrom(
            msg.sender,
            address(this),
            makeAmount
        );

        _orderStatus[_currentOrderId.current()] = Status.OPENED;

        require(success, "Transfer Unsuccessful");
        emit OpenOrderEvent(
            _currentOrderId.current(),
            msg.sender,
            makeAmount,
            takeAmount,
            block.timestamp,
            endBlockTime,
            makeAsset,
            takeAsset
        );
        _currentOrderId.increment();
        return _order;
    }

    function takeOrder(uint id, uint256 amount) external nonReentrant returns (bool success){
        Order memory order = _orderBooks[id];
        uint256 _remaining = getRemainingAmount(id);
        require(amount > 0, "Invalid Amount");
        require(
            ERC20Upgradeable(order.takeAsset).balanceOf(msg.sender) >= amount,
            "Insufficient Take Asset Balance"
        );
        require(canFill(id), "Order is completed or cancelled");

        uint256 amountMake = amount;

        _orderStatus[id] =Status.PARTIALLY_FILLED;
        if(_remaining<=amount){
            amountMake = _remaining;
            _orderStatus[id] = Status.FULFILLED;
        }

        uint256 takeAssetAmount = (amountMake.mul(order.takeAmount)).div(order.makeAmount);

        Bid memory bid = Bid(msg.sender, amountMake);

        _orderBids[id].push(bid);
        bool result = ERC20Upgradeable(order.makeAsset).transfer(msg.sender, amountMake);
        require(result, "Maker withdraw Failed");
        result = ERC20Upgradeable(order.takeAsset).transferFrom(msg.sender, order.maker, takeAssetAmount);
        require(result, "Taker deposit Failed");
        emit FillingOrderEvent(
            id,
            order.maker,
            msg.sender,
            order.makeAsset,
            order.takeAsset,
            order.startBlock,
            order.endBlock,
            amount,
            _remaining - amountMake
        );
        success = true;
    }

    function cancelOrder(uint256 id)  external  onlyMaker(id) nonReentrant returns(bool success){
        Order memory order = _orderBooks[id];
        require(canFill(id), "Order is Already Closed or Fulfilled");
        uint256 _remaining = getRemainingAmount(id);
        bool result = ERC20Upgradeable(order.makeAsset).transfer(msg.sender, _remaining);
        require(result, "Refund Maker Failed");
        emit CancelOrderEvent(
            id,
            order.maker,
            order.makeAsset,
            order.takeAsset,
            _remaining,
            order.takeAmount,
            order.startBlock,
            order.endBlock
        );
        success = true;
    }
}
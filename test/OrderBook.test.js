const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const { Wallet } = require("ethers");
const {parseEther} = require("ethers/lib/utils");
const {deployProxy, upgradeProxy} = require("@openzeppelin/truffle-upgrades");
// chai assert
const { assert } = chai;

// chai promises
chai.use(chaiAsPromised);

// utils
const { checkEventEmitted, addDays } = require("../utils/test-helper")(web3);

// load contract artifact
const orderBookContract = artifacts.require("OrderBook");
const orderBookV2Contract = artifacts.require("OrderBookV2");
const orderBookV3Contract = artifacts.require("OrderBookV3");
const tokenA = artifacts.require("TokenA");
const tokenB = artifacts.require("TokenB");
// const orderBookContract = artifacts.require("OrderBook");

// contract test spec
contract("OrderBook",  ([deployer,maker1,maker2,maker3,maker4, ...others]) => {
    let orderBook;
    let TokenA;
    let TokenB;
    let orderBookV2;


    before(async () => {
        orderBook = await deployProxy(orderBookContract);
        TokenA = await tokenA.deployed()
        TokenB = await tokenB.deployed()
    });

    describe("Deployment", async () => {
        it("Orderbook deployed", async () => {
            if(orderBook){
                assert.ok( "OrderBook successfully deployed with address " + orderBook.address);
            }
            else{
                assert.fail("Unsuccessful Deployment of OrderBook")
            }
        })
        it("TokenA deployed", async () => {
            let name = await TokenA.name();
            let symbol = await TokenA.symbol();
            assert.equal(name, "TokenA");
            assert.equal(symbol, "TKA");
        })
        it("TokenB deployed", async () => {
            let name = await TokenB.name();
            let symbol = await TokenB.symbol();
            assert.equal(name, "TokenB");
            assert.equal(symbol, "TKB");
        })
    })

    describe("Mint Tokens to Users", async () => {
        it("Mint TokenA to Users", async() => {
            await TokenA.mint(maker1,1000)
            await TokenA.mint(maker2,2000)
            await TokenA.mint(maker3,3000)
            let balance1 = await TokenA.balanceOf(maker1);
            let balance2 = await TokenA.balanceOf(maker2);
            let balance3 = await TokenA.balanceOf(maker3);
            assert.equal(balance1, 1000);
            assert.equal(balance2, 2000);
            assert.equal(balance3, 3000);
        })
        it("Mint TokenB to Users", async() => {
            await TokenB.mint(maker1,3000)
            await TokenB.mint(maker2,2000)
            await TokenB.mint(maker3,1000)
            let balance1 = await TokenB.balanceOf(maker1);
            let balance2 = await TokenB.balanceOf(maker2);
            let balance3 = await TokenB.balanceOf(maker3);
            assert.equal(balance1, 3000);
            assert.equal(balance2, 2000);
            assert.equal(balance3, 1000);
        })
    })

    describe("Open Order", async () => {
        it("Maker1 should be able to open an order on TokenA", async () => {
            const allowance = await TokenA.approve(orderBook.address, 100000, {from: maker1});
            const orderTx = await orderBook.openOrder(
                50,
                100,
                TokenA.address,
                TokenB.address,
                addDays(new Date(),5),
                {from: maker1}
            )
            const newMakerBalance = await TokenA.balanceOf(maker1);
            let ev = checkEventEmitted(orderTx, "OpenOrderEvent");
            let acc = ev.args["maker"];
            assert.equal(acc, maker1);
            assert.equal(newMakerBalance, 950)
        })
        it("Maker2 should be able to open an order on TokenB", async () => {
            const allowance = await TokenB.approve(orderBook.address, 100000, {from: maker2});
            const orderTx = await orderBook.openOrder(
                100,
                200,
                TokenB.address,
                TokenA.address,
                addDays(new Date(),5),
                {from: maker2}
            )
            const newMakerBalance = await TokenB.balanceOf(maker2)
            let ev = checkEventEmitted(orderTx, "OpenOrderEvent");
            let acc = ev.args["maker"];
            assert.equal(acc, maker2);
            assert.equal(newMakerBalance, 1900)
        })
        it("Current ID should be 2", async () => {
            const currentId = await orderBook.getCurrentId();
            assert.equal(currentId, 2)
        })
        it("User shouldn't be able to open an order with both token assets", async () => {
            try{
                const orderTx = await orderBook.openOrder(
                    100,
                    100,
                    TokenB.address,
                    TokenB.address,
                    addDays(new Date(),5),
                    {from: maker2}
                )
                assert.fail("User shouldn't have been able to open an order with both tokens assets same address")
            }
            catch (e){
                assert.ok("User wasn't able to open an order book")
            }
        })
        it("User shouldn't be able to open an order with endDate before startDate", async () => {
            try{
                const orderTx = await orderBook.openOrder(
                    100,
                    100,
                    TokenB.address,
                    TokenB.address,
                    addDays(new Date(),-5),
                    {from: maker2}
                )
                assert.fail("User shouldn't be able to open an order with endDate before startDate")
            }
            catch (e){
                assert.ok("User wasn't able to open an order with endDate before startDate")
            }
        })
        it("User shouldn't be able to open an order with amount higher than balance", async () => {
            try{
                const orderTx = await orderBook.openOrder(
                    1000000,
                    100,
                    TokenB.address,
                    TokenB.address,
                    addDays(new Date(),-5),
                    {from: maker2}
                )
                assert.fail("User shouldn't be able to open an order with amount higher than balance")
            }
            catch (e){
                assert.ok("User wasn't able to open an order with amount higher than balance")
            }
        })
    })

    describe("Trade", async () => {
        it("Maker3 can take Maker1's Order", async() => {
            const allowance = await TokenB.approve(orderBook.address, 100000, {from: maker3});
            const orderTx = await orderBook.takeOrder(
                0,
                10,
                {from: maker3}
            )
             const remaining = await orderBook.getRemainingAmount(0);
             const balance1 = await TokenB.balanceOf(maker1);
             const balance2 = await TokenA.balanceOf(maker3);
             const balance3 = await TokenB.balanceOf(maker3);
            let ev = checkEventEmitted(orderTx, "FillingOrderEvent");
            let maker = ev.args["maker"];
            let taker = ev.args["taker"];
            assert.equal(maker, maker1);
            assert.equal(taker, maker3);
            assert.equal(remaining,40);
            assert.equal(balance1,3020);
            assert.equal(balance2,3010);
            assert.equal(balance3,980);
        })
        it("Maker2 take Maker1's Remaining Order", async() => {
            const allowance = await TokenB.approve(orderBook.address, 100000, {from: maker2});

            const orderTx = await orderBook.takeOrder(
                0,
                1000,
                {from: maker2}
            )

             const remaining = await orderBook.getRemainingAmount(0);
             const balance1 = await TokenB.balanceOf(maker1);
             const balance2 = await TokenA.balanceOf(maker2);
             const balance3 = await TokenB.balanceOf(maker2);
            let ev = checkEventEmitted(orderTx, "FillingOrderEvent");
            let maker = ev.args["maker"];
            let taker = ev.args["taker"];
            assert.equal(maker, maker1);
            assert.equal(taker, maker2);
            assert.equal(remaining,0);
            assert.equal(balance1,3100);
            assert.equal(balance2,2040);
            assert.equal(balance3,1820);
        })
        it("Maker2 can't fill Maker1's Order because it's fulfilled", async() => {
            try{
                const orderTx = await orderBook.takeOrder(
                    0,
                    1000,
                    {from: maker2}
                )
                assert.fail("Maker2 shouldn't be able to fill this Order")
            }
            catch(e) {
                assert.ok("Maker2 wasn't able to fill this Order")
            }
        })
        it("Maker4 can't fill Maker3's Order as he/she doesn't have enough balance", async () => {
            try{
                const allowance = await TokenA.approve(orderBook.address, 100000, {from: maker4});
                const orderTx = await orderBook.takeOrder(
                    1,
                    1000,
                    {from: maker4}
                )
                assert.fail("User shouldn't be able to fill")
            }catch (e) {
                assert.ok("User wasn't able to fill this order")
            }
        })
    })

    describe("Cancel Order", async () => {
        it("Maker4 can Create a new Order and Cancel it", async () => {
            await TokenB.mint(maker4,1000)
            const initialBalance = await TokenB.balanceOf(maker4);
            const allowance = await TokenB.approve(orderBook.address, 100000, {from: maker4});
            const orderTx = await orderBook.openOrder(
                50,
                100,
                TokenB.address,
                TokenA.address,
                addDays(new Date(),5),
                {from: maker4}
            )
            const balanceAfterOrder = await TokenB.balanceOf(maker4);
            assert.equal(balanceAfterOrder,initialBalance - 50);
            const cancelTx = await orderBook.cancelOrder(
                2,
                {from: maker4}
            )
            const balanceAfterCancel = await TokenB.balanceOf(maker4);
            let ev = checkEventEmitted(cancelTx, "CancelOrderEvent");
            let maker = ev.args["maker"];
            assert.equal(maker, maker4);
            assert.equal(initialBalance.toString(),balanceAfterCancel.toString());
        })
        it("Maker2 can Cancel Order and refund Remaining Tokens", async () => {
            const allowance = await TokenA.approve(orderBook.address, 100000, {from: maker3});
            const orderTx = await orderBook.takeOrder(
                1,
                50,
                {from: maker3}
            )
            const remaining = await orderBook.getRemainingAmount(1);
            const beforeCancel = await TokenB.balanceOf(maker2);
            const cancelTx = await orderBook.cancelOrder(
                1,
                {from: maker2}
            )
            const AfterCancel = await TokenB.balanceOf(maker2);
            assert.equal(AfterCancel.toString(), beforeCancel.add(remaining).toString());
        })
        it("Maker4 can't Cancel Order of Maker3", async() => {
            try{
                const allowance = await TokenB.approve(orderBook.address, 100000, {from: maker3});
                const orderTx = await orderBook.openOrder(
                    50,
                    100,
                    TokenB.address,
                    TokenA.address,
                    addDays(new Date(),5),
                    {from: maker3}
                )
                await orderBook.cancelOrder(3,{from: maker4})
                assert.fail("Maker4 shouldn't be able to cancel Maker3's Order")
            }catch(e) {
                assert.ok("Maker4 wasn't able to cancel Maker3's Order")
            }
        })
    })

    describe("OrderBookV2 Contract", async () => {
        it("Contract Upgrade And Cancel Order with return Status Assignment", async () => {
            const orderBookV1ContractInstance = await deployProxy(orderBookContract);
            await TokenB.mint(maker4,1000)
            await TokenA.mint(maker4,1000)
            const allowance = await TokenB.approve(orderBookV1ContractInstance.address, 100000, {from: maker4});
            const orderTx = await orderBookV1ContractInstance.openOrder(
                50,
                100,
                TokenB.address,
                TokenA.address,
                addDays(new Date(),5),
                {from: maker4}
            )
            const beforeUpgradeByMakeAsset = await orderBookV1ContractInstance.getOrdersByMakeAsset(TokenB.address);
            const beforeUpgradeById = await orderBookV1ContractInstance.getOrderById(0);
            assert.notEqual(beforeUpgradeById.toString(),beforeUpgradeByMakeAsset.toString())
            const orderBookV2ContractInstance = await upgradeProxy(orderBookV1ContractInstance.address, orderBookV2Contract);
            const afterUpgradeByMakeAsset = await orderBookV2ContractInstance.getOrdersByMakeAsset(TokenB.address);
            const afterUpgradeById = await orderBookV2ContractInstance.getOrderById(0);
            assert.equal(afterUpgradeById.toString(),afterUpgradeByMakeAsset.toString())

        })
        it("Get all bids for Maker", async () => {
            orderBookV2 = await upgradeProxy(orderBook.address, orderBookV2Contract);
            await TokenB.approve(orderBookV2.address, 100000, {from: maker4});
            await TokenB.approve(orderBookV2.address, 100000, {from: maker3});
            const orderTx = await orderBookV2.openOrder(
                50,
                100,
                TokenB.address,
                TokenA.address,
                addDays(new Date(),5),
                {from: maker3}
            )
            const takeTx = await orderBookV2.takeOrder(
                4,
                10,
                {from: maker4}
            )
            const takeTx2 = await orderBookV2.takeOrder(
                3,
                50,
                {from: maker4}
            )
            const orders = await orderBookV2.getOrders()
            const bids = await orderBookV2.getOrdersWithBidsByAddress(maker4);
            const bidsFound = bids[0].filter((element,i) => element.makeAsset !=="0x0000000000000000000000000000000000000000")
            assert.equal(bidsFound.length,2)
        })
    })

    describe("OrderBookv3 Contract", async() => {
        it("Contract Upgrade and check for Cancel Status", async () => {
            const orderBookV3ContractInstance = await upgradeProxy(orderBookV2.address, orderBookV3Contract);
            const cancelTx = await orderBookV3ContractInstance.cancelOrder(
                4,
                {from: maker3}
            )
            const orders = await orderBookV3ContractInstance.getOrderById(4);
            assert.equal(orders[1],3)

        })
    })
});

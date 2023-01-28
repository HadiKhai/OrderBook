const OrderBookV2 = artifacts.require("OrderBookV2");
const OrderBookV3 = artifacts.require("OrderBookV3");
const conf = require("../migration-parameters.js");
const { loadNetworkConfig } = require("../utils/test-helper")(web3);
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const fs = require("fs/promises");
const os = require("os");

module.exports = async (deployer, network, accounts) => {
    let networkOptions = loadNetworkConfig(conf)[network]();

    const existingOrderBook = await OrderBookV2.deployed();
    const orderBook = await upgradeProxy(existingOrderBook.address, OrderBookV3, { deployer });
    await fs.appendFile(__dirname +'/../.env.'+network, "APP_ORDER_BOOK_V3_ADDRESS="+orderBook.address+os.EOL)

    if (orderBook) {
        console.log(
            `Deployed: OrderBookV3
       network: ${network}
       address: ${orderBook.address}
       owner: ${accounts[0]}`
        );
    } else {
        console.log("OrderBook Deployment UNSUCCESSFUL");
    }
};

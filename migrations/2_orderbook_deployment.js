const OrderBook = artifacts.require("OrderBook");
const conf = require("../migration-parameters.js");
const os = require("os");
const { loadNetworkConfig } = require("../utils/test-helper")(web3);
const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const fs = require("fs/promises");
const path = require('path');

module.exports = async (deployer, network, accounts) => {
    let networkOptions = loadNetworkConfig(conf)[network]();

    const orderBook = await deployProxy(OrderBook, { deployer, initializer: 'initialize' });
    await fs.writeFile(__dirname +'/../.env.'+network, 'APP_ORDER_BOOK_ADDRESS='+orderBook.address+os.EOL)

    if (orderBook) {
        console.log(
            `Deployed: OrderBook
       network: ${network}
       address: ${orderBook.address}
       owner: ${accounts[0]}`
        );
    } else {
        console.log("OrderBook Deployment UNSUCCESSFUL");
    }
};

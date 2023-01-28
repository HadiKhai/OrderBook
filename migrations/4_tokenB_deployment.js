const Token = artifacts.require("TokenB");
const conf = require("../migration-parameters.js");
const fs = require("fs/promises");
const os = require("os");
const { loadNetworkConfig } = require("../utils/test-helper")(web3);

module.exports = async (deployer, network, accounts) => {
    let { tokenB : { name, symbol , decimals}} = loadNetworkConfig(conf)[network]();

    if(network==="development" || network==="testnet"){
        await deployer.deploy(Token, name, decimals, symbol);

        const token = await Token.deployed();
        await fs.appendFile(__dirname +'/../.env.'+network, 'APP_TOKEN_B_ADDRESS='+token.address+os.EOL)

        if (token ) {
            console.log(
                `Deployed: TokenB
                   network: ${network}
                   address: ${token.address}
                   owner: ${accounts[0]}`
            );
        } else {
            console.log("TokenB.sol Deployment UNSUCCESSFUL");
        }
    }

};

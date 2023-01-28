const Token = artifacts.require("TokenA");
const conf = require("../migration-parameters.js");
const { loadNetworkConfig } = require("../utils/test-helper")(web3);
const fs = require("fs/promises");
const os = require("os");

module.exports = async (deployer, network, accounts) => {
    let { tokenA : { name, symbol , decimals}} = loadNetworkConfig(conf)[network]();

    if(network==="development" || network==="testnet"){
        await deployer.deploy(Token, name, decimals, symbol);

        const token = await Token.deployed();
        await fs.appendFile(__dirname +'/../.env.'+network, 'APP_TOKEN_A_ADDRESS='+token.address+os.EOL)

        if (token ) {
            console.log(
                `Deployed: TokenA
                   network: ${network}
                   address: ${token.address}
                   owner: ${accounts[0]}`
            );
        } else {
            console.log("TokenA Deployment UNSUCCESSFUL");
        }
    }

};

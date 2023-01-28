const BN = require("bn.js");

const toBn = (value) => new BN(value);

const checkEventEmitted = (tx, eventName) => tx.logs.filter(l => l.event === eventName)[0];

const loadNetworkConfig = conf => ({
    development: () => {
        return { ...conf.devnet };
    },
    testnet: () => {
        return { ...conf.testnet}
    }
})

const addDays = (date, days) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return Math.floor(newDate.getTime() / 1000);
}


module.exports = (w3) => ({
    checkEventEmitted: checkEventEmitted,
    toBn: toBn,
    loadNetworkConfig,
    addDays
})
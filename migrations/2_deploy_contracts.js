var Token = artifacts.require("./StandardToken.sol");
var TokenSale = artifacts.require("./ShareTokenSale.sol");
var config = require("../config.json");
var tokenConfig = config.token;
var tokenSaleConfig = config.tokenSale;

function convertDecimals(number) {    
    return web3.toBigNumber(10).pow(tokenConfig.decimals).mul(number);
}

function getReceiverAddr(defaultAddr) {
    if(tokenSaleConfig.receiverAddr) {
        return tokenSaleConfig.receiverAddr;
    }
    return defaultAddr;
}


module.exports = function(deployer, network, accounts) {

    var defaultAddr = accounts[0];
    var receiverAddr = getReceiverAddr(defaultAddr);    
    var totalSaleAmout = convertDecimals(tokenSaleConfig.totalSaleAmout);
    var totalSupply = convertDecimals(tokenConfig.totalSupply);
    var startTime = web3.toBigNumber(tokenSaleConfig.startTime);
    var keepAmout = totalSupply.sub(totalSaleAmout);
    var tokenInstance = null;
    var toknSaleInstance = null;

    return deployer.deploy(Token, 
        totalSupply,
        tokenConfig.name,
        tokenConfig.symbol,
        tokenConfig.decimals)
    .then(function () {
        return deployer.deploy(TokenSale, receiverAddr, Token.address, totalSaleAmout, startTime);
    })
    .then(() => {
        return Token.deployed();
    })
    .then(instance => {
        tokenInstance = instance;
        return TokenSale.deployed()
    })
    .then(instance => {
        toknSaleInstance = instance;
        return tokenInstance.transfer(toknSaleInstance.address, totalSaleAmout);
    })
    .then(tx => {      
        var rates = [];
        var durations = [];
        var stages = tokenSaleConfig.stages;
        stages.forEach(element => { 
            rates.push(element.rate);
            durations.push(element.duration);
        });
        return toknSaleInstance.startSale(rates, durations);
    })
    .then(tx => {
        if(defaultAddr != receiverAddr) {
            return tokenInstance.transfer(receiverAddr, keepAmout);
        }
    });
};

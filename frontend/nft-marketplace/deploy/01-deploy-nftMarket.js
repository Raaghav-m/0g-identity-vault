const { network } = require("hardhat")
const { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts, deployments }) {
    let { deploy, log } = await deployments
    let { deployer } = await getNamedAccounts()
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    log("------------------------------------------------")

    let arguments = []

    log("------------------------------------------")
    await deploy("NftMarket", {
        from: deployer,
        args: arguments,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("Deployed ------------------------------------------")
}

module.exports.tags = ["all", "main"]

const { ethers } = require("hardhat");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const dIdentity = await deploy("DIdentity", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("DIdentity deployed at", dIdentity.address);
};
module.exports.tags = ["DIdentity", "all"];

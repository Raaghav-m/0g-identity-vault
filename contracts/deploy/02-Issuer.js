module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const ISSUER_ADDRESS = process.env.ISSUER_ADDRESS;

  const issuer = await deploy("Issuer", {
    from: deployer,
    args: [ISSUER_ADDRESS],
    log: true,
  });

  console.log("Issuer deployed at", issuer.address);
};
module.exports.tags = ["Issuer", "all"];

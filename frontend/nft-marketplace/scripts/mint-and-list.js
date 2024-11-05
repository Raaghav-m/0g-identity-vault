const { ethers } = require("hardhat")

const PRICE = ethers.parseEther("0.1")

async function mintAndList() {
    let nftMarketplace = await ethers.getContract("NftMarket")
    let basicNft = await ethers.getContract("BasicNft")
    console.log("minting nfts: ", basicNft)
    const mintnft = await basicNft.mintNft()
    const minted = await mintnft.wait(1)
    let tokenId = await minted.logs[0].args.tokenId
    console.log(`tokenID:${tokenId}`)
    console.log("approving...")
    const approvalTx = await basicNft.approve(nftMarketplace.target, tokenId)
    await approvalTx.wait(1)
    console.log("Listing...")
    const listingTx = await nftMarketplace.listItem(basicNft.target, tokenId, PRICE)
    await listingTx.wait(1)
    console.log("Listed!")
}
mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })

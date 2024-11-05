// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

error NftMarket__NotEnoughPrice(address nftAddress, uint256 tokenId, uint256 price);
error NftMarket__NotApproved();
error NftMarket__AlreadyListed();
error NftMarket__NotOwner();
error NftMarket__ItemNotListed(address nftAddress, uint256 tokenId);
error NftMarket__NoProceeds();

contract NftMarket {
    //mapping the address of nft to the token id to the details
    struct Details {
        uint256 price;
        address seller;
    }

    event nftAdded(
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price,
        address indexed sender
    );

    event ItemBought(address indexed buyer, address indexed nftAddress, uint256 price);
    event ItemDeleted(address indexed nftAddress, uint256 indexed tokenId, address indexed sender);
    event PriceUpdated(address indexed nftAddress, uint256 indexed tokenId, uint256 price);

    mapping(address => mapping(uint256 => Details)) private s_nftInfo;
    mapping(address => uint256) private s_proceeds;

    /////////////////////////////////////
    //modifiers
    modifier notListed(address nftAddress, uint256 tokenId) {
        Details memory list = s_nftInfo[nftAddress][tokenId];
        if (list.price > 0) {
            revert NftMarket__AlreadyListed();
        }
        _;
    }
    modifier onlyOwner(
        address sender,
        uint256 tokenId,
        address nftAddress
    ) {
        IERC721 nft = IERC721(nftAddress);
        address spender = nft.ownerOf(tokenId);
        if (sender != spender) {
            revert NftMarket__NotOwner();
        }
        _;
    }

    modifier rightPrice(
        uint256 sentValue,
        address nftAddress,
        uint256 tokenId
    ) {
        if (sentValue < s_nftInfo[nftAddress][tokenId].price) {
            revert NftMarket__NotEnoughPrice(
                nftAddress,
                tokenId,
                s_nftInfo[nftAddress][tokenId].price
            );
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        if (s_nftInfo[nftAddress][tokenId].price < 0) {
            revert NftMarket__ItemNotListed(nftAddress, tokenId);
        }
        _;
    }

    /////////////////////////////////////
    //functions
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external notListed(nftAddress, tokenId) onlyOwner(msg.sender, tokenId, nftAddress) {
        if (price < 0) {
            revert NftMarket__NotEnoughPrice(nftAddress, tokenId, price);
        }
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarket__NotApproved();
        }
        s_nftInfo[nftAddress][tokenId] = Details(price, msg.sender);
        emit nftAdded(nftAddress, tokenId, price, msg.sender);
    }

    function sellItem(
        address nftAddress,
        uint256 tokenId
    ) external payable isListed(nftAddress, tokenId) rightPrice(msg.value, nftAddress, tokenId) {
        s_proceeds[s_nftInfo[nftAddress][tokenId].seller] += msg.value;
        delete (s_nftInfo[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(
            s_nftInfo[nftAddress][tokenId].seller,
            msg.sender,
            tokenId
        );
        emit ItemBought(msg.sender, nftAddress, tokenId);
    }

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    ) external onlyOwner(msg.sender, tokenId, nftAddress) isListed(nftAddress, tokenId) {
        delete (s_nftInfo[nftAddress][tokenId]);
        emit ItemDeleted(nftAddress, tokenId, msg.sender);
    }

    function updatePrice(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external onlyOwner(msg.sender, tokenId, nftAddress) isListed(nftAddress, tokenId) {
        if (price < 0) {
            revert NftMarket__NotEnoughPrice(nftAddress, tokenId, price);
        }
        s_nftInfo[nftAddress][tokenId].price = price;
        emit PriceUpdated(nftAddress, tokenId, price);
    }

    function withdraw() external payable {
        if (s_proceeds[msg.sender] <= 0) {
            revert NftMarket__NoProceeds();
        }
        s_proceeds[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: s_proceeds[msg.sender]}("");
        require(success, "Transaction Failed");
    }

    /////getter functions
    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Details memory) {
        return s_nftInfo[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}

/*
list ✅,sell✅,cancelListing✅,updatePrice✅,withdrawal

1.listing
    check price.,check already uploaded,check if approved for operating,store the details of the uploaded nft
*/

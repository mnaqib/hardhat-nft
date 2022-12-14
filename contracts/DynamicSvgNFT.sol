//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

contract DynamicSvgNFT is ERC721 {
    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    uint256 private s_tokenCounter;
    string private i_lowImageURI;
    string private i_highImageURI;
    string private constant base64EncodedSVGPrefix =
        "data:image/svg+xml;base64,";
    AggregatorV3Interface internal immutable i_priceFeed;
    mapping(uint256 => int256) public s_tokenIdToHighValue;

    constructor(
        string memory lowSvg,
        string memory highSvg,
        address PriceFeeAddress
    ) ERC721("Dynamic SVG NFT", "DSN") {
        s_tokenCounter = 0;
        i_highImageURI = svgToImageURI(highSvg);
        i_lowImageURI = svgToImageURI(lowSvg);
        i_priceFeed = AggregatorV3Interface(PriceFeeAddress);
    }

    function svgToImageURI(string memory svg)
        public
        pure
        returns (string memory)
    {
        string memory svgBase64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(svg)))
        );
        return
            string(abi.encodePacked(base64EncodedSVGPrefix, svgBase64Encoded));
    }

    function mintNFT(int256 highValue) public {
        s_tokenIdToHighValue[s_tokenCounter] = highValue;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter += 1;

        emit CreatedNFT(s_tokenCounter, highValue);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "URI Query for non existent token");
        string memory imageURI = i_lowImageURI;

        (, int256 price, , , ) = i_priceFeed.latestRoundData();

        if (price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = i_highImageURI;
        }

        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(),
                                '", "description": "An NFT that changes based on the chainlink Feed",',
                                '"attributes": [{"trait_type": "coolness", "value": 100}], "image": "',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function getPriceFeed() public view returns (address) {
        return address(i_priceFeed);
    }

    function getLowSVGImageURI() public view returns (string memory) {
        return i_lowImageURI;
    }

    function getHighSVGImageURI() public view returns (string memory) {
        return i_highImageURI;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}

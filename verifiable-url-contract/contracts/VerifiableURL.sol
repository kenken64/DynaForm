// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VerifiableURL {
    mapping(bytes32 => bool) private verifiedURLs;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function addURL(string memory url) external onlyOwner {
        bytes32 urlHash = keccak256(abi.encodePacked(url));
        verifiedURLs[urlHash] = true;
    }

    function verifyURL(string memory url) external view returns (bool) {
        bytes32 urlHash = keccak256(abi.encodePacked(url));
        return verifiedURLs[urlHash];
    }
}
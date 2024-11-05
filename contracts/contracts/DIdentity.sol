// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
import {Issuer} from "./Issuer.sol";

error NotOwner(address requester);
error NotIssuer(address requester);

contract DIdentity {
    address public owner;

    enum Roles {
        Viewer,
        Issuer
    }
    mapping(address => Roles) public roles;
    mapping(address => string) private rootHash;
    mapping(address => Issuer) private issuers;

    event UpdatedInformationEvent(address requester, string rH);
    event RequestSubmitted(address requester, address approver);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner(msg.sender);
        _;
    }

    modifier onlyIssuer() {
        if (roles[msg.sender] != Roles.Issuer) revert NotIssuer(msg.sender);
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function assignIssuer(address _requester) public onlyOwner {
        require(_requester != address(0), "Invalid address");
        if (address(issuers[_requester]) == address(0)) {
            issuers[_requester] = new Issuer(_requester);
        }
        roles[_requester] = Roles.Issuer;
    }

    function updateDetails(
        address _requester,
        address _approver,
        bytes32 _currentVal,
        bytes32 _property,
        bytes32 _val
    ) public {
        issuers[_approver].addRequest(_requester, _property, _val, _currentVal);
        emit RequestSubmitted(_requester, _approver);
    }

    function updateRootHash(
        address _requester,
        string memory _rootHash
    ) public onlyIssuer {
        rootHash[_requester] = _rootHash;
        emit UpdatedInformationEvent(_requester, _rootHash);
    }
    function approveRequest(address _approver) public onlyIssuer {
        issuers[_approver].approveRequest();
    }
    function declineRequest(address _approver) public onlyIssuer {
        issuers[_approver].declineRequest();
    }
    function getRequestHistory(address _approver) public view returns (Issuer.Details[] memory) {
        return issuers[_approver].getRequestHistory();
    }
    function getRootHash(address _user) public view returns (string memory) {
        require(
            msg.sender == _user || roles[msg.sender] == Roles.Issuer,
            "Only owner or issuer can access"
        );
        return rootHash[_user];
    }
    function getRootHash() public view returns (string memory) {
        return getRootHash(msg.sender);
    }
    function getRole(address _address) public view returns (Roles) {
        return roles[_address];
    }
    
}

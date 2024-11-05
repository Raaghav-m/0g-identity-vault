// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

contract Issuer {
    address private issuer;

    struct Details {
        address requester;
        bytes32 property;
        bytes32 val;
        bytes32 currentVal;
    }

    Details[] private historyOfRequests;
    uint private startIndex; // Tracks the first element for FIFO.

    event UpdateApproved(address requester);

    constructor(address _issuer) {
        require(_issuer != address(0), "Invalid issuer address");
        issuer = _issuer;
    }

    function addRequest(
        address _requester,
        bytes32 _property,
        bytes32 _val,
        bytes32 _currentVal
    ) external {
        Details memory newRequest = Details({
            requester: _requester,
            property: _property,
            val: _val,
            currentVal: _currentVal
        });
        historyOfRequests.push(newRequest);
    }

    function approveRequest() external returns (bool) {
        require(
            historyOfRequests.length > startIndex,
            "No requests to approve"
        );

        emit UpdateApproved(historyOfRequests[startIndex].requester);

        startIndex++; // Move the start index forward to remove the first request.

        return true;
    }
    function declineRequest() external returns (bool) {
        startIndex++;
        return false;
    }

    function getRequestHistory() external view returns (Details[] memory) {
        uint size = historyOfRequests.length - startIndex;
        Details[] memory activeRequests = new Details[](size);

        for (uint i = 0; i < size; i++) {
            activeRequests[i] = historyOfRequests[startIndex + i];
        }
        return activeRequests;
    }
}

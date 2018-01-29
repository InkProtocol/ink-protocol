pragma solidity ^0.4.11;

import './MediatorMock.sol';

contract FailedMediatorMock is MediatorMock {
  function requestMediator(uint256 _transactionId, uint256 _transactionAmount, address _transactionOwner) external returns (bool) {
    _transactionId;
    _transactionOwner;
    _transactionAmount;
    return false;
  }
}

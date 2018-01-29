pragma solidity ^0.4.11;

import '../InkOwner.sol';

contract FailedInkOwnerMock is InkOwner {
  function authorizeTransaction(uint256 _id, address _buyer) external returns (bool) {
    return false;
  }
}

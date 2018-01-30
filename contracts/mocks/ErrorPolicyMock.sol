pragma solidity ^0.4.11;

import '../InkPolicy.sol';

contract ErrorPolicyMock is InkPolicy {
  function transactionExpiry() external pure returns (uint32) {
    revert();
    return 8 days;
  }

  function fulfillmentExpiry() external pure returns (uint32) {
    revert();
    return 7 days;
  }

  function escalationExpiry() external pure returns (uint32) {
    revert();
    return 6 days;
  }
}

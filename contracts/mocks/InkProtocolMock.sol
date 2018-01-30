pragma solidity ^0.4.11;

import '../InkProtocol.sol';

contract InkProtocolMock is InkProtocol {
  function InkProtocolMock() public {
    balances[msg.sender] = totalSupply_;
  }
}

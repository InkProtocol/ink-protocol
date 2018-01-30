pragma solidity ^0.4.11;

import '../InkOwner.sol';
import '../InkProtocol.sol';

contract OwnerMock is InkOwner {
  bool authorizeTransactionResponse;

  // Events emitted when callbacks are called.
  event AuthorizeTransactionCalled(
    uint256 transactionId,
    address buyer
  );

  function OwnerMock() public {
    authorizeTransactionResponse = true;
  }

  function setAuthorizeTransactionResponse(bool _response) external {
    authorizeTransactionResponse = _response;
  }

  function authorizeTransaction(uint256 _id, address _buyer) external returns (bool) {
    AuthorizeTransactionCalled({
      transactionId: _id,
      buyer: _buyer
    });
    return authorizeTransactionResponse;
  }

  // Proxy functions

  function proxyRevokeTransaction(address _ink, uint256 _id) external {
    InkProtocol(_ink).revokeTransaction(_id);
  }

  function proxyAcceptTransaction(address _ink, uint256 _id) external {
    InkProtocol(_ink).acceptTransaction(_id);
  }

  function proxyConfirmTransaction(address _ink, uint256 _id) external {
    InkProtocol(_ink).confirmTransaction(_id);
  }

  function proxyConfirmTransactionAfterExpiry(address _ink, uint256 _id) external {
    InkProtocol(_ink).confirmTransactionAfterExpiry(_id);
  }

  function proxyRefundTransaction(address _ink, uint256 _id) external {
    InkProtocol(_ink).refundTransaction(_id);
  }

  function proxyRefundTransactionAfterExpiry(address _ink, uint256 _id) external {
    InkProtocol(_ink).refundTransactionAfterExpiry(_id);
  }

  function proxyDisputeTransaction(address _ink, uint256 _id) external {
    InkProtocol(_ink).disputeTransaction(_id);
  }

  function proxyEscalateDisputeToMediator(address _ink, uint256 _id) external {
    InkProtocol(_ink).escalateDisputeToMediator(_id);
  }

  function proxySettleTransaction(address _ink, uint256 _id) external {
    InkProtocol(_ink).settleTransaction(_id);
  }

  function proxyRefundTransactionByMediator(address _ink, uint256 _id) external {
    InkProtocol(_ink).refundTransactionByMediator(_id);
  }

  function proxyConfirmTransactionByMediator(address _ink, uint256 _id) external {
    InkProtocol(_ink).confirmTransactionByMediator(_id);
  }

  function proxySettleTransactionByMediator(address _ink, uint256 _id, uint256 _buyerAmount, uint256 _sellerAmount) external {
    InkProtocol(_ink).settleTransactionByMediator(_id, _buyerAmount, _sellerAmount);
  }

  function proxyProvideTransactionFeedback(address _ink, uint256 _id, uint8 _rating, bytes32 _comment) external {
    InkProtocol(_ink).provideTransactionFeedback(_id, _rating, _comment);
  }
}

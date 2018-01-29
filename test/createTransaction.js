const $util = require("./util")
const InkProtocol = artifacts.require("./mocks/InkProtocolMock.sol")
const MediatorMock = artifacts.require("./mocks/MediatorMock.sol")
const PolicyMock = artifacts.require("./mocks/PolicyMock.sol")

contract("InkProtocol", (accounts) => {
  let protocol
  let buyer = accounts[1]
  let seller = accounts[2]
  let agent = accounts[3]
  let amount = 100
  let metadata = $util.metadataToHash({title: "Title"})

  beforeEach(async () => {
    protocol = await InkProtocol.new()
    mediator = await MediatorMock.new()
    policy = await PolicyMock.new()
  })

  describe("#createTransaction()", () => {
    it("fails when seller address is invalid")
    it("fails when seller and buyer are the same")
    it("fails when owner and buyer are the same")
    it("fails when owner and seller are the same")
    it("fails when amount is 0")
    it("fails when mediator is not specified but policy is")
    it("fails when the owner rejects the transaction")
    it("increments the global transaction ID for the next transaction")
    it("emits the TransactionInitiated event")
    it("transfers buyer's tokens to escrow", async () => {
        let xfer = await protocol.transfer(buyer, amount)
        let eventArgs = $util.eventFromTx(xfer, $util.events.Transfer).args

        // verify transfer results
        assert.equal(eventArgs.to, buyer)
        assert.equal(eventArgs.value, amount)

        let tx = await protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, 0, { from: buyer })

        eventArgs = $util.eventFromTx(tx, $util.events.TransactionInitiated).args
        assert.equal(eventArgs.buyer, buyer)
        assert.equal(eventArgs.seller, seller)

        assert.equal(await $util.getBalance(protocol.address, protocol), amount)
    })

    describe("when mediator is specified", () => {
      it("fails when policy is not specified")
      it("fails when mediator rejects the transaction")
      it("passes the transaction's id, amount, and owner the mediator")
      it("emits the TransactionInitiated event with mediator and policy")
    })

    describe("when owner is specified", () => {
      it("passes the transaction's id and buyer to the owner")
      it("emits the TransactionInitiated event with owner")
    })
  })
})

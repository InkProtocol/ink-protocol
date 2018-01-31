const $util = require("./util")
const InkProtocol = artifacts.require("./mocks/InkProtocolMock.sol")
const MediatorMock = artifacts.require("./mocks/MediatorMock.sol")
const OwnerMock = artifacts.require("./mocks/OwnerMock.sol")
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
    owner = await OwnerMock.new()
    policy = await PolicyMock.new()
  })

  describe("#createTransaction()", () => {
    it("fails when seller address is invalid", async () => {
      await protocol.transfer(buyer, amount)
      await $util.assertVMExceptionAsync(protocol.createTransaction(0, amount, metadata, policy.address, mediator.address, 0, { from: buyer }))
    })

    it("fails when seller and buyer are the same", async () => {
      await protocol.transfer(buyer, amount)
      await $util.assertVMExceptionAsync(protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, 0, { from: seller }))
    })

    it("fails when owner and buyer are the same", async () => {
      await protocol.transfer(buyer, amount)
      await $util.assertVMExceptionAsync(protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, buyer, { from: buyer }))
    })

    it("fails when owner and seller are the same", async () => {
      await protocol.transfer(buyer, amount)
      await $util.assertVMExceptionAsync(protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, seller, { from: buyer }))
    })

    it("fails when amount is 0", async () => {
      await protocol.transfer(buyer, amount)
      await $util.assertVMExceptionAsync(protocol.createTransaction(seller, 0, metadata, policy.address, mediator.address, 0, { from: buyer }))
    })

    it("fails when mediator is not specified but policy is", async () => {
      await protocol.transfer(buyer, amount)
      await $util.assertVMExceptionAsync(protocol.createTransaction(seller, amount, metadata, policy.address, 0, 0, { from: buyer }))
    })

    it("fails when policy is not specified but mediator is", async () => {
      await protocol.transfer(buyer, amount)
      await $util.assertVMExceptionAsync(protocol.createTransaction(seller, amount, metadata, 0, mediator.address, 0, { from: buyer }))
    })

    it("increments the global transaction ID for the next transaction", async () => {
      let xfer = await protocol.transfer(buyer, amount * 2)
      let tx0 = await protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, 0, { from: buyer })
      let tx1 = await protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, 0, { from: buyer })
      let eventArgs0 = $util.eventFromTx(tx0, $util.events.TransactionInitiated).args
      let eventArgs1 = $util.eventFromTx(tx1, $util.events.TransactionInitiated).args
      assert.equal(eventArgs0.id.toNumber(), 0)
      assert.equal(eventArgs1.id.toNumber(), 1)
    })

    it("emits the TransactionInitiated event", async () => {
      let xfer = await protocol.transfer(buyer, amount)
      let tx = await protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, 0, { from: buyer })
      let eventArgs = $util.eventFromTx(tx, $util.events.TransactionInitiated).args
      assert.equal(eventArgs.id.toNumber(), 0)
      assert.equal(eventArgs.owner, 0)
      assert.equal(eventArgs.buyer, buyer)
      assert.equal(eventArgs.seller, seller)
      assert.equal(eventArgs.amount, amount)
      assert.equal(eventArgs.policy, policy.address)
      assert.equal(eventArgs.mediator, mediator.address)
      assert.equal(eventArgs.metadata, metadata)
    })

    it("transfers buyer's tokens to escrow", async () => {
      let xfer = await protocol.transfer(buyer, amount)
      let eventArgs = $util.eventFromTx(xfer, $util.events.Transfer).args

      let tx = await protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, 0, { from: buyer })

      eventArgs = $util.eventFromTx(tx, $util.events.TransactionInitiated).args
      assert.equal(await $util.getBalance(protocol.address, protocol), amount)
    })

    describe("when mediator is specified", () => {
      it("fails when policy is not specified", async () => {
        let policyAddress = 0;
        await protocol.transfer(buyer, amount)

        await $util.assertVMExceptionAsync(protocol.createTransaction(seller, amount, metadata, policyAddress, mediator.address, 0, { from: buyer }))
      })

      it("fails when mediator rejects the transaction", async () => {
        let xfer = await protocol.transfer(buyer, amount)

        await mediator.setRequestMediatorResponse(false)
        await $util.assertVMExceptionAsync(protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, 0, { from: buyer }))
      })

      it("passes the transaction's id, amount, and owner to the mediator", async () => {
        let xfer = await protocol.transfer(buyer, amount)
        let tx = await protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, 0, { from: buyer })
        let events = await $util.eventsFromContract(mediator, "RequestMediatorCalled", { id: 0, amount: amount, owner: 0 })

        assert.equal(events.length, 1)
      })

      it("emits the TransactionInitiated event with mediator and policy", async () => {
        let xfer = await protocol.transfer(buyer, amount)
        let tx = await protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, 0, { from: buyer })
        let eventArgs = $util.eventFromTx(tx, $util.events.TransactionInitiated).args

        assert.equal(eventArgs.policy, policy.address)
        assert.equal(eventArgs.mediator, mediator.address)
      })
    })

    describe("when owner is specified", () => {
      it("passes the transaction's id and buyer to the owner", async () => {
        let xfer = await protocol.transfer(buyer, amount)
        let tx = await protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, owner.address, { from: buyer })
        let events = await $util.eventsFromContract(owner, "AuthorizeTransactionCalled", { id: 0, buyer: 0 })

        assert.equal(events.length, 1)
      })

      it("emits the TransactionInitiated event with owner", async () => {
        let xfer = await protocol.transfer(buyer, amount)
        let tx = await protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, owner.address, { from: buyer })
        let eventArgs = $util.eventFromTx(tx, $util.events.TransactionInitiated).args

        assert.equal(eventArgs.owner, owner.address)
      })

      it("fails when the owner rejects the transaction", async () => {
        let xfer = await protocol.transfer(buyer, amount)

        await owner.setAuthorizeTransactionResponse(false)
        await $util.assertVMExceptionAsync(protocol.createTransaction(seller, amount, metadata, policy.address, mediator.address, owner.address, { from: buyer }))
      })
    })
  })
})

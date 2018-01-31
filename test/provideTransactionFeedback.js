const $util = require("./util")
const InkProtocol = artifacts.require("./mocks/InkProtocolMock.sol")

contract("InkProtocol", (accounts) => {
  let buyer = accounts[1]
  let seller = accounts[2]
  let unknown = accounts[accounts.length - 1]
  let amount = 100
  let rating = 5
  let comment = $util.metadataToHash({ comment: "comment" })

  describe("#provideTransactionFeedback()", () => {
    it("fails for seller", async () => {
      let {
        protocol,
        transaction
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Confirmed
      })

      await $util.assertVMExceptionAsync(protocol.provideTransactionFeedback(transaction.id, rating, comment, { from: seller }))
    })

    it("fails for owner", async () => {
      let {
        protocol,
        transaction,
        owner
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Confirmed,
        owner: true
      })

      await $util.assertVMExceptionAsync(owner.proxyProvideTransactionFeedback(protocol.address, transaction.id, rating, comment))
    })

    it("fails for mediator", async () => {
      let {
        protocol,
        transaction,
        mediator
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Confirmed
      })

      await $util.assertVMExceptionAsync(mediator.proxyProvideTransactionFeedback(protocol.address, transaction.id, rating, comment))
    })

    it("fails for policy", async () => {
      let {
        protocol,
        transaction,
        policy
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Confirmed
      })

      await $util.assertVMExceptionAsync(policy.proxyProvideTransactionFeedback(protocol.address, transaction.id, rating, comment))
    })

    it("fails for unknown address", async () => {
      let {
        protocol,
        transaction,
        policy
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Confirmed
      })

      await $util.assertVMExceptionAsync(protocol.provideTransactionFeedback(transaction.id, rating, comment, { from: unknown }))
    })

    it("fails when transaction does not exist", async () => {
      let protocol = await InkProtocol.new()

      await $util.assertVMExceptionAsync(protocol.provideTransactionFeedback(0, rating, comment))
    })

    it("fails when transaction state is Revoked", async () => {
      let {
        protocol,
        transaction
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Revoked
      })

      await $util.assertVMExceptionAsync(protocol.provideTransactionFeedback(transaction.id, rating, comment, { from: buyer }))
    })

    it("fails when transaction state is Accepted", async () => {
      let {
        protocol,
        transaction
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Accepted
      })

      await $util.assertVMExceptionAsync(protocol.provideTransactionFeedback(transaction.id, rating, comment, { from: buyer }))
    })

    it("fails when transaction state is Disputed", async () => {
      let {
        protocol,
        transaction
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Disputed
      })

      await $util.assertVMExceptionAsync(protocol.provideTransactionFeedback(transaction.id, rating, comment, { from: buyer }))
    })

    it("fails when transaction state is Escalated", async () => {
      let {
        protocol,
        transaction
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Escalated
      })

      await $util.assertVMExceptionAsync(protocol.provideTransactionFeedback(transaction.id, rating, comment, { from: buyer }))
    })

    it("fails when rating is invalid", async () => {
      let {
        protocol,
        transaction
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Confirmed
      })

      let invalidRating = 6
      await $util.assertVMExceptionAsync(protocol.provideTransactionFeedback(transaction.id, invalidRating, comment, { from: buyer }))
    })

    it("emits the FeedbackUpdated event", async () => {
      let {
        protocol,
        transaction
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Confirmed
      })

      let tx = await protocol.provideTransactionFeedback(transaction.id, rating, comment, { from: buyer })
      let eventArgs = await $util.eventFromTx(tx, $util.events.FeedbackUpdated).args

      assert.equal(eventArgs.transactionId, transaction.id)
      assert.equal(eventArgs.rating, rating)
      assert.equal(eventArgs.comment, comment)
    })

    it("allows multiple calls", async () => {
      let {
        protocol,
        transaction
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Confirmed
      })

      let tx = await protocol.provideTransactionFeedback(transaction.id, rating, comment, { from: buyer })
      let eventArgs = $util.eventFromTx(tx, $util.events.FeedbackUpdated).args

      assert.equal(eventArgs.transactionId, transaction.id)
      assert.equal(eventArgs.rating, rating)
      assert.equal(eventArgs.comment, comment)

      let comment2 = $util.metadataToHash({ comment: "comment2" })
      let tx2 = await protocol.provideTransactionFeedback(transaction.id, rating, comment2, { from: buyer })
      eventArgs = $util.eventFromTx(tx2, $util.events.FeedbackUpdated).args

      assert.equal(eventArgs.transactionId, transaction.id)
      assert.equal(eventArgs.rating, rating)
      assert.equal(eventArgs.comment, comment2)
    })
  })
})

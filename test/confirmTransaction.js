const $util = require("./util")
const InkProtocol = artifacts.require("./mocks/InkProtocolMock.sol")

contract("InkProtocol", (accounts) => {
  beforeEach(async () => {
    buyer = accounts[1]
    seller = accounts[2]
    unknown = accounts[accounts.length - 1]
    amount = 100
  })

  describe("#confirmTransaction()", () => {
    it("fails for seller", async () => {
      let { protocol, transaction } = await $util.buildTransaction(
        buyer, seller, { finalState: $util.states.Accepted }
      )

      await $util.assertVMExceptionAsync(protocol.confirmTransaction(transaction.id, { from: seller }))
    })

    it("fails for owner", async () => {
      let { protocol, transaction, owner } = await $util.buildTransaction(
        buyer, seller, { finalState: $util.states.Accepted, owner: true }
      )

      await $util.assertVMExceptionAsync(owner.proxyConfirmTransaction(protocol.address, transaction.id))
    })

    it("fails for mediator", async () => {
      let { protocol, transaction, mediator } = await $util.buildTransaction(
        buyer, seller, { finalState: $util.states.Accepted }
      )

      await $util.assertVMExceptionAsync(mediator.proxyConfirmTransaction(protocol.address, transaction.id))
    })

    it("fails for policy", async () => {
      let { protocol, transaction, policy } = await $util.buildTransaction(
        buyer, seller, { finalState: $util.states.Accepted }
      )

      await $util.assertVMExceptionAsync(policy.proxyConfirmTransaction(protocol.address, transaction.id))
    })

    it("fails for unknown address", async () => {
      let { protocol, transaction } = await $util.buildTransaction(
        buyer, seller, { finalState: $util.states.Accepted }
      )

      await $util.assertVMExceptionAsync(protocol.confirmTransaction(transaction.id, { from: unknown }))
    })

    it("fails when transaction does not exist", async () => {
      let { protocol, transaction } = await $util.buildTransaction(
        buyer, seller, { finalState: $util.states.Accepted }
      )

      await $util.assertVMExceptionAsync(protocol.confirmTransaction(0, { from: seller }))
    })

    describe("when state is Accepted", () => {
      it("passes the transaction's amount to the mediator", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Accepted, amount: amount }
        )

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })
        let events = await $util.filterGetSync(mediator.ConfirmTransactionFeeCalled({ transactionAmount: amount }, { fromBlock: 0 }))
        assert.equal(events.length, 1)
      })

      it("transfers the mediator fee to the mediator", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Accepted }
        )
        let mediatorFee = 10
        await mediator.setConfirmTransactionFeeResponse(mediatorFee)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })

        assert.equal(await $util.getBalance(mediator.address, protocol), mediatorFee)
      })

      it("emits the TransactionConfirmed event", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Accepted }
        )
        let mediatorFee = 10
        await mediator.setConfirmTransactionFeeResponse(mediatorFee)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })

        eventArgs = $util.eventFromTx(tx, $util.events.TransactionConfirmed).args
        assert.equal(eventArgs.id.toNumber(), transaction.id)
        assert.equal(eventArgs.mediatorFee, mediatorFee)
      })

      it("transfers the tokens to the seller", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Accepted, amount: amount }
        )
        let mediatorFee = 10
        await mediator.setConfirmTransactionFeeResponse(mediatorFee)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })
        assert.equal(await $util.getBalance(seller, protocol), amount - mediatorFee)
      })

      it("collects 0 fee when mediator raises an error", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Accepted, amount: amount }
        )
        await mediator.setRaiseError(true)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })
        assert.equal(await $util.getBalance(seller, protocol), amount)

        eventArgs = $util.eventFromTx(tx, $util.events.TransactionConfirmed).args
        assert.equal(eventArgs.mediatorFee, 0)
      })

      it("collects 0 fee when mediator returns a fee higher than the transaction amount", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Accepted, amount: amount }
        )
        let mediatorFee = amount + 1
        await mediator.setConfirmTransactionFeeResponse(mediatorFee)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })
        assert.equal(await $util.getBalance(seller, protocol), amount)

        eventArgs = $util.eventFromTx(tx, $util.events.TransactionConfirmed).args
        assert.equal(eventArgs.mediatorFee, 0)
      })
    })

    describe("when state is Disputed", () => {
      it("passes the transaction's amount to the mediator", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Disputed }
        )

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })

        let events = await $util.filterGetSync(mediator.ConfirmTransactionAfterDisputeFeeCalled({ transactionAmount: amount }, { fromBlock: 0 }))
        assert.equal(events.length, 1)
      })

      it("transfers the mediator fee to the mediator", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Disputed }
        )
        let mediatorFee = 10
        await mediator.setConfirmTransactionAfterDisputeFeeResponse(mediatorFee)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })
        assert.equal(await $util.getBalance(mediator.address, protocol), mediatorFee)
      })

      it("emits the TransactionConfirmedAfterDispute event", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Disputed }
        )
        let mediatorFee = 10
        await mediator.setConfirmTransactionAfterDisputeFeeResponse(mediatorFee)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })

        eventArgs = $util.eventFromTx(tx, $util.events.TransactionConfirmedAfterDispute).args
        assert.equal(eventArgs.id.toNumber(), transaction.id)
        assert.equal(eventArgs.mediatorFee.toNumber(), mediatorFee)
      })

      it("transfers the tokens to the seller", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Disputed, amount: amount }
        )
        let mediatorFee = 10
        await mediator.setConfirmTransactionAfterDisputeFeeResponse(mediatorFee)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })
        assert.equal(await $util.getBalance(seller, protocol), amount - mediatorFee)
      })

      it("collects 0 fee when mediator raises an error", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Disputed, amount: amount }
        )
        await mediator.setRaiseError(true)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })
        assert.equal(await $util.getBalance(seller, protocol), amount)

        eventArgs = $util.eventFromTx(tx, $util.events.TransactionConfirmedAfterDispute).args
        assert.equal(eventArgs.mediatorFee, 0)
      })

      it("collects 0 fee when mediator returns a fee higher than the transaction amount", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Disputed, amount: amount }
        )
        let mediatorFee = amount + 1
        await mediator.setConfirmTransactionAfterDisputeFeeResponse(mediatorFee)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })
        assert.equal(await $util.getBalance(seller, protocol), amount)

        eventArgs = $util.eventFromTx(tx, $util.events.TransactionConfirmedAfterDispute).args
        assert.equal(eventArgs.mediatorFee, 0)
      })
    })

    xdescribe("when state is Escalated", () => {
      it("fails before mediation expiry", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Escalated, amount: amount }
        )
        let mediatorFee = amount + 1
        await mediator.setConfirmTransactionAfterDisputeFeeResponse(mediatorFee)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })
        assert.equal(await $util.getBalance(seller, protocol), amount)

        eventArgs = $util.eventFromTx(tx, $util.events.TransactionConfirmedAfterDispute).args
        assert.equal(eventArgs.mediatorFee, 0)
      })
      it("calls the mediator for the mediation expiry")
      it("sets mediation expiry to 0 when mediator raises an error")
      it("passes the transaction's amount to the mediator", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Escalated, amount: amount }
        )
        let mediatorFee = 10
        await mediator.setConfirmTransactionAfterDisputeFeeResponse(mediatorFee)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })

        assert.equal(await $util.getBalance(mediator.address, protocol), mediatorFee)
      })
      it("transfers the mediator fee to the mediator")
      it("emits the TransactionConfirmedAfterEscalation event", async () => {
        let { protocol, transaction, mediator } = await $util.buildTransaction(
          buyer, seller, { finalState: $util.states.Escalated, amount: amount }
        )
        let mediatorFee = 10
        await mediator.setConfirmTransactionAfterDisputeFeeResponse(mediatorFee)

        let tx = await protocol.confirmTransaction(transaction.id, { from: buyer })

        eventArgs = $util.eventFromTx(tx, $util.events.TransactionConfirmedAfterEscalation).args
        assert.equal(eventArgs.id.toNumber(), transaction.id)
        assert.equal(eventArgs.mediatorFee.toNumber(), mediatorFee)
      })
      it("transfers the tokens to the seller")
      it("collects 0 fee when mediator raises an error")
      it("collects 0 fee when mediator returns a fee higher than the transaction amount")
    })
  })
})

const $util = require("./util")
const InkProtocol = artifacts.require("./mocks/InkProtocolMock.sol")

contract("InkProtocol", (accounts) => {
  let buyer = accounts[1]
  let seller = accounts[2]
  let unknown = accounts[accounts.length - 1]

  describe("#settleTransaction()", () => {
    it("fails for owner", async () => {
      let {
        mediator,
        protocol,
        transaction,
        owner
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Escalated,
        owner: true
      })
      mediationExpiry = await mediator.getMediationExpiry()
      $util.advanceTime(mediationExpiry.toNumber())

      await $util.assertVMExceptionAsync(owner.proxySettleTransaction(protocol.address, transaction.id))
    })

    it("fails for mediator", async () => {
      let {
        protocol,
        transaction,
        mediator
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Escalated
      })
      mediationExpiry = await mediator.getMediationExpiry()
      $util.advanceTime(mediationExpiry.toNumber())

      await $util.assertVMExceptionAsync(mediator.proxySettleTransaction(protocol.address, transaction.id))
    })

    it("fails for policy", async () => {
      let {
        mediator,
        protocol,
        transaction,
        policy
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Escalated
      })
      mediationExpiry = await mediator.getMediationExpiry()
      $util.advanceTime(mediationExpiry.toNumber())

      await $util.assertVMExceptionAsync(policy.proxySettleTransaction(protocol.address, transaction.id))
    })

    it("fails for unknown address", async () => {
      let {
        mediator,
        protocol,
        transaction
      } = await $util.buildTransaction(buyer, seller, {
        finalState: $util.states.Escalated
      })
      mediationExpiry = await mediator.getMediationExpiry()
      $util.advanceTime(mediationExpiry.toNumber())

      await $util.assertVMExceptionAsync(protocol.settleTransaction(transaction.id, { from: unknown }))
    })

    describe("when called by buyer", () => {
      it("fails before mediation expiry", async () => {
        let {
          protocol,
          transaction,
          mediator
        } = await $util.buildTransaction(buyer, seller, {
          finalState: $util.states.Escalated
        })

        mediationExpiry = await mediator.getMediationExpiry()
        $util.advanceTime(mediationExpiry.toNumber() - 60)

        await $util.assertVMExceptionAsync(protocol.settleTransaction(transaction.id, { from: buyer }))
      })

      it("calls the mediator for the mediation expiry", async () => {
        let {
          protocol,
          transaction,
          mediator
        } = await $util.buildTransaction(buyer, seller, {
          finalState: $util.states.Escalated
        })

        mediationExpiry = await mediator.getMediationExpiry()
        $util.advanceTime(mediationExpiry.toNumber())

        await protocol.settleTransaction(transaction.id, { from: buyer })
        let events = await $util.filterGetSync(mediator.MediationExpiryCalled({}, { fromBlock: 0 }))

        assert.equal(events.length, 1)
      })

      it("sets mediation expiry to 0 when mediator raises an error", async () => {
        let {
          protocol,
          transaction,
          mediator
        } = await $util.buildTransaction(buyer, seller, {
          finalState: $util.states.Escalated
        })

        mediationExpiry = await mediator.getMediationExpiry()
        $util.advanceTime(mediationExpiry.toNumber() - 60)

        await mediator.setRaiseError(true)

        let tx = await protocol.settleTransaction(transaction.id, { from: buyer })
        let events = $util.eventsFromTx(tx, $util.events.TransactionSettled)

        assert.equal(events.length, 1)
      })

      it("splits the transaction amount for buyer and seller", async () => {
        let amount = 100
        let {
          protocol,
          transaction,
          mediator
        } = await $util.buildTransaction(buyer, seller, {
          finalState: $util.states.Escalated,
          amount: amount
        })

        mediationExpiry = await mediator.getMediationExpiry()
        $util.advanceTime(mediationExpiry.toNumber())

        await protocol.settleTransaction(transaction.id, { from: buyer })

        assert.equal((await protocol.balanceOf.call(buyer)).toNumber(), 50)
        assert.equal((await protocol.balanceOf.call(seller)).toNumber(), 50)
      })

      it("gives the seller more when amount is not divisible by 2", async () => {
        let amount = 99
        let {
          protocol,
          transaction,
          mediator
        } = await $util.buildTransaction(buyer, seller, {
          finalState: $util.states.Escalated,
          amount: amount
        })

        mediationExpiry = await mediator.getMediationExpiry()
        $util.advanceTime(mediationExpiry.toNumber())

        await protocol.settleTransaction(transaction.id, { from: buyer })

        assert.equal((await protocol.balanceOf.call(buyer)).toNumber(), 49)
        assert.equal((await protocol.balanceOf.call(seller)).toNumber(), 50)
      })

      it("emits the TransactionSettled event", async () => {
        let {
          protocol,
          transaction,
          mediator
        } = await $util.buildTransaction(buyer, seller, {
          finalState: $util.states.Escalated
        })

        mediationExpiry = await mediator.getMediationExpiry()
        $util.advanceTime(mediationExpiry.toNumber())

        let tx = await protocol.settleTransaction(transaction.id, { from: buyer })
        let eventArgs = $util.eventFromTx(tx, $util.events.TransactionSettled).args

        let buyerAmount = Math.floor(transaction.amount / 2)
        let sellerAmount = transaction.amount - buyerAmount

        assert.equal(eventArgs.id, transaction.id)
        assert.equal(eventArgs.buyerAmount, buyerAmount)
        assert.equal(eventArgs.sellerAmount, sellerAmount)
      })
    })

    describe("when called by seller", () => {
      it("fails before mediation expiry", async () => {
        let {
          protocol,
          transaction,
          mediator
        } = await $util.buildTransaction(buyer, seller, {
          finalState: $util.states.Escalated
        })

        mediationExpiry = await mediator.getMediationExpiry()
        $util.advanceTime(mediationExpiry.toNumber() - 60)

        await $util.assertVMExceptionAsync(protocol.settleTransaction(transaction.id, { from: seller }))
      })

      it("calls the mediator for the mediation expiry", async () => {
        let {
          protocol,
          transaction,
          mediator
        } = await $util.buildTransaction(buyer, seller, {
          finalState: $util.states.Escalated
        })

        mediationExpiry = await mediator.getMediationExpiry()
        $util.advanceTime(mediationExpiry.toNumber())

        await protocol.settleTransaction(transaction.id, { from: seller })
        let events = await $util.filterGetSync(mediator.MediationExpiryCalled({}, { fromBlock: 0 }))

        assert.equal(events.length, 1)
      })

      it("sets mediation expiry to 0 when mediator raises an error", async () => {
        let {
          protocol,
          transaction,
          mediator
        } = await $util.buildTransaction(buyer, seller, {
          finalState: $util.states.Escalated
        })

        mediationExpiry = await mediator.getMediationExpiry()
        $util.advanceTime(mediationExpiry.toNumber() - 60)

        await mediator.setRaiseError(true)

        let tx = await protocol.settleTransaction(transaction.id, { from: seller })
        let events = $util.eventsFromTx(tx, $util.events.TransactionSettled)

        assert.equal(events.length, 1)
      })

      it("splits the transaction amount for buyer and seller", async () => {
        let amount = 100
        let {
          protocol,
          transaction,
          mediator
        } = await $util.buildTransaction(buyer, seller, {
          finalState: $util.states.Escalated,
          amount: amount
        })

        mediationExpiry = await mediator.getMediationExpiry()
        $util.advanceTime(mediationExpiry.toNumber())

        await protocol.settleTransaction(transaction.id, { from: seller })

        assert.equal((await protocol.balanceOf.call(buyer)).toNumber(), 50)
        assert.equal((await protocol.balanceOf.call(seller)).toNumber(), 50)
      })

      it("gives the seller more when amount is not divisible by 2", async () => {
        let amount = 99
        let {
          protocol,
          transaction,
          mediator
        } = await $util.buildTransaction(buyer, seller, {
          finalState: $util.states.Escalated,
          amount: amount
        })

        mediationExpiry = await mediator.getMediationExpiry()
        $util.advanceTime(mediationExpiry.toNumber())

        await protocol.settleTransaction(transaction.id, { from: seller })

        assert.equal((await protocol.balanceOf.call(buyer)).toNumber(), 49)
        assert.equal((await protocol.balanceOf.call(seller)).toNumber(), 50)
      })

      it("emits the TransactionSettled event", async () => {
        let {
          protocol,
          transaction,
          mediator
        } = await $util.buildTransaction(buyer, seller, {
          finalState: $util.states.Escalated
        })

        mediationExpiry = await mediator.getMediationExpiry()
        $util.advanceTime(mediationExpiry.toNumber())

        let tx = await protocol.settleTransaction(transaction.id, { from: seller })
        let eventArgs = $util.eventFromTx(tx, $util.events.TransactionSettled).args

        let buyerAmount = Math.floor(transaction.amount / 2)
        let sellerAmount = transaction.amount - buyerAmount

        assert.equal(eventArgs.id, transaction.id)
        assert.equal(eventArgs.buyerAmount, buyerAmount)
        assert.equal(eventArgs.sellerAmount, sellerAmount)
      })
    })
  })
})

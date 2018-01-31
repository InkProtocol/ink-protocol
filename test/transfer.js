const $util = require("./util")
const InkProtocol = artifacts.require("./mocks/InkProtocolMock.sol")

contract("InkProtocol", (accounts) => {
  let protocol

  beforeEach(async () => {
    protocol = await InkProtocol.new()
  })

  describe("#transfer()", () => {
    it("fails when sending token to the protocol", async () => {
      await $util.assertVMExceptionAsync(protocol.transfer(protocol.address, 1))
    })

    it("succeeds when sending token to another address", async () => {
      let sender = accounts[1]
      let recipient = accounts[2]
      let amount = 10;

      await protocol.transfer(sender, 20)
      let senderBalance = await $util.getBalance(sender, protocol)

      await protocol.transfer(recipient, amount, { from: sender })

      assert.equal(await $util.getBalance(sender, protocol), senderBalance - amount)
      assert.equal(await $util.getBalance(recipient, protocol), amount)
    })
  })
})

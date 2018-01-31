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
      let recipient = accounts[1]
      let amount = 1

      await protocol.transfer(recipient, amount)

      assert.equal((await protocol.balanceOf.call(recipient)).toNumber(), amount)
    })
  })
})

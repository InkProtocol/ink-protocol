const $util = require("./util")
const InkProtocol = artifacts.require("./mocks/InkProtocolMock.sol")

contract("InkProtocol", (accounts) => {
  beforeEach(async () => {
    protocol = await InkProtocol.new()
  })

  describe("#transfer()", () => {
    it("fails when sending token to the protocol", async () => {
      await $util.assertVMExceptionAsync(protocol.transfer(protocol.address, 1))
    })

    it("succeeds when sending token to another address", async () => {
      let receiver = accounts[1]
      let amount = 1

      protocol.transfer(receiver, amount)

      assert.equal((await protocol.balanceOf.call(receiver)).toNumber(), amount)
    })
  })
})

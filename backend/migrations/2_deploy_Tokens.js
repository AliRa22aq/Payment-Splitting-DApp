const PS = artifacts.require("PaymentSplitter")


const addresses = ["0x44591dE76deb8772a38E845644C5065b47201F11", "0x831dD92d9b2AAAdfFecD7a7709011C8380aBe99E", "0x1f2827a622cDc9Ac37966D9296b9ee8eDE8CeDda"]
const shares = [10,000, 5000, 3000] 

module.exports = async function (deployer, network, accounts) {
  // Deploy MyToken
  await deployer.deploy(PS, addresses, shares)  
}

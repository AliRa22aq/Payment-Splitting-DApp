import './App.css';
import React, { useEffect, useState } from "react"
import Web3 from "web3";
import { ERC20Basic as ERC20BasicType } from '../types/web3-v1-contracts/ERC20Basic'
import { PaymentSplitter as PSType } from '../types/web3-v1-contracts/PaymentSplitter';
const ERC20ABI = require("./abis/ERC20Basic.json");
const PSABI = require("./abis/PaymentSplitter.json");


interface TokenHolders{
  address: string | null,
  TokenBalance: number,
  EthBalance: number
}
interface DataType {
  userAddress: string,
  tokenHolders: TokenHolders[] | null,
  holdersAddress: string[] | null,
  ERCToken: ERC20BasicType | null,
  PSContract: PSType | null,
  PSAddress: string | null,
  totalshares: number,
  totalBalance: number
  loading: boolean
//   approvedTokens: number,
//   userBalance: { ethers: number, tokens: number }
//   dexBalance: { ethers: number, tokens: number },
//   updateBalance: boolean
}

function App() {

  const [data, setData] = useState<DataType>({
    userAddress: "",
    tokenHolders: null,
    holdersAddress: null,
    ERCToken: null,
    PSContract: null,
    PSAddress: null,
    totalshares: 0,
    totalBalance: 0,
    loading: false,
    // approvedTokens: 0,
    // userBalance: { ethers: 0, tokens: 0 },
    // dexBalance: { ethers: 0, tokens: 0 },
    // updateBalance: false
  });

  window.ethereum.on('accountsChanged', function (accounts: string[]) {
    setData(pre => { return { ...pre, userAddress: accounts[0] } })
  })


  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      console.log(window.web3.currentProvider.isMetaMask)

      // Get current logged in user address
      const accounts = await window.web3.eth.getAccounts()
      setData(pre => { return { ...pre, userAddress: accounts[0] } })
      console.log(accounts[0])

    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  };

  const loadBlockchainData = async () => {

    setData(pre => { return { ...pre, loading: true } })

    // setData(pre => { return { ...pre, loading: true } })
    const web3 = new Web3(window.ethereum);

    const PSAddress= "0x7c593E3E45bBE11F0FFE03cfbC1919b29f03e693"

    // setData(pre => { return { ...pre, DEXContractAddress: DEXData.address } })

    // Load Contract PSData
    const PSContract = (new web3.eth.Contract(PSABI.abi, PSAddress) as any) as PSType;
    console.log(PSContract)
    setData(pre => { return { ...pre, PSContract, PSAddress } })

    const accounts = await window.web3.eth.getAccounts()

    const TOKENinPS = await PSContract.methods.token().call()
    console.log(" Token address in PS ", TOKENinPS)

    const ERCToken = (new web3.eth.Contract(ERC20ABI.abi, TOKENinPS) as any) as ERC20BasicType;
    console.log(ERCToken)
    
    setData(pre => { return { ...pre, ERCToken } })
    
    
    //Token Holders
    const holdersAddress = await PSContract.methods.allPayees().call()
    console.log(holdersAddress)

    setData(pre => { return { ...pre, holdersAddress: holdersAddress } })      

    //Total Balance in contract
    let totalBalance = await PSContract.methods.totalAmountAvailable().call()
    totalBalance = web3.utils.fromWei(totalBalance.toString(), "ether")

    setData(pre => { return { ...pre, totalBalance: Number(totalBalance) } })

    //Total shares
    let totalshares = await PSContract.methods.totalShares().call()

    console.log(totalshares)
    setData(pre => { return { ...pre, totalshares: Number(totalshares) } })
    

    getBalance()

    setData(pre => { return { ...pre, loading: false } })

  };



  const getBalance = async () => {
      //Token Holders
      const tokenHolders = await data.PSContract?.methods.allPayees().call()
      console.log(tokenHolders)

      const holders:TokenHolders[]= [];

      
      const checkTokenBalance = async (address: string) => {
        const web3 = new Web3(window.ethereum);
        let userbalance = await data.PSContract?.methods.shares(address).call();
        return userbalance
      }
      const checkEthBalance  = async (address: string) => {
        const web3 = new Web3(window.ethereum);
        let userbalance = await web3.eth.getBalance(address);
        userbalance = await web3.utils.fromWei(userbalance.toString(), "ether")
        return userbalance
      }

      tokenHolders?.map(async (holder) => {
        const tokenBalance = await checkTokenBalance(holder)
        const ethBalance = await checkEthBalance(holder)

        holders.push({
          address: holder, 
          TokenBalance: Number(tokenBalance),
          EthBalance: Number(ethBalance)
        })
 
    setData(pre => { return { ...pre, tokenHolders: holders } })      

 })
  }
  
  const distribute = async () => {
    await data.PSContract?.methods.distribute().send({from: data.userAddress})
    .on("confirmation", (receipt) => {
      console.log(receipt)
      loadBlockchainData()
    })
  }

  useEffect(() => {
    loadWeb3()
  }, [])

  // useEffect(() => {
  //   updateAllBalance()
  // }, [data.updateBalance])


  useEffect(() => {
    if (data.userAddress) {
      loadBlockchainData()
    }
  }, [data.userAddress])


  return (
    <div className="App">
      <h2> Payment Spliter </h2>
      <br />

      {
        !data.userAddress ?
          // <div>You are login with Address: {data.userAddress}</div> :
          <>
            <div>Please Signin to Metamask</div>
            <br />
            <button onClick={() => loadWeb3()}> Connect </button>
            <br />
            <br />
          </> : null
      }


      <div> Payment spliter Contract address : {data.PSAddress} </div>
      <h3> total shares distributed: {data.totalshares} </h3>
      <h3> total Balance availbe for distribution: {data.totalBalance} Ethers </h3>
      <button onClick={distribute}> distribute </button>


      


      <br />
      <div>
            <h3> ALI Token Holders</h3>

      </div>


      {
        <div>
        {
        data.tokenHolders ?
        data.tokenHolders.map((holder) => {
            if(holder){
              return (
                <h3> {holder.address} | {holder.TokenBalance/ data.totalshares * 100}% ALIs | {holder.EthBalance} Ethers </h3> 
              )
            }
          }) :
          data.holdersAddress?.map((holder) => {
            if(holder){
              return (
                <h3> {holder}  </h3> 
              )
            }
          }) 
          }


        <button onClick={getBalance}>Get Balances</button>
      </div>
      }


    </div>
  );
}

export default App;

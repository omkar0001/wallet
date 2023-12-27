import React from 'react'
import AAVEManager from '../managers/aave_manager'
import WalletManager from '../managers/wallet_manager'
import { getProvider } from '../utils'
import PaymentComponent from "../components/Payment";


const MainComponent = ({ route }) => {
  async function repay(amount: number) {
    let contractAddress = route.params.contractAddress
    const signer = WalletManager.loadWalletFromPrivateKey(route.params.privateKey, getProvider())
    const aaveManager = new AAVEManager(signer)
    await aaveManager.repay(contractAddress, amount)
  }
  return <PaymentComponent buttonLabel={"Repay"} paymentCallback={repay}/>
}

export default MainComponent

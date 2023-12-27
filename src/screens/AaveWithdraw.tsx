import React from 'react'
import AAVEManager from '../managers/aave_manager'
import WalletManager from '../managers/wallet_manager'
import { getProvider } from '../utils'
import PaymentComponent from "../components/Payment";


const MainComponent = ({ route }) => {
  async function withdraw(amount: number) {
    const signer = WalletManager.loadWalletFromPrivateKey(route.params.privateKey, getProvider())
    const aaveManager = new AAVEManager(signer)
    await aaveManager.withdraw(amount)
  }
  return <PaymentComponent buttonLabel={"Withdraw"} paymentCallback={withdraw}/>
}

export default MainComponent

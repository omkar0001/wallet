import React from 'react'
import AAVEManager from '../managers/aave_manager'
import WalletManager from '../managers/wallet_manager'
import { getProvider } from '../utils'
import PaymentComponent from "../components/Payment";


const MainComponent = ({ route }) => {
  async function borrow(amount: number) {
    const signer = WalletManager.loadWalletFromPrivateKey(route.params.privateKey, getProvider())
    const aaveManager = new AAVEManager(signer)
    await aaveManager.borrow(route.params.contractAddress, amount)
  }
  return <PaymentComponent buttonLabel={"Borrow"} paymentCallback={borrow}/>
}

export default MainComponent

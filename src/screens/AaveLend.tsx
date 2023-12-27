import React from 'react'
import AAVEManager from '../managers/aave_manager'
import WalletManager from '../managers/wallet_manager'
import { getProvider } from '../utils'
import PaymentComponent from '../components/Payment'


const MainComponent = ({ route }) => {
  async function deposit(amount: number) {
    const signer = WalletManager.loadWalletFromPrivateKey(route.params.privateKey, getProvider())
    const aaveManager = new AAVEManager(signer)
    await aaveManager.deposit(amount)
  }

  return <PaymentComponent buttonLabel={'Deposit'} paymentCallback={deposit}/>
}

export default MainComponent

import { ethers, Wallet } from 'ethers'
import Erc20Manager from './erc20_manager'
import { Provider } from '@ethersproject/abstract-provider'


export default class WalletManager {
  usdcContractAddress: string

  provider: Provider

  constructor(usdcContractAddress: string, provider: Provider) {
    this.usdcContractAddress = usdcContractAddress
    this.provider = provider
  }

  static loadWalletFromMnemonic(mnemonic: string, provider?: Provider) {
    let wallet = Wallet.fromMnemonic(mnemonic)
    if (provider) {
      wallet.connect(provider)
    }
    return wallet
  }

  static loadWalletFromPrivateKey(privateKey: string, provider?: Provider) {
    return new ethers.Wallet(privateKey, provider)
  }

  async sendUSDC(privateKey: string, toAddress: string, amount: number) {
    const signer = new ethers.Wallet(privateKey, this.provider)
    const erc20Manager = new Erc20Manager(this.usdcContractAddress, this.provider)
    return await erc20Manager.transfer(signer, toAddress, amount)
  }

  async sendNativeToken(
    privateKey: string,
    toAddress: string,
    amount: string|number,
  ) {
    const wallet = new ethers.Wallet(privateKey)
    const walletSigner = wallet.connect(this.provider)
    const readableGasPrice = await this.provider.getGasPrice()
    const gasPrice = ethers.utils.hexlify(readableGasPrice)
    const nonce = await this.provider.getTransactionCount(wallet.address)
    const tx = {
      from: wallet.address,
      to: toAddress,
      value: ethers.utils.parseEther(amount.toString()),
      nonce: nonce + 1,
      gasLimit: ethers.utils.hexlify(100000), // 100000
      gasPrice: gasPrice,
    }
    let transaction = await walletSigner.sendTransaction(tx)
    await transaction.wait(1)
    return transaction
  }


  async getBalances(address: string) {
    async function _getNativeBalance(provider: Provider) {
      const balance = await provider.getBalance(address)
      const balanceInEth = ethers.utils.formatEther(balance)
      return balanceInEth
    }

    const usdcERC20Manager = new Erc20Manager(this.usdcContractAddress, this.provider)
    const usdcBalance = await usdcERC20Manager.balanceOf(address)
    const nativeBalance = await _getNativeBalance(this.provider)
    return {
      USDC: usdcBalance,
      MATIC: nativeBalance,
    }
  }
}

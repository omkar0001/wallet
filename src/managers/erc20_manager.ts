import { Wallet, ethers, Contract } from 'ethers'
import { getMaxGasFeeStats } from '../utils'
import { parseUnits } from 'ethers/lib/utils'
import { Provider } from '@ethersproject/abstract-provider'

export default class Erc20Manager {
    provider: Provider
    abi: string[]
    contractAddress: string
    erc20: Contract
    estimateTransactionPrice: {[k: string]: Function}

    constructor(contractAddress: string, provider: Provider) {
      this.abi = [
        // Read-Only Functions
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function approve(address spender, uint256 amount) public returns (bool success)',

        // Authenticated Functions
        'function transfer(address to, uint amount) returns (bool)',

        // Events
        'event Transfer(address indexed from, address indexed to, uint amount)',
      ]

      this.provider = provider
      this.erc20 = new ethers.Contract(contractAddress, this.abi, provider)
      this.contractAddress = contractAddress
      this.estimateTransactionPrice = {}
      this.estimateTransactionPrice.approve = this._prepareTransactionPriceEstimator('approve')
      this.estimateTransactionPrice.transfer = this._prepareTransactionPriceEstimator('transfer')
    }

    async balanceOf(address: string) {
      const balance = await this.erc20.balanceOf(address)
      const decimals = await this.decimals()
      return ethers.utils.formatUnits(balance, decimals)
    }

    async decimals() {
      return await this.erc20.decimals()
    }

    async symbol() {
      return this.erc20.symbol()
    }

    _prepareTransactionPriceEstimator(funcName: string) {
      const that = this
      return async function (...args) {
        args.push(true)
        const populatedTransaction = that[funcName]?.call(that, ...args)
        that.provider.estimateGas(populatedTransaction)
      }
    }

    async approve(...args: any[]) {
      return await this._approve(...args)
    }

    async transfer(...args: any[]) {
      args.push(false)
      return await this._transfer(...args)
    }

    async _approve(signer: Wallet, spender: string, amount: number, populateTransaction: boolean) {
      const erc20_rw = new ethers.Contract(this.contractAddress, this.abi, signer)
      const decimals = await this.decimals()
      if (!populateTransaction) {
        const maxGasFeeStats = await getMaxGasFeeStats()
        return await erc20_rw.approve(spender, parseUnits(amount.toString(), decimals), {
          maxFeePerGas: maxGasFeeStats.maxFeePerGas,
          maxPriorityFeePerGas: maxGasFeeStats.maxPriorityFeePerGas,
        })
      } else {
        return await erc20_rw.populateTransaction.approve(spender, parseUnits(amount.toString(), decimals))
      }
    }

    async _transfer(signer: Wallet, toAddress: string, amount: number, populateTransaction: boolean) {
      const erc20_rw = new ethers.Contract(this.contractAddress, this.abi, signer)
      if (!populateTransaction) {
        const maxGasFeeStats = await getMaxGasFeeStats()
        const maxFeePerGas = maxGasFeeStats.maxFeePerGas
        const maxPriorityFeePerGas = maxGasFeeStats.maxPriorityFeePerGas
        const transaction = await erc20_rw.transfer(toAddress, parseUnits(amount.toString(), 6), { maxFeePerGas, maxPriorityFeePerGas })
        transaction.wait(1)
        return transaction
      } else {
        return await erc20_rw.populateTransaction.transfer(toAddress, parseUnits(amount.toString(), 6))
      }
    }
}

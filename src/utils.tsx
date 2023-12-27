import { ethers } from 'ethers'
import axios from 'axios'

export const createWallet = () => {
  return ethers.Wallet.createRandom()
}

export const getProvider = () => {
  return new ethers.providers.JsonRpcProvider('https://ethereum.publicnode.com')
}

export const round = (number: number, numDigits: number) => {
  return (Math.round(number * Math.pow(10, numDigits))/Math.pow(10, numDigits))
}

export const getMaxGasFeeStats = async () => {
  const { data } = await axios({
    method: 'get',
    url: 'https://gasstation-mainnet.matic.network/v2',
  })
  const maxFeePerGas = ethers.utils.parseUnits(
    String(Math.ceil(data.fast.maxFee)),
    'gwei',
  )

  const maxPriorityFeePerGas = ethers.utils.parseUnits(
    String(Math.ceil(data.fast.maxPriorityFee)),
    'gwei',
  )
  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
  }
}

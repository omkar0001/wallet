import { ethers, Wallet } from 'ethers'
import { parseUnits, formatUnits } from 'ethers/lib/utils'
import { USDC_CONTRACT_ADDRESS } from '../constants'
import {getMaxGasFeeStats, getProvider} from '../utils'
import Erc20Manager from './erc20_manager'
import {
  UiPoolDataProvider,
  ChainId,
} from '@aave/contract-helpers'
import { formatReserves, formatUserSummary } from '@aave/math-utils'
import dayjs from 'dayjs'

export default class AAVEManager {
    signer: Wallet

    poolContractAddress: string

    aaveOracleContractAddress: string

    dataProviderContractAddress: string

    erc20ContractAddresses: {[k: string]: string}

    aaveOracleContractABI: string[]

    poolContractABI: string[]

    dataProviderContractABI: string[]

    estimateTransactionPrice: {[k:string]: Function}

    constructor(signer: Wallet) {
      this.signer = signer

      this.poolContractAddress = '0x794a61358D6845594F94dc1DB02A252b5b4814aD'
      this.aaveOracleContractAddress = '0xb023e699F5a33916Ea823A16485e259257cA8Bd1'
      this.dataProviderContractAddress = '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654'

      this.erc20ContractAddresses = {
        usdc: USDC_CONTRACT_ADDRESS,
      }

      this.poolContractABI = [
        'function getUserAccountData(address user) external view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
        'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
        'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
        'function withdraw(address asset, uint256 amount, address to)',
        'function repay(address asset, uint256 amount, uint256 rateMode, address onBehalfOf)',
      ]

      this.aaveOracleContractABI = [
        'function getAssetsPrices(address[] calldata assets) external view override returns (uint256[] memory)',
      ]

      this.dataProviderContractABI = [
        'function getReserveConfigurationData(address asset)\n' +
         '    external\n' +
         '    view\n' +
         '    returns (\n' +
         '      uint256 decimals,\n' +
         '      uint256 ltv,\n' +
         '      uint256 liquidationThreshold,\n' +
         '      uint256 liquidationBonus,\n' +
         '      uint256 reserveFactor,\n' +
         '      bool usageAsCollateralEnabled,\n' +
         '      bool borrowingEnabled,\n' +
         '      bool stableBorrowRateEnabled,\n' +
         '      bool isActive,\n' +
         '      bool isFrozen\n' +
         '    )',
      ]
      this.estimateTransactionPrice = {}
      this.estimateTransactionPrice.borrow = this._prepareTransactionPriceEstimator('borrow')
      this.estimateTransactionPrice.deposit = this._prepareTransactionPriceEstimator('deposit')
    }

    async _loadBorrowableAssetPrices(tokenAddresses: string[]) {
      const contract_rw = new ethers.Contract(this.aaveOracleContractAddress, this.aaveOracleContractABI, this.signer)
      return await contract_rw.getAssetsPrices(tokenAddresses)
    }

    _prepareTransactionPriceEstimator(funcName: string) {
      const estimatedGas: {[k: string]: number} = {
        borrow: 600 * 1000,
        deposit: 300 * 1000,
      }
      const that = this
      return async function(...args: any[]) {
        const feedData = await that.signer.getFeeData()
        const gasPrice = formatUnits(feedData.maxFeePerGas, 'gwei')
        const estimatedTransactionPrice = estimatedGas[funcName] * gasPrice
        return estimatedTransactionPrice
      }
    }

    async withdraw(amount: number) {
      const maxGasFeeStats = await getMaxGasFeeStats()
      const contract_rw = new ethers.Contract(this.poolContractAddress, this.poolContractABI, this.signer)
      const tokenERC20Manager = new Erc20Manager(this.erc20ContractAddresses.usdc, this.signer.provider)
      const t = await contract_rw.withdraw(this.erc20ContractAddresses.usdc, parseUnits(amount.toString(), await tokenERC20Manager.decimals()), this.signer.address, {
        maxFeePerGas: maxGasFeeStats.maxFeePerGas,
        maxPriorityFeePerGas: maxGasFeeStats.maxPriorityFeePerGas,
        gasLimit: 2000000,
      })
      t.wait()
      return t
    }

    async borrow(tokenContractAddress: string, amount: number) {
      const maxGasFeeStats = await getMaxGasFeeStats()
      const tokenERC20Manager = new Erc20Manager(tokenContractAddress, this.signer.provider)
      const contract_rw = new ethers.Contract(this.poolContractAddress, this.poolContractABI, this.signer)
      const t = await contract_rw.borrow(tokenContractAddress, parseUnits(amount.toString(), await tokenERC20Manager.decimals()), 2, 0, this.signer.address, {
        maxFeePerGas: maxGasFeeStats.maxFeePerGas,
        maxPriorityFeePerGas: maxGasFeeStats.maxPriorityFeePerGas,
        gasLimit: 2000000,
      })
      t.wait()
      return t
    }

    async repay(tokenContractAddress: string, amount: number) {
      const tokenERC20Manager = new Erc20Manager(this.erc20ContractAddresses.usdc, this.signer.provider)
      await tokenERC20Manager.approve(this.signer, this.poolContractAddress, amount)
      const contract_rw = new ethers.Contract(this.poolContractAddress, this.poolContractABI, this.signer)
      const maxGasFeeStats = await getMaxGasFeeStats()
      const nonce = await this.signer.getTransactionCount()
      const t = await contract_rw.repay(tokenContractAddress, parseUnits(amount.toString(), await tokenERC20Manager.decimals()), 2, this.signer.address, {
        maxFeePerGas: maxGasFeeStats.maxFeePerGas,
        maxPriorityFeePerGas: maxGasFeeStats.maxPriorityFeePerGas,
        gasLimit: 1000000,
        nonce: nonce+1,
      })
      t.wait()
      return t
    }

    async deposit(amount: number) {
      const tokenERC20Manager = new Erc20Manager(this.erc20ContractAddresses.usdc, this.signer.provider)
      await tokenERC20Manager.approve(this.signer, this.poolContractAddress, amount)
      const contract_rw = new ethers.Contract(this.poolContractAddress, this.poolContractABI, this.signer)
      const nonce = await this.signer.getTransactionCount()

      const maxGasFeeStats = await getMaxGasFeeStats()
      const t = await contract_rw.supply(this.erc20ContractAddresses.usdc, parseUnits(amount.toString(), await tokenERC20Manager.decimals()), this.signer.address, 0, {
        maxFeePerGas: maxGasFeeStats.maxFeePerGas,
        maxPriorityFeePerGas: maxGasFeeStats.maxPriorityFeePerGas,
        gasLimit: 1000000,
        nonce: nonce+1,
      })
      t.wait()
      return t
    }

    async getBorrowedAssets() {
      const userAccountData = await this.getUserAccountData()
      const borrowedAssets = userAccountData.userReservesData?.filter((x) => x?.totalBorrows !== '0')
      const result = borrowedAssets.map((x) => {
        return {
          symbol: x.reserve.symbol,
          address: x.reserve.underlyingAsset,
          marketReferenceCurrencyValue: parseFloat(x.totalBorrowsMarketReferenceCurrency),
          value: parseFloat(x.totalBorrows),
        }
      })
      return result
    }

    async getCollateralAssets() {
      const userAccountData = await this.getUserAccountData()
      return [{
        symbol: 'USDC',
        address: USDC_CONTRACT_ADDRESS,
        marketReferenceCurrencyValue: parseFloat(userAccountData.totalCollateralMarketReferenceCurrency),
        value: parseFloat(userAccountData.totalCollateralUSD),
      }]
    }

    async getUserAccountData() {
        const provider = getProvider()
        const network = await provider.getNetwork()
        const uiPoolDataProviderAddress = '0x91c0eA31b49B69Ea18607702c5d9aC360bf3dE7d'
        const lendingPoolAddressProvider = '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e'
        const poolDataProviderContract = new UiPoolDataProvider({
            uiPoolDataProviderAddress,
            provider,
            chainId: ChainId.mainnet,
        })
        const reserves = await poolDataProviderContract.getReservesHumanized({
            lendingPoolAddressProvider,
        })

        const userReserves = await poolDataProviderContract.getUserReservesHumanized({
            lendingPoolAddressProvider: lendingPoolAddressProvider,
            user: this.signer.address,
        })
        const reservesArray = reserves.reservesData
        const baseCurrencyData = reserves.baseCurrencyData
        const userReservesArray = userReserves.userReserves

        const currentTimestamp = dayjs().unix()

        const formattedPoolReserves = formatReserves({
            reserves: reservesArray,
            currentTimestamp,
            marketReferenceCurrencyDecimals:
            baseCurrencyData.marketReferenceCurrencyDecimals,
            marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
        })
        const userSummary = formatUserSummary({
            currentTimestamp,
            marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
            marketReferenceCurrencyDecimals:
            baseCurrencyData.marketReferenceCurrencyDecimals,
            userReserves: userReservesArray,
            formattedReserves: formattedPoolReserves,
            userEmodeCategoryId: userReserves.userEmodeCategoryId,
        })
        return userSummary
    }

    async getReserveConfigurationData(address: string) {
      const contract_rw = new ethers.Contract(this.dataProviderContractAddress, this.dataProviderContractABI, this.signer)
      const reserveConfigurationData = await contract_rw.getReserveConfigurationData(address)
      return reserveConfigurationData
    }

    async canBeBorrowed() {
      const borrowedAssets = await this.getBorrowedAssets()
      const collateralAssets = await this.getCollateralAssets()
      const userAccountData = await this.getUserAccountData()

      const totalBorrowedInUSD = borrowedAssets.reduce((a, b) => a + (b.marketReferenceCurrencyValue || 0), 0)
      const totalCollateralInUSD = collateralAssets.reduce((a, b) => a + (b.marketReferenceCurrencyValue || 0), 0)
      const totalCanBeBorrowedInUSD = parseFloat(userAccountData.currentLoanToValue) * totalCollateralInUSD - totalBorrowedInUSD
      return totalCanBeBorrowedInUSD
    }
}

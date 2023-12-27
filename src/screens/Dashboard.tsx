import React, { useEffect, useState } from 'react'
import type { Node } from 'react'
import { Button as RNButton } from '@rneui/themed'
import { DataTable, List, Card, Title, Button } from 'react-native-paper'
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Pressable,
} from 'react-native'

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen'
import WalletManager from '../managers/wallet_manager'
import { USDC_CONTRACT_ADDRESS } from '../constants'
import AAVEManager from '../managers/aave_manager'
import { getProvider, round } from '../utils'

export const Section = ({ children, title }): Node => {
  const isDarkMode = useColorScheme() === 'dark'
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}
      >
        {title}
      </Text>
      {children}
    </View>
  )
}


const MainComponent: () => Node = ({ route, navigation }) => {
  const isDarkMode = useColorScheme() === 'dark'
  const params = route.params
  const provider = getProvider()
  const wallet = WalletManager.loadWalletFromPrivateKey(params.privateKey, provider)
  const walletManager = new WalletManager(USDC_CONTRACT_ADDRESS, provider)
  const aaveManager = new AAVEManager(wallet)

  const [balances, setBalances] = useState({})
  const [aaveUserAccountData, setAAVEUserAccountData] = useState({})

  useEffect(() => {
    function _getBalances() {
      walletManager.getBalances(params.address).then(function (data) {
        setBalances(data)
      })
    }
    _getBalances()

    function _getAAVEUserData() {
      aaveManager.getUserAccountData().then(function (userAccountData) {
        console.log(userAccountData)
        setAAVEUserAccountData(userAccountData)
      })
    }

    _getAAVEUserData()
  }, [])

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'}/>
      <ScrollView
        contentInsetAdjustmentBehavior='automatic'
        style={backgroundStyle}
      >
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}
        >
          <Section title='Wallet balance'>
            {
              Object.entries(balances).map(([symbol, balance]) => (
                <Text>
                  {symbol}: {round(balance, 2)}
                </Text>
              ))
            }
            <RNButton title='Transfer' style={{ marginTop: 10 }} onPress={() => navigation.navigate('Payment', params)}/>
          </Section>

          <Section>
            <DataTable style={{ borderStyle: 'solid', borderWidth: 1 }}>
              <DataTable.Header style={{ borderStyle: 'solid' }}>
                <DataTable.Title style={{ borderStyle: 'solid' }}><Text style={{ fontSize: 15, fontWeight: 'bold' }}>Collateral</Text></DataTable.Title>
                <DataTable.Title style={{ borderStyle: 'solid' }}><Text style={{ fontSize: 15, fontWeight: 'bold' }}>Loan</Text></DataTable.Title>
              </DataTable.Header>
              <DataTable.Row style={{ borderStyle: 'solid' }}>
                <DataTable.Cell>{round(aaveUserAccountData.totalCollateralUSD/10, 2)} USD</DataTable.Cell>
                <DataTable.Cell>{round(aaveUserAccountData.totalBorrowsUSD/10, 2)} USD</DataTable.Cell>
              </DataTable.Row>
            </DataTable>
          </Section>

          <Section>
            <Title>Supplied assets</Title>
            <List.Accordion title='USDC' right={(props) => (<Text>{round(0.36/10, 2)} WBTC</Text>)}>
              <Card>
                <Card.Title title='Provided' right={(props) => (<Text style={{ marginRight: 10, fontSize: 16 }}>{round(0.36/10, 2)} WBTC</Text>)}/>
                <Card.Title title='APY' right={(props) => <Text style={{ marginRight: 10, fontSize: 16 }}>0.15 %</Text>}/>
                <Card.Actions>
                  <Button onPress={() => navigation.navigate('AaveLend', params)}>Supply</Button>
                  <Button onPress={() => navigation.navigate('AaveWithdraw', params)}>Withdraw</Button>
                </Card.Actions>
              </Card>
            </List.Accordion>
          </Section>

          <Section>
            <Title>Borrowed assets</Title>
            {aaveUserAccountData?.userReservesData?.filter((x) => x?.totalBorrows !== '0').map((value) => (
                <View style={{ marginTop: 10 }}>
                  <List.Accordion title={value?.reserve?.symbol} right={(props) => (<Text>{round(value.totalBorrows/10, 5)} {value?.reserve?.symbol}</Text>)}>
                    <Card>
                      <Card.Title title='Provided' right={(props) => (<Text style={{ marginRight: 10, fontSize: 16 }}>{round(value.totalBorrows/10, 5)} {value?.reserve?.symbol}</Text>)}/>
                      <Card.Title title='APY' right={(props) => <Text style={{ marginRight: 10, fontSize: 16 }}>0.39 %</Text>}/>
                      <Card.Actions>
                        <Button onPress={() => navigation.navigate('AaveBorrow', {
                          symbol: value.reserve.symbol,
                          contractAddress: value.reserve.underlyingAsset,
                          privateKey: params.privateKey
                        })}>Borrow
                        </Button>
                        <Button onPress={() => navigation.navigate('AaveRepay', {
                          symbol: value.reserve.symbol,
                          contractAddress: value.reserve.underlyingAsset,
                          privateKey: params.privateKey
                        })}>Repay</Button>
                      </Card.Actions>
                    </Card>
                  </List.Accordion>
                </View>
            ))}
          </Section>

          <Section title='Borrowable assets'>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Asset</DataTable.Title>
                <DataTable.Title>Variable</DataTable.Title>
                <DataTable.Title>Stable</DataTable.Title>
                <DataTable.Title>Borrow</DataTable.Title>
              </DataTable.Header>

              {aaveUserAccountData?.userReservesData?.map((value) => (
                  <DataTable.Row>
                    <DataTable.Cell>{value.reserve.symbol}</DataTable.Cell>
                    <DataTable.Cell>{round(value.reserve.variableBorrowAPY * 100, 2)}%</DataTable.Cell>
                    <DataTable.Cell>{round(value.reserve.stableBorrowAPY * 100, 2)}%</DataTable.Cell>
                    <DataTable.Cell><Pressable onPress={async () => {
                      navigation.navigate('AaveBorrow', {
                        symbol: value.reserve.symbol,
                        contractAddress: value.reserve.underlyingAsset,
                      })
                    }}><Text style={styles.asset}>Borrow</Text>
                    </Pressable>
                    </DataTable.Cell>
                  </DataTable.Row>
              ))}
            </DataTable>
          </Section>


        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  asset: {
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
})

export default MainComponent

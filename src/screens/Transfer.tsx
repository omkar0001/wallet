import React, { useState } from 'react'
import type { Node } from 'react'
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TextInput,
  Pressable,
  Button,
} from 'react-native'

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen'

import { Section } from './Dashboard'
import { getProvider } from '../utils'
import WalletManager from '../managers/wallet_manager'
import { USDC_CONTRACT_ADDRESS } from '../constants'
import UseLoader from '../hooks/UseLoader'
import { ActivityIndicator } from 'react-native'

async function transfer(privateKey: string, recipientAddress: string, asset: string, amount: number) {
  const walletManager = new WalletManager(USDC_CONTRACT_ADDRESS, getProvider())
  if (asset === 'MATIC') {
    return await walletManager.sendNativeToken(privateKey, recipientAddress, amount)
  } else {
    return await walletManager.sendUSDC(privateKey, recipientAddress, amount)
  }
}

const MainComponent: () => Node = ({ route }) => {
  const [asset, setAsset] = useState('USDC')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState(0)
  const [loading, transferWrapper] = UseLoader(transfer)

  const isDarkMode = useColorScheme() === 'dark'
  const params = route.params

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  }


  function reset() {
    setRecipientAddress('')
    setAmount('')
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
          {loading ? (
            <ActivityIndicator size='large'/>
          ): null}
          <Section title='Payment details'>
            <View style={styles.sectionInner}>
              <View style={styles.row}>
                <Text>Choose asset:</Text>
                <Pressable onPress={() => setAsset('USDC')}>
                  <Text style={asset == 'USDC' ? styles.assetSelected : styles.asset}>USDC</Text>
                </Pressable>
                <Pressable onPress={() => setAsset('MATIC')}>
                  <Text style={asset == 'MATIC' ? styles.assetSelected : styles.asset}>MATIC</Text>
                </Pressable>
              </View>
              <TextInput
                onChangeText={setRecipientAddress}
                placeholder={'Recipient address'}
                style={styles.input}
                value={recipientAddress}/>
              <TextInput
                onChangeText={setAmount}
                placeholder={'Amount'}
                style={styles.input}
                keyboardType='numeric'
                value={amount}/>
              <Button title='Make payment' onPress={async () => {
                await transferWrapper(params.privateKey, recipientAddress, asset, amount)
                reset()
              }
              }/>
            </View>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  sectionInner: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  asset: {
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  assetSelected: {
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
    backgroundColor: Colors.lighter,
  },
  input: {
    height: 40,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 8,
  },
})

export default MainComponent

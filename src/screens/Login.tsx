import React, { useState } from 'react'

import { MMKVLoader, useMMKVStorage } from 'react-native-mmkv-storage'

import type { Node } from 'react'
import {
  Button, Modal,
  SafeAreaView,
  ScrollView,
  StatusBar, StyleSheet, Text, TextInput,
  useColorScheme,
  View,
} from 'react-native'

import WalletManager from "../managers/wallet_manager";
import {
  Colors,
} from 'react-native/Libraries/NewAppScreen'

import '@ethersproject/shims'
import { createWallet } from '../utils'

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


const LoginScreen: () => Node = ({ navigation }) => {
  const MMKV = new MMKVLoader().initialize()

  const [address, setAddress] = useMMKVStorage('address', MMKV, '')
  const [privateKey, setPrivateKey] = useMMKVStorage('private_key', MMKV, '')
  const [modalVisible, setModalVisible] = useState(false)
  const [mnemonic, setMnemonic] = useState('')
  const isDarkMode = useColorScheme() === 'dark'

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
        <Modal
          animationType='slide'
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible)
          }}
        >
          <View style={modalStyles.centeredView}>
            <View style={modalStyles.modalView}>
              <TextInput
                onChangeText={setMnemonic}
                placeholder={'Mnemonic'}
                style={styles.input}
                value={mnemonic}/>

              <Button title='Recover' onPress={() => {
                setModalVisible(false)
                const wallet = WalletManager.loadWalletFromMnemonic(mnemonic)
                setAddress(wallet.address)
                setPrivateKey(wallet.privateKey)
                navigation.navigate('Dashboard', {
                  address: address,
                  privateKey: privateKey,
                })
              }}/>
            </View>
          </View>
        </Modal>

        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}
        >
          <Section title=''>
            <Button title='Create new wallet' onPress={async () => {
              const wallet = createWallet()
              setAddress(wallet.address)
              setPrivateKey(wallet.privateKey)
              navigation.navigate('Dashboard', {
                address: address,
                privateKey: privateKey,
              })
            }}/>
            <Button title='Use existing wallet' onPress={() => setModalVisible(true) }/>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textInput: {
    height: 40,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 8,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
})

export default LoginScreen

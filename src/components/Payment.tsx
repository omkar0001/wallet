import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar, StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native'
import React, { useState } from 'react'
import UseLoader from '../hooks/UseLoader'
import { Colors } from 'react-native/Libraries/NewAppScreen'
import { Section } from '../screens/Dashboard'

const PaymentComponent = ({ buttonLabel, paymentCallback }: {buttonLabel: string, paymentCallback: Function}) => {
  const [loading, paymentCallbackWrapper] = UseLoader(paymentCallback)
  const isDarkMode = useColorScheme() === 'dark'
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  }
  const [amount, setAmount] = useState(0)

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
          <Section title={'Aave ' + buttonLabel}>
            <TextInput
              onChangeText={setAmount}
              placeholder={'Amount'}
              style={styles.input}
              keyboardType='numeric'
              value={amount}/>
            <Button title={buttonLabel} onPress={async () => {
              await paymentCallbackWrapper(amount)
              setAmount(0)
            }}/>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
})

export default PaymentComponent

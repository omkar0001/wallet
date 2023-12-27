import React from 'react'
import 'react-native-get-random-values'

import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { Node } from 'react'

import Dashboard from './screens/Dashboard'
import Transfer from './screens/Transfer'
import AaveLend from './screens/AaveLend'
import AaveBorrow from './screens/AaveBorrow'
import LoginScreen from './screens/Login'
import AaveRepay from './screens/AaveRepay'
import AaveWithdraw from './screens/AaveWithdraw';

const Stack = createNativeStackNavigator()

const MainComponent: () => Node = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='LoginScreen'>
        <Stack.Screen name='Dashboard' component={Dashboard}/>
        <Stack.Screen name='Payment' component={Transfer}/>
        <Stack.Screen name='AaveLend' component={AaveLend}/>
        <Stack.Screen name='AaveBorrow' component={AaveBorrow}/>
        <Stack.Screen name='LoginScreen' component={LoginScreen}/>
        <Stack.Screen name='AaveRepay' component={AaveRepay}/>
        <Stack.Screen name='AaveWithdraw' component={AaveWithdraw}/>
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default MainComponent

// App.tsx — AutoRent Mobile Root
import React from 'react';
import { StatusBar, SafeAreaView, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.brand} />
      <AppNavigator />
      <Toast />
    </SafeAreaProvider>
  );
}

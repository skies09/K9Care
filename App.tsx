import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { DogProvider } from './src/context/DogContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <DogProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </DogProvider>
    </SafeAreaProvider>
  );
}

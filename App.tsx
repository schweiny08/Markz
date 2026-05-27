import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import SetupScreen from './src/screens/SetupScreen';
import VoiceIntakeScreen from './src/screens/VoiceIntakeScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import { TestTemplate } from './src/types';

export type RootStackParamList = {
  Home: undefined;
  Setup: { template: TestTemplate | null };
  VoiceIntake: { template: TestTemplate };
  Results: { sessionId: string; title: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Setup" component={SetupScreen} />
              <Stack.Screen name="VoiceIntake" component={VoiceIntakeScreen} />
              <Stack.Screen name="Results" component={ResultsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

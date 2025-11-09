import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, IconButton } from 'react-native-paper';
import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type RootStackParamList = {
  Home: undefined;
  History: undefined;
  Settings: undefined;  // 👈 ESTA LÍNEA FALTABA
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: '#1976D2',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={({ navigation }) => ({
              title: '🏠 Control de Diálisis',
              headerRight: () => (
                <IconButton
                  icon="cog"
                  iconColor="#fff"
                  size={24}
                  onPress={() => navigation.navigate('Settings')}
                />
              ),
            })}
          />
          <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{ title: '📊 Historial de Diálisis' }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ title: '⚙️ Configuración' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
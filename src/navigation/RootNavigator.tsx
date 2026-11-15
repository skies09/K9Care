import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { useDogContext } from '../context/DogContext';
import { BrandIcon, BrandIconName } from '../components/BrandIcon';
import HomeScreen from '../screens/HomeScreen';
import DogsScreen from '../screens/DogsScreen';
import TrackScreen from '../screens/TrackScreen';
import MedsScreen from '../screens/MedsScreen';
import BreathingScreen from '../screens/BreathingScreen';
import SeizuresScreen from '../screens/SeizuresScreen';
import VetReportScreen from '../screens/VetReportScreen';
import WeightScreen from '../screens/WeightScreen';
import ArthritisScreen from '../screens/ArthritisScreen';
import AllergyScreen from '../screens/AllergyScreen';
import DigestiveScreen from '../screens/DigestiveScreen';
import DiabetesScreen from '../screens/DiabetesScreen';
import KidneyScreen from '../screens/KidneyScreen';
import AnxietyScreen from '../screens/AnxietyScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import EditDogScreen from '../screens/EditDogScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootTabParamList = {
  HomeTab: undefined;
  DogsTab: undefined;
  TrackTab: undefined;
  MedsTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  EditDog: { dogId: string };
  Settings: undefined;
  VetReport: undefined;
  Breathing: undefined;
  Seizures: undefined;
  Weight: undefined;
  Arthritis: undefined;
  Allergies: undefined;
  Digestive: undefined;
  Diabetes: undefined;
  Kidney: undefined;
  Anxiety: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.cardBackground,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.accent,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          height: 88,
          paddingTop: 8,
          paddingBottom: 14,
        },
        tabBarItemStyle: {
          paddingTop: 2,
          paddingBottom: 4,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 2,
        },
        tabBarIcon: ({ focused }) => {
          let iconName: BrandIconName = 'health';
          if (route.name === 'HomeTab') iconName = 'health';
          if (route.name === 'DogsTab') iconName = 'dog';
          if (route.name === 'TrackTab') iconName = 'graph';
          if (route.name === 'MedsTab') iconName = 'medication';
          return (
            <BrandIcon
              name={iconName}
              size={focused ? 30 : 28}
              opacity={focused ? 1 : 0.42}
            />
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="DogsTab" component={DogsScreen} options={{ title: 'Dogs' }} />
      <Tab.Screen name="TrackTab" component={TrackScreen} options={{ title: 'Track' }} />
      <Tab.Screen name="MedsTab" component={MedsScreen} options={{ title: 'Meds' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { dogs, loading } = useDogContext();

  // Wait for dogs to load from DB before deciding Onboarding vs Tabs. Otherwise we'd
  // show Onboarding on every launch because dogs is [] until the async load finishes.
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initialRouteName: keyof RootStackParamList = dogs.length === 0 ? 'Onboarding' : 'Tabs';

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Tabs"
          component={Tabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditDog"
          component={EditDogScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VetReport"
          component={VetReportScreen}
          options={{ title: 'Vet Report', headerShown: false }}
        />
        <Stack.Screen
          name="Breathing"
          component={BreathingScreen}
          options={{ title: 'Breathing', headerShown: false }}
        />
        <Stack.Screen
          name="Seizures"
          component={SeizuresScreen}
          options={{ title: 'Seizures', headerShown: false }}
        />
        <Stack.Screen
          name="Weight"
          component={WeightScreen}
          options={{ title: 'Weight', headerShown: false }}
        />
        <Stack.Screen
          name="Arthritis"
          component={ArthritisScreen}
          options={{ title: 'Arthritis & Mobility', headerShown: false }}
        />
        <Stack.Screen
          name="Allergies"
          component={AllergyScreen}
          options={{ title: 'Allergies & Skin', headerShown: false }}
        />
        <Stack.Screen
          name="Digestive"
          component={DigestiveScreen}
          options={{ title: 'Digestion', headerShown: false }}
        />
        <Stack.Screen
          name="Diabetes"
          component={DiabetesScreen}
          options={{ title: 'Diabetes', headerShown: false }}
        />
        <Stack.Screen
          name="Kidney"
          component={KidneyScreen}
          options={{ title: 'Kidney & Urinary', headerShown: false }}
        />
        <Stack.Screen
          name="Anxiety"
          component={AnxietyScreen}
          options={{ title: 'Anxiety & Behaviour', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


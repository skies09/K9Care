import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useDogContext } from '../context/DogContext';
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
    primary: colors.primaryBlue,
    background: colors.background,
    card: colors.cardBackground,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primaryBlue,
  },
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primaryBlue,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'HomeTab') iconName = 'home';
          if (route.name === 'DogsTab') iconName = 'paw';
          if (route.name === 'TrackTab') iconName = 'pulse';
          if (route.name === 'MedsTab') iconName = 'medkit';
          return <Ionicons name={iconName} size={size} color={color} />;
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
        <ActivityIndicator size="large" color={colors.primaryBlue} />
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
          options={{ title: 'Digestive Health', headerShown: false }}
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


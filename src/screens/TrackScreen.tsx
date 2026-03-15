import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useDogContext } from '../context/DogContext';
import type { ConditionTag } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Card } from '../components/ui/Card';
import { Button as AppButton } from '../components/ui/Button';

const TRACKER_CONFIG: Record<
  ConditionTag,
  { title: string; subtitle: string; screen: keyof RootStackParamList; button: string }
> = {
  heart: {
    title: 'Breathing',
    subtitle: 'Log resting breathing rate.',
    screen: 'Breathing',
    button: 'Log breathing',
  },
  epilepsy: {
    title: 'Seizures',
    subtitle: 'Start a seizure timer.',
    screen: 'Seizures',
    button: 'Start seizure timer',
  },
  arthritis: {
    title: 'Arthritis & mobility',
    subtitle: 'Log mobility and pain scores.',
    screen: 'Arthritis',
    button: 'Open mobility',
  },
  allergy: {
    title: 'Allergies & skin',
    subtitle: 'Record flare-ups and triggers.',
    screen: 'Allergies',
    button: 'Open allergies',
  },
  digestive: {
    title: 'Digestive',
    subtitle: 'Track stool, vomiting, appetite.',
    screen: 'Digestive',
    button: 'Open digestive',
  },
  diabetes: {
    title: 'Diabetes',
    subtitle: 'Log insulin and glucose.',
    screen: 'Diabetes',
    button: 'Open diabetes',
  },
  kidney: {
    title: 'Kidney & urinary',
    subtitle: 'Monitor water and urination.',
    screen: 'Kidney',
    button: 'Open kidney',
  },
  anxiety: {
    title: 'Anxiety & behaviour',
    subtitle: 'Track anxiety episodes.',
    screen: 'Anxiety',
    button: 'Open anxiety',
  },
};

const TrackScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { dogs, currentDogId, setCurrentDogId, currentDog } = useDogContext();

  const conditions = currentDog?.primaryConditions ?? [];
  const trackers = conditions.map((id) => ({ id, ...TRACKER_CONFIG[id] })).filter(Boolean);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {dogs.length > 1 && (
        <View style={styles.dogSelectorRow}>
          <Text style={styles.dogSelectorLabel}>Dog:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dogSelectorScroll}
          >
            {dogs.map((d) => {
              const isActive = d.id === currentDogId;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.dogChip, isActive && styles.dogChipActive]}
                  onPress={() => setCurrentDogId(d.id)}
                >
                  <Text style={[styles.dogChipText, isActive && styles.dogChipTextActive]}>
                    {d.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <Text style={styles.title}>Track</Text>
      <Text style={styles.subtitle}>Log health checks and symptoms.</Text>

      {!currentDog ? (
        <Text style={styles.emptyText}>Select or add a dog in the Dogs tab.</Text>
      ) : trackers.length === 0 ? (
        <Text style={styles.emptyText}>
          No trackers selected for {currentDog.name}. Edit this dog in the Dogs tab to choose what
          to track.
        </Text>
      ) : (
        <View style={styles.cards}>
          {trackers.map(({ id, title, subtitle, screen, button }) => (
            <Card key={id}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardText}>{subtitle}</Text>
              <AppButton
                title={button}
                onPress={() => navigation.navigate(screen)}
                style={styles.cardButton}
                variant={id === 'heart' || id === 'epilepsy' ? 'primary' : 'secondary'}
              />
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 32,
  },
  dogSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  dogSelectorLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dogSelectorScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  dogChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dogChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  dogChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dogChipTextActive: {
    color: '#fff',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  cards: {
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
});

export default TrackScreen;

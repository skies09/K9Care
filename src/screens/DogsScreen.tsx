import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDogContext } from '../context/DogContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { ConditionTag } from '../types';
import { spacing } from '../theme/spacing';
import { Card } from '../components/ui/Card';
import { Button as AppButton } from '../components/ui/Button';
import { colors } from '../theme/colors';

const CONDITION_LABELS: Record<ConditionTag, string> = {
  heart: 'Heart',
  epilepsy: 'Seizures / epilepsy',
  arthritis: 'Arthritis & mobility',
  allergy: 'Allergies & skin',
  digestive: 'Digestive',
  diabetes: 'Diabetes',
  kidney: 'Kidney & urinary',
  anxiety: 'Anxiety & behaviour',
};

function parseDob(dob: string): Date | null {
  const s = dob.trim();
  if (!s) return null;
  // ISO (YYYY-MM-DD)
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) {
    const y = parseInt(iso[1], 10);
    const m = parseInt(iso[2], 10) - 1;
    const d = parseInt(iso[3], 10);
    const date = new Date(y, m, d);
    return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d ? date : null;
  }
  // DD-MM-YYYY or D-M-YYYY (or 2-digit year DD-MM-YY)
  const dmy = /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/.exec(s);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    let year = parseInt(dmy[3], 10);
    if (year < 100) year += year >= 30 ? 1900 : 2000; // 30-99 -> 1930-1999, 00-29 -> 2000-2029
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
    return date;
  }
  // MM-YYYY or M-YYYY (or 2-digit year MM-YY)
  const my = /^(\d{1,2})-(\d{2,4})$/.exec(s);
  if (my) {
    const month = parseInt(my[1], 10) - 1;
    let year = parseInt(my[2], 10);
    if (year < 100) year += year >= 30 ? 1900 : 2000;
    const date = new Date(year, month, 1);
    if (date.getFullYear() !== year || date.getMonth() !== month) return null;
    return date;
  }
  // YYYY only or fallback
  const yOnly = /^(\d{4})$/.exec(s);
  if (yOnly) {
    const year = parseInt(yOnly[1], 10);
    if (year < 1900 || year > new Date().getFullYear()) return null;
    return new Date(year, 0, 1);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getAgeFromDob(dob: string | null | undefined): string | null {
  const d = parseDob(dob ?? '');
  if (!d) return null;
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) years -= 1;
  if (years < 0 || years > 30) return null; // sanity: no future dates, no > 30 years for a dog
  return years === 0 ? 'Under 1 year' : `${years} ${years === 1 ? 'year' : 'years'}`;
}

const DogsScreen: React.FC = () => {
  const { dogs, currentDogId, setCurrentDogId, addDog, deleteDog } = useDogContext();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [newDogName, setNewDogName] = useState('');

  const handleAddDog = async () => {
    const trimmed = newDogName.trim();
    if (!trimmed) return;
    await addDog({ name: trimmed });
    setNewDogName('');
  };

  const handleRemovePress = (dog: { id: string; name: string }) => {
    Alert.alert(
      'Remove dog?',
      `Are you sure you want to remove ${dog.name}? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteDog(dog.id) },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.title}>Your dogs</Text>

      {dogs.length === 0 ? (
        <Text style={styles.emptyText}>No dogs yet. Add your first dog below.</Text>
      ) : (
        dogs.map((item) => {
          const isActive = item.id === currentDogId;
          const age = getAgeFromDob(item.dob);
          const conditionsText = item.primaryConditions?.length
            ? item.primaryConditions.map((id) => CONDITION_LABELS[id] ?? id).join(', ')
            : null;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.dogCard}
              onPress={() => navigation.navigate('EditDog', { dogId: item.id })}
              activeOpacity={0.8}
            >
              <View style={styles.dogCardContent}>
                <View style={styles.dogAvatarWrap}>
                  {item.photoUri ? (
                    <Image source={{ uri: item.photoUri }} style={styles.dogAvatar} />
                  ) : (
                    <View style={styles.dogAvatarPlaceholder}>
                      <Ionicons name="paw" size={28} color={colors.textSecondary} />
                    </View>
                  )}
                </View>
                <View style={styles.dogCardMain}>
                  <View style={styles.dogCardHeader}>
                    <Text style={styles.dogName}>{item.name}</Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemovePress(item);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={`Remove ${item.name}`}
                    accessibilityRole="button"
                  >
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.dogDetails}>
                  {item.breed ? <Text style={styles.dogDetail}>{item.breed}</Text> : null}
                  {age ? <Text style={styles.dogDetail}>Age: {age}</Text> : null}
                  {item.weightKg != null ? (
                    <Text style={styles.dogDetail}>Weight: {item.weightKg} kg</Text>
                  ) : null}
                  {item.notes ? <Text style={styles.dogDetail}>Notes: {item.notes}</Text> : null}
                  {conditionsText ? (
                    <Text style={styles.dogDetail}>Tracking: {conditionsText}</Text>
                  ) : null}
                </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {dogs.length >= 5 ? (
        <View style={styles.maxDogsCard}>
          <Text style={styles.maxDogsText}>Maximum 5 dogs. Remove a dog to add another.</Text>
        </View>
      ) : (
        <Card>
          <Text style={styles.sectionTitle}>Add a dog</Text>
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="Dog name"
              placeholderTextColor={colors.textSecondary}
              value={newDogName}
              onChangeText={setNewDogName}
            />
            <AppButton title="Add" onPress={handleAddDog} style={styles.addButton} />
          </View>
        </Card>
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  dogCard: {
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  dogCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dogAvatarWrap: {
    marginRight: spacing.md,
  },
  dogAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  dogAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dogCardMain: {
    flex: 1,
  },
  dogCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dogName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  removeButton: {
    padding: 4,
  },
  dogDetails: {
    marginTop: 2,
  },
  dogDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 24,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 12,
    backgroundColor: colors.cardBackground,
    color: colors.textPrimary,
  },
  addButton: {
    marginLeft: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  maxDogsCard: {
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  maxDogsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default DogsScreen;


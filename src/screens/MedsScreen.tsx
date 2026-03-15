import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getDb } from '../db/database';
import { useDogContext } from '../context/DogContext';
import { Medication } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { ensureNotificationPermissions, scheduleOneOffNotification } from '../services/notifications';

const MedsScreen: React.FC = () => {
  const { dogs, currentDogId, currentDog } = useDogContext();
  const [meds, setMeds] = useState<Medication[]>([]);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('mg');
  const [time, setTime] = useState('08:00');
  // When adding a med, which dog it's for (synced with current dog when switching from other tabs)
  const [addMedForDogId, setAddMedForDogId] = useState<string | null>(currentDogId);

  useEffect(() => {
    setAddMedForDogId((prev) => currentDogId ?? prev);
  }, [currentDogId]);

  useEffect(() => {
    if (!currentDog) return;
    const load = async () => {
      const db = getDb();
      try {
        const rows = await db.getAllAsync<any>(
          'SELECT * FROM medications WHERE dogId = ? ORDER BY name ASC',
          [currentDog.id]
        );
        const list: Medication[] = rows.map((row: any) => ({
          id: row.id,
          dogId: row.dogId,
          name: row.name,
          dose: row.dose,
          unit: row.unit,
          scheduleType: row.scheduleType,
          timesOfDayJson: row.timesOfDayJson,
          intervalHours: row.intervalHours,
          startDate: row.startDate,
          endDate: row.endDate,
          notes: row.notes,
        }));
        setMeds(list);
      } catch {
        // ignore
      }
    };
    void load();
  }, [currentDog]);

  const handleAdd = async () => {
    const dogForMed =
      dogs.length >= 1 && addMedForDogId
        ? dogs.find((d) => d.id === addMedForDogId) ?? null
        : currentDog;
    if (!dogForMed) {
      Alert.alert('Add a dog first', 'You need a dog profile to add medications.');
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const numericDose = Number(dose) || 0;
    const id = `med_${Date.now()}`;
    const db = getDb();
    const timesOfDayJson = JSON.stringify([time]);
    const today = new Date().toISOString().slice(0, 10);

    try {
      await db.runAsync(
        'INSERT INTO medications (id, dogId, name, dose, unit, scheduleType, timesOfDayJson, startDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, dogForMed.id, trimmedName, numericDose, unit, 'times-per-day', timesOfDayJson, today]
      );
      const item: Medication = {
        id,
        dogId: dogForMed.id,
        name: trimmedName,
        dose: numericDose,
        unit,
        scheduleType: 'times-per-day',
        timesOfDayJson,
        startDate: today,
      };
      if (dogForMed.id === currentDog?.id) {
        setMeds((prev) => [...prev, item]);
      }
    } catch {
      Alert.alert('Error', 'Could not save medication.');
    }

    setName('');
    setDose('');

    await ensureNotificationPermissions();
    const [hours, minutes] = time.split(':').map((val) => Number(val));
    const now = new Date();
    const triggerDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes || 0,
      0
    );
    if (triggerDate.getTime() <= now.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }
    await scheduleOneOffNotification({
      identifier: id,
      title: `Medication for ${dogForMed.name}`,
      body: `${trimmedName} – ${numericDose || ''} ${unit}`.trim(),
      triggerDate,
    });
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
        <Text style={styles.title}>Medications</Text>
      <Text style={styles.subtitle}>
        Set up simple daily reminders. For complex schedules your vet recommends, use this as a
        helper alongside their instructions.
      </Text>

        <FlatList
          data={meds}
          keyExtractor={(item) => item.id}
          style={styles.list}
          scrollEnabled={false}
          ListHeaderComponent={<Text style={styles.listTitle}>Current medications</Text>}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listItemTitle}>
                {item.name} – {item.dose} {item.unit}
              </Text>
              {item.timesOfDayJson && (
                <Text style={styles.listItemSub}>
                  At: {JSON.parse(item.timesOfDayJson).join(', ')}
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No medications added yet.</Text>
          }
        />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add a medication</Text>
          {dogs.length >= 1 && (
            <View style={styles.forDogRow}>
              <Text style={styles.forDogLabel}>For dog:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.forDogScroll}
                style={styles.forDogScrollView}
              >
                {dogs.map((d) => {
                  const isSelected = d.id === addMedForDogId;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.forDogChip, isSelected && styles.forDogChipActive]}
                      onPress={() => setAddMedForDogId(d.id)}
                    >
                      <Text style={[styles.forDogChipText, isSelected && styles.forDogChipTextActive]}>
                        {d.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
          <TextInput
            style={styles.input}
            placeholder="Name (e.g. Pimobendan)"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="Dose"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={dose}
              onChangeText={setDose}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="Unit (e.g. mg)"
              placeholderTextColor={colors.textSecondary}
              value={unit}
              onChangeText={setUnit}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Time (HH:MM, 24h – e.g. 08:00)"
            placeholderTextColor={colors.textSecondary}
            value={time}
            onChangeText={setTime}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleAdd}>
            <Text style={styles.primaryButtonText}>Save and schedule</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  list: {
    flex: 1,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listItemTitle: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  listItemSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  forDogRow: {
    marginBottom: 12,
  },
  forDogLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  forDogScrollView: {
    minHeight: 44,
  },
  forDogScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  forDogChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  forDogChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  forDogChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  forDogChipTextActive: {
    color: '#fff',
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 12,
    backgroundColor: colors.cardBackground,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowInput: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: colors.primaryBlue,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default MedsScreen;


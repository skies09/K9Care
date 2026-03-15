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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../db/database';
import { useDogContext } from '../context/DogContext';
import { GlucoseReading, InsulinLog } from '../types';
import { colors } from '../theme/colors';

const DiabetesScreen: React.FC = () => {
  const { currentDog } = useDogContext();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [insulinLogs, setInsulinLogs] = useState<InsulinLog[]>([]);
  const [glucoseLogs, setGlucoseLogs] = useState<GlucoseReading[]>([]);

  const [insulinDose, setInsulinDose] = useState('');
  const [insulinRelation, setInsulinRelation] =
    useState<InsulinLog['relationToMeal'] | ''>('');
  const [insulinNotes, setInsulinNotes] = useState('');

  const [glucoseValue, setGlucoseValue] = useState('');
  const [glucoseNotes, setGlucoseNotes] = useState('');

  useEffect(() => {
    if (!currentDog) {
      setInsulinLogs([]);
      setGlucoseLogs([]);
      return;
    }
    const load = async () => {
      const db = getDb();
      try {
        const insulinRows = await db.getAllAsync<any>(
          'SELECT * FROM insulin_logs WHERE dogId = ? ORDER BY datetime(givenAt) DESC LIMIT 50',
          [currentDog.id]
        );
        const insulinItems: InsulinLog[] = insulinRows.map((row: any) => ({
          id: row.id,
          dogId: row.dogId,
          doseUnits: row.doseUnits,
          givenAt: row.givenAt,
          relationToMeal: row.relationToMeal,
          notes: row.notes,
        }));
        setInsulinLogs(insulinItems);

        const glucoseRows = await db.getAllAsync<any>(
          'SELECT * FROM glucose_readings WHERE dogId = ? ORDER BY datetime(takenAt) DESC LIMIT 50',
          [currentDog.id]
        );
        const glucoseItems: GlucoseReading[] = glucoseRows.map((row: any) => ({
          id: row.id,
          dogId: row.dogId,
          value: row.value,
          takenAt: row.takenAt,
          notes: row.notes,
        }));
        setGlucoseLogs(glucoseItems);
      } catch {
        // ignore
      }
    };
    void load();
  }, [currentDog]);

  const handleSaveInsulin = () => {
    if (!currentDog) {
      Alert.alert('Add a dog first', 'You need a dog profile to log insulin doses.');
      return;
    }
    const dose = Number(insulinDose);
    if (!Number.isFinite(dose) || dose <= 0) {
      Alert.alert('Enter dose', 'Please enter a positive insulin dose in units.');
      return;
    }
    const id = `insulin_${Date.now()}`;
    const givenAt = new Date().toISOString();
    const db = getDb();
    db.runAsync(
      'INSERT INTO insulin_logs (id, dogId, doseUnits, givenAt, relationToMeal, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id,
        currentDog.id,
        dose,
        givenAt,
        insulinRelation || null,
        insulinNotes || null,
      ]
    )
      .then(() => {
        const item: InsulinLog = {
          id,
          dogId: currentDog.id,
          doseUnits: dose,
          givenAt,
          relationToMeal: insulinRelation || undefined,
          notes: insulinNotes || undefined,
        };
        setInsulinLogs((prev) => [item, ...prev]);
        setInsulinDose('');
        setInsulinRelation('');
        setInsulinNotes('');
      })
      .catch(() => {
        Alert.alert('Error', 'Could not save insulin log.');
      });
  };

  const handleSaveGlucose = () => {
    if (!currentDog) {
      Alert.alert('Add a dog first', 'You need a dog profile to log glucose readings.');
      return;
    }
    const value = Number(glucoseValue);
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert('Enter value', 'Please enter a positive glucose value.');
      return;
    }
    const id = `glucose_${Date.now()}`;
    const takenAt = new Date().toISOString();
    const db = getDb();
    db.runAsync(
      'INSERT INTO glucose_readings (id, dogId, value, takenAt, notes) VALUES (?, ?, ?, ?, ?)',
      [id, currentDog.id, value, takenAt, glucoseNotes || null]
    )
      .then(() => {
        const item: GlucoseReading = {
          id,
          dogId: currentDog.id,
          value,
          takenAt,
          notes: glucoseNotes || undefined,
        };
        setGlucoseLogs((prev) => [item, ...prev]);
        setGlucoseValue('');
        setGlucoseNotes('');
      })
      .catch(() => {
        Alert.alert('Error', 'Could not save glucose reading.');
      });
  };

  const relationOptions: Array<NonNullable<InsulinLog['relationToMeal']>> = [
    'before',
    'after',
    'with',
    'other',
  ];

  return (
    <>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 4 }]}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Diabetes</Text>
      <Text style={styles.subtitle}>
        Track insulin doses and optional blood glucose readings. Use this alongside your vet&apos;s
        instructions.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Insulin dose</Text>
        <TextInput
          style={styles.input}
          placeholder="Dose (units)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={insulinDose}
          onChangeText={setInsulinDose}
        />
        <Text style={styles.sectionLabel}>Relation to meal</Text>
        <View style={styles.toggleRow}>
          {relationOptions.map((opt) => {
            const active = insulinRelation === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.toggleChip, active && styles.toggleChipActive]}
                onPress={() => setInsulinRelation(opt)}
              >
                <Text
                  style={[styles.toggleText, active && styles.toggleTextActive]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="Optional notes"
          placeholderTextColor={colors.textSecondary}
          value={insulinNotes}
          onChangeText={setInsulinNotes}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSaveInsulin}>
          <Text style={styles.primaryButtonText}>Save insulin dose</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Glucose reading</Text>
        <TextInput
          style={styles.input}
          placeholder="Value (e.g. mg/dL)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={glucoseValue}
          onChangeText={setGlucoseValue}
        />
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="Optional notes"
          placeholderTextColor={colors.textSecondary}
          value={glucoseNotes}
          onChangeText={setGlucoseNotes}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSaveGlucose}>
          <Text style={styles.primaryButtonText}>Save reading</Text>
        </TouchableOpacity>
      </View>

        <FlatList
          data={insulinLogs}
          keyExtractor={(item) => item.id}
          style={styles.list}
          scrollEnabled={false}
          ListHeaderComponent={<Text style={styles.listTitle}>Recent insulin doses</Text>}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listItemTitle}>
                {item.doseUnits} units –{' '}
                {new Date(item.givenAt).toLocaleDateString()}
              </Text>
              {item.relationToMeal && (
                <Text style={styles.listItemSub}>
                  Relation to meal: {item.relationToMeal}
                </Text>
              )}
              {item.notes ? <Text style={styles.listItemNote}>{item.notes}</Text> : null}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No insulin doses logged yet.</Text>
          }
        />

        <FlatList
          data={glucoseLogs}
          keyExtractor={(item) => item.id}
          style={styles.list}
          scrollEnabled={false}
          ListHeaderComponent={<Text style={styles.listTitle}>Recent glucose readings</Text>}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listItemTitle}>
                {item.value} – {new Date(item.takenAt).toLocaleString()}
              </Text>
              {item.notes ? <Text style={styles.listItemNote}>{item.notes}</Text> : null}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No glucose readings logged yet.</Text>
          }
        />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
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
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
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
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  toggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: colors.cardBackground,
  },
  toggleChipActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: '#E6F0FF',
  },
  toggleText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.primaryBlue,
    fontWeight: '600',
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
  list: {
    flex: 1,
    marginTop: 8,
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
  listItemNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
});

export default DiabetesScreen;


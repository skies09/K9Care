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
import { KidneyLog } from '../types';
import { colors } from '../theme/colors';

const KidneyScreen: React.FC = () => {
  const { currentDog } = useDogContext();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [logs, setLogs] = useState<KidneyLog[]>([]);
  const [waterIntake, setWaterIntake] = useState('');
  const [urinationCount, setUrinationCount] = useState('');
  const [accidentsCount, setAccidentsCount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!currentDog) {
      setLogs([]);
      return;
    }
    const load = async () => {
      const db = getDb();
      try {
        const rows = await db.getAllAsync<any>(
          'SELECT * FROM kidney_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 50',
          [currentDog.id]
        );
        const items: KidneyLog[] = rows.map((row: any) => ({
          id: row.id,
          dogId: row.dogId,
          waterIntakeMl: row.waterIntakeMl,
          urinationCount: row.urinationCount,
          accidentsCount: row.accidentsCount,
          createdAt: row.createdAt,
          notes: row.notes,
        }));
        setLogs(items);
      } catch {
        // ignore
      }
    };
    void load();
  }, [currentDog]);

  const handleSave = () => {
    if (!currentDog) {
      Alert.alert('Add a dog first', 'You need a dog profile to log kidney and urinary health.');
      return;
    }
    const water = Number(waterIntake);
    const urination = Number(urinationCount);
    const accidents = Number(accidentsCount);
    const id = `kidney_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const db = getDb();
    db.runAsync(
      `INSERT INTO kidney_logs
        (id, dogId, waterIntakeMl, urinationCount, accidentsCount, createdAt, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        currentDog.id,
        Number.isFinite(water) ? water : null,
        Number.isFinite(urination) ? urination : null,
        Number.isFinite(accidents) ? accidents : null,
        createdAt,
        notes || null,
      ]
    )
      .then(() => {
        const item: KidneyLog = {
          id,
          dogId: currentDog.id,
          waterIntakeMl: Number.isFinite(water) ? water : undefined,
          urinationCount: Number.isFinite(urination) ? urination : undefined,
          accidentsCount: Number.isFinite(accidents) ? accidents : undefined,
          createdAt,
          notes: notes || undefined,
        };
        setLogs((prev) => [item, ...prev]);
        setWaterIntake('');
        setUrinationCount('');
        setAccidentsCount('');
        setNotes('');
      })
      .catch(() => {
        Alert.alert('Error', 'Could not save kidney log.');
      });
  };

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
          <Text style={styles.title}>Kidney & urinary</Text>
      <Text style={styles.subtitle}>
        Track approximate water intake, urination frequency, and accidents to support kidney or
        urinary conditions.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>New log</Text>
        <TextInput
          style={styles.input}
          placeholder="Water intake (ml)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={waterIntake}
          onChangeText={setWaterIntake}
        />
        <TextInput
          style={styles.input}
          placeholder="Number of urinations"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={urinationCount}
          onChangeText={setUrinationCount}
        />
        <TextInput
          style={styles.input}
          placeholder="Number of accidents"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={accidentsCount}
          onChangeText={setAccidentsCount}
        />
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="Optional notes"
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save kidney log</Text>
        </TouchableOpacity>
      </View>

        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          style={styles.list}
          scrollEnabled={false}
          ListHeaderComponent={<Text style={styles.listTitle}>Recent logs</Text>}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listItemTitle}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              {item.waterIntakeMl != null && (
                <Text style={styles.listItemSub}>
                  Water intake: {item.waterIntakeMl} ml
                </Text>
              )}
              <Text style={styles.listItemSub}>
                Urinations: {item.urinationCount ?? '-'} · Accidents:{' '}
                {item.accidentsCount ?? '-'}
              </Text>
              {item.notes ? <Text style={styles.listItemNote}>{item.notes}</Text> : null}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No kidney logs yet.</Text>
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

export default KidneyScreen;


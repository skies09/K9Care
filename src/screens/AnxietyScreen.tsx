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
import { AnxietyLog, AnxietyTrigger } from '../types';
import { colors } from '../theme/colors';

const TRIGGERS: AnxietyTrigger[] = ['noise', 'separation', 'visitors', 'travel', 'vet', 'other'];

const AnxietyScreen: React.FC = () => {
  const { currentDog } = useDogContext();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [logs, setLogs] = useState<AnxietyLog[]>([]);
  const [trigger, setTrigger] = useState<AnxietyTrigger>('noise');
  const [severity, setSeverity] = useState('');
  const [duration, setDuration] = useState('');
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
          'SELECT * FROM anxiety_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 50',
          [currentDog.id]
        );
        const items: AnxietyLog[] = rows.map((row: any) => ({
          id: row.id,
          dogId: row.dogId,
          trigger: row.trigger as AnxietyTrigger,
          severity: row.severity,
          durationMinutes: row.durationMinutes,
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
      Alert.alert('Add a dog first', 'You need a dog profile to log anxiety events.');
      return;
    }
    const sev = Number(severity);
    const sevVal = Number.isFinite(sev) && sev >= 1 && sev <= 5 ? Math.round(sev) : null;
    const dur = Number(duration);
    const durVal = Number.isFinite(dur) && dur >= 0 ? Math.round(dur) : null;
    const id = `anxiety_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const db = getDb();
    db.runAsync(
      `INSERT INTO anxiety_logs
        (id, dogId, trigger, severity, durationMinutes, createdAt, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        currentDog.id,
        trigger,
        sevVal,
        durVal,
        createdAt,
        notes || null,
      ]
    )
      .then(() => {
        const item: AnxietyLog = {
          id,
          dogId: currentDog.id,
          trigger,
          severity: sevVal ?? undefined,
          durationMinutes: durVal ?? undefined,
          createdAt,
          notes: notes || undefined,
        };
        setLogs((prev) => [item, ...prev]);
        setSeverity('');
        setDuration('');
        setNotes('');
      })
      .catch(() => {
        Alert.alert('Error', 'Could not save anxiety log.');
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
          <Text style={styles.title}>Anxiety & behaviour</Text>
      <Text style={styles.subtitle}>
        Log anxiety episodes, triggers, and severity to help your vet or behaviourist understand
        patterns.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>New episode</Text>
        <Text style={styles.sectionLabel}>Trigger</Text>
        <View style={styles.toggleRow}>
          {TRIGGERS.map((opt) => {
            const active = trigger === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.toggleChip, active && styles.toggleChipActive]}
                onPress={() => setTrigger(opt)}
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
          style={styles.input}
          placeholder="Severity (1–5)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={severity}
          onChangeText={setSeverity}
        />
        <TextInput
          style={styles.input}
          placeholder="Duration (minutes)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={duration}
          onChangeText={setDuration}
        />
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="Optional notes"
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save episode</Text>
        </TouchableOpacity>
      </View>

        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          style={styles.list}
          scrollEnabled={false}
          ListHeaderComponent={<Text style={styles.listTitle}>Recent episodes</Text>}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listItemTitle}>
                {item.trigger} – {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              {item.severity != null && (
                <Text style={styles.listItemSub}>Severity: {item.severity}/5</Text>
              )}
              {item.durationMinutes != null && (
                <Text style={styles.listItemSub}>
                  Duration: {item.durationMinutes} minutes
                </Text>
              )}
              {item.notes ? <Text style={styles.listItemNote}>{item.notes}</Text> : null}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No anxiety logs yet.</Text>
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
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

export default AnxietyScreen;


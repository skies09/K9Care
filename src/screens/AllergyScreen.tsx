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
import { AllergyLog, AllergyTrigger } from '../types';
import { colors } from '../theme/colors';

const ALL_TRIGGERS: AllergyTrigger[] = ['food', 'pollen', 'fleas', 'environment', 'unknown'];

const AllergyScreen: React.FC = () => {
  const { currentDog } = useDogContext();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [logs, setLogs] = useState<AllergyLog[]>([]);
  const [itch, setItch] = useState('');
  const [bodyAreas, setBodyAreas] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<AllergyTrigger[]>([]);
  const [skinLesions, setSkinLesions] = useState(false);
  const [earIssues, setEarIssues] = useState(false);

  useEffect(() => {
    if (!currentDog) {
      setLogs([]);
      return;
    }
    const load = async () => {
      const db = getDb();
      try {
        const rows = await db.getAllAsync<any>(
          'SELECT * FROM allergy_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 50',
          [currentDog.id]
        );
        const items: AllergyLog[] = rows.map((row: any) => ({
          id: row.id,
          dogId: row.dogId,
          itchSeverity: row.itchSeverity,
          skinLesions: !!row.skinLesions,
          earIssues: !!row.earIssues,
          bodyAreas: row.bodyAreas,
          triggers: row.triggersJson ? JSON.parse(row.triggersJson) : [],
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

  const toggleTrigger = (trigger: AllergyTrigger) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const handleSave = () => {
    if (!currentDog) {
      Alert.alert('Add a dog first', 'You need a dog profile to log allergies.');
      return;
    }
    const itchVal = Number(itch);
    const itchSeverity =
      Number.isFinite(itchVal) && itchVal >= 1 && itchVal <= 5 ? Math.round(itchVal) : null;
    const id = `allergy_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const db = getDb();
    db.runAsync(
      `INSERT INTO allergy_logs
        (id, dogId, itchSeverity, skinLesions, earIssues, bodyAreas, triggersJson, createdAt, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        currentDog.id,
        itchSeverity,
        skinLesions ? 1 : 0,
        earIssues ? 1 : 0,
        bodyAreas || null,
        JSON.stringify(selectedTriggers),
        createdAt,
        notes || null,
      ]
    )
      .then(() => {
        const item: AllergyLog = {
          id,
          dogId: currentDog.id,
          itchSeverity: itchSeverity ?? undefined,
          skinLesions,
          earIssues,
          bodyAreas: bodyAreas || undefined,
          triggers: selectedTriggers,
          createdAt,
          notes: notes || undefined,
        };
        setLogs((prev) => [item, ...prev]);
        setItch('');
        setBodyAreas('');
        setNotes('');
        setSelectedTriggers([]);
        setSkinLesions(false);
        setEarIssues(false);
      })
      .catch(() => {
        Alert.alert('Error', 'Could not save allergy log.');
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
          <Text style={styles.title}>Allergies & skin</Text>
      <Text style={styles.subtitle}>
        Log itch severity, skin and ear issues, and likely triggers to help spot seasonal or
        pattern-based flares.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>New flare-up</Text>
        <TextInput
          style={styles.input}
          placeholder="Itch severity (1–5)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={itch}
          onChangeText={setItch}
        />
        <TextInput
          style={styles.input}
          placeholder="Body areas (e.g. paws, ears, belly)"
          placeholderTextColor={colors.textSecondary}
          value={bodyAreas}
          onChangeText={setBodyAreas}
        />
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleChip, skinLesions && styles.toggleChipActive]}
            onPress={() => setSkinLesions((v) => !v)}
          >
            <Text
              style={[styles.toggleText, skinLesions && styles.toggleTextActive]}
            >
              Skin lesions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleChip, earIssues && styles.toggleChipActive]}
            onPress={() => setEarIssues((v) => !v)}
          >
            <Text
              style={[styles.toggleText, earIssues && styles.toggleTextActive]}
            >
              Ear problems
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Triggers</Text>
        <View style={styles.triggerRow}>
          {ALL_TRIGGERS.map((trigger) => {
            const active = selectedTriggers.includes(trigger);
            return (
              <TouchableOpacity
                key={trigger}
                style={[styles.triggerChip, active && styles.triggerChipActive]}
                onPress={() => toggleTrigger(trigger)}
              >
                <Text
                  style={[styles.triggerText, active && styles.triggerTextActive]}
                >
                  {trigger}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="Optional notes"
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save flare-up</Text>
        </TouchableOpacity>
      </View>

        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          style={styles.list}
          scrollEnabled={false}
          ListHeaderComponent={<Text style={styles.listTitle}>Recent flare-ups</Text>}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listItemTitle}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              {item.itchSeverity != null && (
                <Text style={styles.listItemSub}>Itch: {item.itchSeverity}/5</Text>
              )}
              <Text style={styles.listItemSub}>
                Skin lesions: {item.skinLesions ? 'yes' : 'no'} · Ear issues:{' '}
                {item.earIssues ? 'yes' : 'no'}
              </Text>
              {item.triggers.length > 0 && (
                <Text style={styles.listItemSub}>
                  Triggers: {item.triggers.join(', ')}
                </Text>
              )}
              {item.bodyAreas && (
                <Text style={styles.listItemSub}>Areas: {item.bodyAreas}</Text>
              )}
              {item.notes ? <Text style={styles.listItemNote}>{item.notes}</Text> : null}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No allergy logs yet.</Text>
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
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  toggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginRight: 8,
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
    marginTop: 4,
  },
  triggerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  triggerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: colors.cardBackground,
  },
  triggerChipActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: '#E6F0FF',
  },
  triggerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  triggerTextActive: {
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

export default AllergyScreen;


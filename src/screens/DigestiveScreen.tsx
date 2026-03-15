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
import { StoolLog } from '../types';
import { colors } from '../theme/colors';

const DigestiveScreen: React.FC = () => {
  const { currentDog } = useDogContext();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [logs, setLogs] = useState<StoolLog[]>([]);
  const [stoolScore, setStoolScore] = useState('');
  const [hasBlood, setHasBlood] = useState(false);
  const [hasMucus, setHasMucus] = useState(false);
  const [vomiting, setVomiting] = useState(false);
  const [diarrhea, setDiarrhea] = useState(false);
  const [appetite, setAppetite] = useState<'normal' | 'low' | 'none' | 'high' | ''>('');
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
          'SELECT * FROM stool_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 50',
          [currentDog.id]
        );
        const items: StoolLog[] = rows.map((row: any) => ({
          id: row.id,
          dogId: row.dogId,
          stoolScore: row.stoolScore,
          hasBlood: !!row.hasBlood,
          hasMucus: !!row.hasMucus,
          vomiting: !!row.vomiting,
          diarrhea: !!row.diarrhea,
          appetite: row.appetite,
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

  const toggle = (value: boolean, setter: (v: boolean) => void) => setter(!value);

  const handleSave = () => {
    if (!currentDog) {
      Alert.alert('Add a dog first', 'You need a dog profile to log digestive health.');
      return;
    }
    const scoreVal = Number(stoolScore);
    const score =
      Number.isFinite(scoreVal) && scoreVal >= 1 && scoreVal <= 7 ? Math.round(scoreVal) : null;
    const id = `${Date.now()}`;
    const createdAt = new Date().toISOString();
    const db = getDb();
    db.runAsync(
      `INSERT INTO stool_logs
        (id, dogId, stoolScore, hasBlood, hasMucus, vomiting, diarrhea, appetite, createdAt, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        currentDog.id,
        score,
        hasBlood ? 1 : 0,
        hasMucus ? 1 : 0,
        vomiting ? 1 : 0,
        diarrhea ? 1 : 0,
        appetite || null,
        createdAt,
        notes || null,
      ]
    )
      .then(() => {
        const item: StoolLog = {
          id,
          dogId: currentDog.id,
          stoolScore: score ?? undefined,
          hasBlood,
          hasMucus,
          vomiting,
          diarrhea,
          appetite: appetite || undefined,
          createdAt,
          notes: notes || undefined,
        };
        setLogs((prev) => [item, ...prev]);
        setStoolScore('');
        setHasBlood(false);
        setHasMucus(false);
        setVomiting(false);
        setDiarrhea(false);
        setAppetite('');
        setNotes('');
      })
      .catch(() => {
        Alert.alert('Error', 'Could not save digestive log.');
      });
  };

  const appetiteOptions: Array<StoolLog['appetite']> = ['normal', 'low', 'none', 'high'];

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
          <Text style={styles.title}>Digestive health</Text>
      <Text style={styles.subtitle}>
        Track stool quality, vomiting, diarrhea, and appetite to support IBD or sensitive stomach
        cases.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>New log</Text>
        <TextInput
          style={styles.input}
          placeholder="Stool score (1–7)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={stoolScore}
          onChangeText={setStoolScore}
        />

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleChip, hasBlood && styles.toggleChipActive]}
            onPress={() => toggle(hasBlood, setHasBlood)}
          >
            <Text
              style={[styles.toggleText, hasBlood && styles.toggleTextActive]}
            >
              Blood
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleChip, hasMucus && styles.toggleChipActive]}
            onPress={() => toggle(hasMucus, setHasMucus)}
          >
            <Text
              style={[styles.toggleText, hasMucus && styles.toggleTextActive]}
            >
              Mucus
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleChip, vomiting && styles.toggleChipActive]}
            onPress={() => toggle(vomiting, setVomiting)}
          >
            <Text
              style={[styles.toggleText, vomiting && styles.toggleTextActive]}
            >
              Vomiting
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleChip, diarrhea && styles.toggleChipActive]}
            onPress={() => toggle(diarrhea, setDiarrhea)}
          >
            <Text
              style={[styles.toggleText, diarrhea && styles.toggleTextActive]}
            >
              Diarrhea
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Appetite</Text>
        <View style={styles.toggleRow}>
          {appetiteOptions.map((option) => {
            const active = appetite === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.toggleChip, active && styles.toggleChipActive]}
                onPress={() => setAppetite(option || '')}
              >
                <Text
                  style={[styles.toggleText, active && styles.toggleTextActive]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="Optional notes (diet changes, etc.)"
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save digestive log</Text>
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
              {item.stoolScore != null && (
                <Text style={styles.listItemSub}>Stool score: {item.stoolScore}/7</Text>
              )}
              <Text style={styles.listItemSub}>
                Blood: {item.hasBlood ? 'yes' : 'no'} · Mucus: {item.hasMucus ? 'yes' : 'no'}
              </Text>
              <Text style={styles.listItemSub}>
                Vomiting: {item.vomiting ? 'yes' : 'no'} · Diarrhea: {item.diarrhea ? 'yes' : 'no'}
              </Text>
              {item.appetite && (
                <Text style={styles.listItemSub}>Appetite: {item.appetite}</Text>
              )}
              {item.notes ? <Text style={styles.listItemNote}>{item.notes}</Text> : null}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No digestive logs yet.</Text>
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

export default DigestiveScreen;


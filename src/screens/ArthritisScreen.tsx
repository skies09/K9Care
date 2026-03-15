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
import { MobilityLog } from '../types';
import { colors } from '../theme/colors';

const ArthritisScreen: React.FC = () => {
  const { currentDog } = useDogContext();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [logs, setLogs] = useState<MobilityLog[]>([]);
  const [stiffness, setStiffness] = useState('');
  const [stairs, setStairs] = useState('');
  const [jumping, setJumping] = useState('');
  const [walk, setWalk] = useState('');
  const [pain, setPain] = useState('');
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
          'SELECT * FROM mobility_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 50',
          [currentDog.id]
        );
        const items: MobilityLog[] = rows.map((row: any) => ({
          id: row.id,
          dogId: row.dogId,
          stiffnessOnWaking: row.stiffnessOnWaking,
          stairsDifficulty: row.stairsDifficulty,
          jumpingDifficulty: row.jumpingDifficulty,
          walkTolerance: row.walkTolerance,
          overallPain: row.overallPain,
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
      Alert.alert('Add a dog first', 'You need a dog profile to log mobility.');
      return;
    }
    const parse = (value: string) => {
      const num = Number(value);
      if (!Number.isFinite(num) || num < 1 || num > 5) return null;
      return Math.round(num);
    };
    const id = `mobility_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const db = getDb();
    const stiffnessVal = parse(stiffness);
    const stairsVal = parse(stairs);
    const jumpingVal = parse(jumping);
    const walkVal = parse(walk);
    const painVal = parse(pain);

    db.runAsync(
      `INSERT INTO mobility_logs
        (id, dogId, stiffnessOnWaking, stairsDifficulty, jumpingDifficulty, walkTolerance, overallPain, createdAt, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        currentDog.id,
        stiffnessVal,
        stairsVal,
        jumpingVal,
        walkVal,
        painVal,
        createdAt,
        notes || null,
      ]
    )
      .then(() => {
        const item: MobilityLog = {
          id,
          dogId: currentDog.id,
          stiffnessOnWaking: stiffnessVal ?? undefined,
          stairsDifficulty: stairsVal ?? undefined,
          jumpingDifficulty: jumpingVal ?? undefined,
          walkTolerance: walkVal ?? undefined,
          overallPain: painVal ?? undefined,
          createdAt,
          notes: notes || undefined,
        };
        setLogs((prev) => [item, ...prev]);
        setStiffness('');
        setStairs('');
        setJumping('');
        setWalk('');
        setPain('');
        setNotes('');
      })
      .catch(() => {
        Alert.alert('Error', 'Could not save mobility log.');
      });
  };

  const renderScore = (label: string, value?: number | null) => {
    if (value == null) return null;
    return (
      <Text style={styles.listItemSub}>
        {label}: {value}/5
      </Text>
    );
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
          <Text style={styles.title}>Arthritis & mobility</Text>
      <Text style={styles.subtitle}>
        Track mobility and pain scores (1–5). Higher numbers mean more difficulty or pain.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>New check-in</Text>
        <TextInput
          style={styles.input}
          placeholder="Stiffness on waking (1–5)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={stiffness}
          onChangeText={setStiffness}
        />
        <TextInput
          style={styles.input}
          placeholder="Stairs difficulty (1–5)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={stairs}
          onChangeText={setStairs}
        />
        <TextInput
          style={styles.input}
          placeholder="Jumping difficulty (1–5)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={jumping}
          onChangeText={setJumping}
        />
        <TextInput
          style={styles.input}
          placeholder="Walk tolerance (1–5)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={walk}
          onChangeText={setWalk}
        />
        <TextInput
          style={styles.input}
          placeholder="Overall pain (1–5)"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={pain}
          onChangeText={setPain}
        />
        <TextInput
          style={[styles.input, styles.noteInput]}
          placeholder="Optional notes"
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Save check-in</Text>
        </TouchableOpacity>
      </View>

        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          style={styles.list}
          scrollEnabled={false}
          ListHeaderComponent={<Text style={styles.listTitle}>Recent check-ins</Text>}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listItemTitle}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              {renderScore('Stiffness', item.stiffnessOnWaking)}
              {renderScore('Stairs', item.stairsDifficulty)}
              {renderScore('Jumping', item.jumpingDifficulty)}
              {renderScore('Walk', item.walkTolerance)}
              {renderScore('Pain', item.overallPain)}
              {item.notes ? <Text style={styles.listItemNote}>{item.notes}</Text> : null}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No mobility logs yet.</Text>
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

export default ArthritisScreen;


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
import { WeightLog } from '../types';
import { colors } from '../theme/colors';

const WeightScreen: React.FC = () => {
  const { currentDog } = useDogContext();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [logs, setLogs] = useState<WeightLog[]>([]);

  useEffect(() => {
    if (!currentDog) {
      setLogs([]);
      return;
    }
    const load = async () => {
      const db = getDb();
      try {
        const rows = await db.getAllAsync<any>(
          'SELECT * FROM weight_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 50',
          [currentDog.id]
        );
        const items: WeightLog[] = rows.map((row: any) => ({
          id: row.id,
          dogId: row.dogId,
          weightKg: row.weightKg,
          createdAt: row.createdAt,
          note: row.note,
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
      Alert.alert('Add a dog first', 'You need a dog profile to log weight.');
      return;
    }
    const numeric = Number(weight);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      Alert.alert('Enter weight', 'Please enter a positive weight in kg.');
      return;
    }
    const id = `weight_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const db = getDb();
    db.runAsync(
      'INSERT INTO weight_logs (id, dogId, weightKg, createdAt, note) VALUES (?, ?, ?, ?, ?)',
      [id, currentDog.id, numeric, createdAt, note || null]
    )
      .then(() => {
        const item: WeightLog = { id, dogId: currentDog.id, weightKg: numeric, createdAt, note };
        setLogs((prev) => [item, ...prev]);
        setWeight('');
        setNote('');
      })
      .catch(() => {
        Alert.alert('Error', 'Could not save weight log.');
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
          <Text style={styles.title}>Weight</Text>
          <Text style={styles.subtitle}>
            Log weight over time to monitor trends. Use alongside your vet&apos;s advice.
          </Text>

          {logs.length > 0 && (
            <View style={styles.latestCard}>
              <View style={styles.latestLeft}>
                <Ionicons name="scale-outline" size={22} color={colors.primaryBlue} />
                <Text style={styles.latestLabel}>Latest</Text>
              </View>
              <Text style={styles.latestValue}>{logs[0].weightKg.toFixed(1)} kg</Text>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="scale-outline" size={28} color={colors.primaryBlue} />
              </View>
              <View style={styles.cardTitleBlock}>
                <Text style={styles.cardTitle}>Log weight</Text>
                <Text style={styles.cardSubtitle}>
                  {currentDog ? `Weight in kg for ${currentDog.name}` : 'Add a dog first'}
                </Text>
              </View>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Weight (kg)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
            />
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Optional note (diet change, etc.)"
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={setNote}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
              <Text style={styles.primaryButtonText}>Save weight</Text>
            </TouchableOpacity>
          </View>

          <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          style={styles.list}
          scrollEnabled={false}
          ListHeaderComponent={<Text style={styles.listTitle}>Recent weights</Text>}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Text style={styles.listItemTitle}>{item.weightKg.toFixed(1)} kg</Text>
              <Text style={styles.listItemSub}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              {item.note ? <Text style={styles.listItemNote}>{item.note}</Text> : null}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No weights logged yet.</Text>
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
  latestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 16,
  },
  latestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  latestLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  latestValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
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
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    minHeight: 52,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
  list: {
    flex: 1,
    marginTop: 4,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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

export default WeightScreen;


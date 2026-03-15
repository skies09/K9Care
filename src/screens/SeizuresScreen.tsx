import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../db/database';
import { useDogContext } from '../context/DogContext';
import { SeizureEvent } from '../types';
import { colors } from '../theme/colors';

const CLUSTER_WINDOW_HOURS = 24;
const CLUSTER_THRESHOLD = 3;

const SeizuresScreen: React.FC = () => {
  const { currentDog } = useDogContext();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [seizures, setSeizures] = useState<SeizureEvent[]>([]);

  useEffect(() => {
    if (!currentDog) return;
    const load = async () => {
      const db = getDb();
      try {
        const rows = await db.getAllAsync<any>(
          'SELECT * FROM seizure_events WHERE dogId = ? ORDER BY datetime(startTime) DESC LIMIT 50',
          [currentDog.id]
        );
        const list: SeizureEvent[] = rows.map((row: any) => ({
          id: row.id,
          dogId: row.dogId,
          startTime: row.startTime,
          endTime: row.endTime,
          durationSeconds: row.durationSeconds,
          severity: row.severity,
          checklist: row.checklistJson ? JSON.parse(row.checklistJson) : undefined,
          triggers: row.triggers,
          notes: row.notes,
        }));
        setSeizures(list);
      } catch {
        // ignore
      }
    };
    void load();
  }, [currentDog]);

  useEffect(() => {
    if (!running || !startTime) return;
    const id = setInterval(() => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running, startTime]);

  const startSeizure = () => {
    if (!currentDog) {
      Alert.alert('Add a dog first', 'You need a dog profile to log seizures.');
      return;
    }
    setStartTime(new Date());
    setElapsed(0);
    setRunning(true);
  };

  const stopSeizure = async () => {
    if (!currentDog || !startTime) return;
    const end = new Date();
    const duration = Math.max(1, Math.floor((end.getTime() - startTime.getTime()) / 1000));
    const id = `seizure_${Date.now()}`;
    const db = getDb();
    try {
      await db.runAsync(
        'INSERT INTO seizure_events (id, dogId, startTime, endTime, durationSeconds) VALUES (?, ?, ?, ?, ?)',
        [id, currentDog.id, startTime.toISOString(), end.toISOString(), duration]
      );
      const item: SeizureEvent = {
        id,
        dogId: currentDog.id,
        startTime: startTime.toISOString(),
        endTime: end.toISOString(),
        durationSeconds: duration,
      };
      setSeizures((prev) => [item, ...prev]);
    } catch {
      Alert.alert('Error', 'Could not save seizure event.');
    }

    setRunning(false);
    setStartTime(null);
    setElapsed(0);
  };

  const recentSeizuresCount = (() => {
    if (!seizures.length) return 0;
    const now = Date.now();
    const windowMs = CLUSTER_WINDOW_HOURS * 60 * 60 * 1000;
    return seizures.filter((s) => now - new Date(s.startTime).getTime() <= windowMs).length;
  })();

  const showClusterWarning = recentSeizuresCount >= CLUSTER_THRESHOLD;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 4 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Seizures</Text>
      <Text style={styles.subtitle}>
        Time seizures so you can share accurate information with your vet. If you&apos;re worried,
        contact your vet or emergency clinic.
      </Text>

      {showClusterWarning && (
        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Multiple seizures in 24 hours</Text>
          <Text style={styles.warningText}>
            Several seizures in a short time can be an emergency. Consider contacting your vet or
            local emergency clinic immediately.
          </Text>
        </View>
      )}

      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>Current seizure timer</Text>
        <Text style={styles.timerValue}>{formatDuration(elapsed)}</Text>
        <TouchableOpacity
          style={[styles.timerButton, running ? styles.timerButtonStop : styles.timerButtonStart]}
          onPress={running ? stopSeizure : startSeizure}
          activeOpacity={0.85}
        >
          <Text style={styles.timerButtonText}>{running ? 'Seizure ended – tap to save' : 'Start seizure timer'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={seizures}
        keyExtractor={(item) => item.id}
        style={styles.list}
        scrollEnabled={false}
        ListHeaderComponent={
          <Text style={styles.listTitle}>Recent seizures</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>
              {formatDuration(item.durationSeconds)} –{' '}
              {new Date(item.startTime).toLocaleDateString()}
            </Text>
            <Text style={styles.listItemSub}>
              Started at {new Date(item.startTime).toLocaleTimeString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No seizures recorded yet.</Text>
        }
      />
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
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
  warningCard: {
    backgroundColor: colors.dangerSoft,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  timerCard: {
    backgroundColor: colors.cardBackground,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  timerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 20,
    fontVariant: ['tabular-nums'],
  },
  timerButton: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  timerButtonStart: {
    backgroundColor: colors.primaryBlue,
  },
  timerButtonStop: {
    backgroundColor: colors.danger,
  },
  timerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
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
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
});

export default SeizuresScreen;


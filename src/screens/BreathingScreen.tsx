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
import { BreathingCheck } from '../types';
import { colors } from '../theme/colors';
import { Button as AppButton } from '../components/ui/Button';

const BREATH_COUNT_WINDOW_SECONDS = 30;

type Phase = 'idle' | 'counting' | 'finished';

const BreathingScreen: React.FC = () => {
  const { currentDog } = useDogContext();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [breathCount, setBreathCount] = useState(0);
  const [checks, setChecks] = useState<BreathingCheck[]>([]);

  const secondsLeft = Math.max(0, BREATH_COUNT_WINDOW_SECONDS - secondsElapsed);
  const bpmResult = breathCount * 2; // 30 sec × 2 = breaths per minute

  useEffect(() => {
    if (!currentDog) return;
    const load = async () => {
      const db = getDb();
      try {
        const rows = await db.getAllAsync<any>(
          'SELECT * FROM breathing_checks WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 50',
          [currentDog.id]
        );
        const list: BreathingCheck[] = rows.map((row: any) => ({
          id: row.id,
          dogId: row.dogId,
          breathsPerMinute: row.breathsPerMinute,
          durationSeconds: row.durationSeconds,
          context: row.context,
          createdAt: row.createdAt,
          notes: row.notes,
        }));
        setChecks(list);
      } catch {
        // ignore
      }
    };
    void load();
  }, [currentDog]);

  useEffect(() => {
    if (phase !== 'counting') return;
    if (secondsElapsed >= BREATH_COUNT_WINDOW_SECONDS) {
      setPhase('finished');
      return;
    }
    const id = setTimeout(() => setSecondsElapsed((s) => s + 1), 1000);
    return () => clearTimeout(id);
  }, [phase, secondsElapsed]);

  const onCircleTap = () => {
    if (!currentDog) {
      Alert.alert('Add a dog first', 'You need a dog profile to log breathing.');
      return;
    }
    if (phase === 'idle') {
      setPhase('counting');
      setSecondsElapsed(0);
      setBreathCount(1);
      return;
    }
    if (phase === 'counting') {
      setBreathCount((c) => c + 1);
    }
  };

  const saveResult = async () => {
    if (!currentDog) return;
    const id = `breathing_${Date.now()}`;
    const createdAt = new Date().toISOString();
    const db = getDb();
    try {
      await db.runAsync(
        'INSERT INTO breathing_checks (id, dogId, breathsPerMinute, durationSeconds, context, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [id, currentDog.id, bpmResult, BREATH_COUNT_WINDOW_SECONDS, 'resting', createdAt]
      );
      const newItem: BreathingCheck = {
        id,
        dogId: currentDog.id,
        breathsPerMinute: bpmResult,
        durationSeconds: BREATH_COUNT_WINDOW_SECONDS,
        context: 'resting',
        createdAt,
      };
      setChecks((prev) => [newItem, ...prev]);
      setPhase('idle');
      setBreathCount(0);
      setSecondsElapsed(0);
    } catch {
      Alert.alert('Error', 'Could not save breathing check.');
    }
  };

  const startAgain = () => {
    setPhase('idle');
    setBreathCount(0);
    setSecondsElapsed(0);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <StatusBar style="dark" />
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
      <Text style={styles.title}>Heart – Resting breathing rate</Text>
      <Text style={styles.disclaimer}>
        Breathing should be monitored when your dog is resting. Count each full rise and fall of the
        chest as one breath. This is for informational use only and does not replace veterinary
        advice.
      </Text>

      {/* Timer above circle */}
      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>
          {phase === 'idle' ? 'Tap circle to start' : phase === 'counting' ? 'Counting…' : 'Done'}
        </Text>
        <Text style={styles.timerValue}>{formatTime(phase === 'counting' ? secondsLeft : phase === 'finished' ? 0 : BREATH_COUNT_WINDOW_SECONDS)}</Text>
      </View>

      {/* Tap-to-count circle */}
      <TouchableOpacity
        style={styles.circleTouchable}
        onPress={onCircleTap}
        activeOpacity={0.9}
        disabled={phase === 'finished'}
      >
        <View style={[styles.circle, phase === 'counting' && styles.circleActive]}>
          <Text
            style={[
              styles.circleText,
              phase === 'idle' ? styles.circleTextIdle : styles.circleTextCount,
            ]}
          >
            {phase === 'idle' && 'Tap to start'}
            {phase === 'counting' && breathCount}
            {phase === 'finished' && breathCount}
          </Text>
        </View>
      </TouchableOpacity>

      {phase === 'counting' && (
        <View style={styles.stopRow}>
          <AppButton title="Stop" onPress={() => setPhase('finished')} style={styles.stopButton} />
        </View>
      )}

      {phase === 'finished' && (
        <View style={styles.resultSection}>
          <Text style={styles.resultLabel}>Resting breathing rate</Text>
          <Text style={styles.resultValue}>{bpmResult} breaths/min</Text>
          <View style={styles.resultActions}>
            <AppButton title="Save" onPress={saveResult} style={styles.resultButton} />
            <AppButton title="Start again" onPress={startAgain} style={styles.resultButton} />
          </View>
        </View>
      )}

      <FlatList
        data={checks}
        keyExtractor={(item) => item.id}
        style={styles.list}
        scrollEnabled={false}
        ListHeaderComponent={<Text style={styles.listTitle}>Recent checks</Text>}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.breathsPerMinute} breaths/min</Text>
            <Text style={styles.listItemSub}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No breathing checks yet.</Text>
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
  disclaimer: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  circleTouchable: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  stopRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stopButton: {
    minWidth: 140,
  },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.cardBackground,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  circleActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: '#E6F0FF',
  },
  circleText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  circleTextIdle: {
    fontSize: 18,
  },
  circleTextCount: {
    fontSize: 42,
  },
  resultSection: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 16,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  resultButton: {
    minWidth: 120,
  },
  list: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  listItem: {
    paddingVertical: 10,
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
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
});

export default BreathingScreen;

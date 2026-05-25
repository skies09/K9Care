import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../db/database';
import { useDogContext } from '../context/DogContext';
import { SeizureEvent } from '../types';
import { colors } from '../theme/colors';
import { fonts, textStyles } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { Button as AppButton } from '../components/ui/Button';

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
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualStart, setManualStart] = useState(new Date());
  const [showManualStartPicker, setShowManualStartPicker] = useState(false);
  const [manualDurationMins, setManualDurationMins] = useState('');
  const [manualDurationSecs, setManualDurationSecs] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  const loadSeizures = useCallback(async () => {
    if (!currentDog) {
      setSeizures([]);
      return;
    }
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
  }, [currentDog]);

  useEffect(() => {
    void loadSeizures();
  }, [loadSeizures]);

  useEffect(() => {
    if (!running || !startTime) return;
    const id = setInterval(() => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running, startTime]);

  const resetManualForm = () => {
    setManualStart(new Date());
    setManualDurationMins('');
    setManualDurationSecs('');
    setManualNotes('');
    setShowManualStartPicker(false);
  };

  const closeManualForm = () => {
    resetManualForm();
    setShowManualForm(false);
  };

  const startSeizure = () => {
    if (!currentDog) {
      Alert.alert('Add a dog first', 'You need a dog profile to log seizures.');
      return;
    }
    if (showManualForm) closeManualForm();
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

  const toggleManualForm = () => {
    if (showManualForm) {
      closeManualForm();
      return;
    }
    if (running) {
      Alert.alert(
        'Timer running',
        'Stop the seizure timer before logging a manual entry.'
      );
      return;
    }
    setShowManualForm(true);
  };

  const saveManualEntry = async () => {
    if (!currentDog) {
      Alert.alert('Add a dog first', 'You need a dog profile to log seizures.');
      return;
    }
    const mins = parseInt(manualDurationMins || '0', 10);
    const secs = parseInt(manualDurationSecs || '0', 10);
    const durationSeconds = mins * 60 + secs;
    if (!Number.isFinite(durationSeconds) || durationSeconds < 1) {
      Alert.alert('Duration required', 'Enter how long the seizure lasted.');
      return;
    }
    const start = manualStart;
    const end = new Date(start.getTime() + durationSeconds * 1000);
    const id = `seizure_${Date.now()}`;
    const db = getDb();
    try {
      await db.runAsync(
        'INSERT INTO seizure_events (id, dogId, startTime, endTime, durationSeconds, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [
          id,
          currentDog.id,
          start.toISOString(),
          end.toISOString(),
          durationSeconds,
          manualNotes.trim() || null,
        ]
      );
      await loadSeizures();
      closeManualForm();
    } catch {
      Alert.alert('Error', 'Could not save seizure event.');
    }
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
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
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

        <TouchableOpacity
          style={styles.manualToggle}
          onPress={toggleManualForm}
          activeOpacity={0.7}
          disabled={!showManualForm && running}
        >
          <Text
            style={[
              styles.manualToggleText,
              !showManualForm && running && styles.manualToggleDisabled,
            ]}
          >
            {showManualForm ? 'Cancel manual entry' : 'Log manual entry'}
          </Text>
        </TouchableOpacity>

        {showManualForm && (
          <View style={styles.manualForm}>
            <Text style={styles.manualLabel}>When did it start?</Text>
            <TouchableOpacity
              style={styles.manualInput}
              onPress={() => setShowManualStartPicker(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.manualInputText}>
                {manualStart.toLocaleString()}
              </Text>
            </TouchableOpacity>
            {showManualStartPicker && (
              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={manualStart}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, selected) => {
                    if (Platform.OS !== 'ios') setShowManualStartPicker(false);
                    if (!selected) return;
                    setManualStart(selected);
                  }}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.pickerDone}
                    onPress={() => setShowManualStartPicker(false)}
                  >
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Text style={styles.manualLabel}>How long did it last?</Text>
            <View style={styles.durationRow}>
              <View style={styles.durationField}>
                <TextInput
                  style={styles.durationInput}
                  value={manualDurationMins}
                  onChangeText={setManualDurationMins}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={styles.durationUnit}>min</Text>
              </View>
              <View style={styles.durationField}>
                <TextInput
                  style={styles.durationInput}
                  value={manualDurationSecs}
                  onChangeText={setManualDurationSecs}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.durationUnit}>sec</Text>
              </View>
            </View>

            <Text style={styles.manualLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.manualInput, styles.notesInput]}
              value={manualNotes}
              onChangeText={setManualNotes}
              placeholder="What happened, triggers, recovery…"
              placeholderTextColor={colors.textSecondary}
              multiline
            />

            <AppButton
              title="Save manual entry"
              onPress={saveManualEntry}
              variant="primary"
              size="large"
              style={styles.manualSaveButton}
            />
          </View>
        )}
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
    ...textStyles.screenTitle,
    marginBottom: 4,
  },
  subtitle: {
    ...textStyles.subtitle,
    fontSize: 14,
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
    shadowColor: colors.shadow,
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
    backgroundColor: colors.primary,
  },
  timerButtonStop: {
    backgroundColor: colors.danger,
  },
  timerButtonText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 20,
  },
  manualToggle: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  manualToggleText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  manualToggleDisabled: {
    color: colors.textSecondary,
    textDecorationLine: 'none',
  },
  manualForm: {
    alignSelf: 'stretch',
    width: '100%',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  manualLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  manualInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  manualInputText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  pickerWrap: {
    marginTop: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  pickerDone: {
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pickerDoneText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  durationInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: 10,
    minWidth: 0,
  },
  durationUnit: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  notesInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  manualSaveButton: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
    width: '100%',
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


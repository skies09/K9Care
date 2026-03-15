import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, RootTabParamList } from '../navigation/RootNavigator';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDogContext } from '../context/DogContext';
import { getDb } from '../db/database';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Card } from '../components/ui/Card';
import { Button as AppButton } from '../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import type { ConditionTag } from '../types';

type TabProps = BottomTabScreenProps<RootTabParamList, 'HomeTab'>;

type HomeStats = {
  weightLogsCount: number;
  recentWeights: number[];
  breathingCount: number;
  seizureCount: number;
  medsCount: number;
  mobilityCount: number;
  allergyCount: number;
  stoolCount: number;
  insulinCount: number;
  glucoseCount: number;
  kidneyCount: number;
  anxietyCount: number;
};

const defaultStats: HomeStats = {
  weightLogsCount: 0,
  recentWeights: [],
  breathingCount: 0,
  seizureCount: 0,
  medsCount: 0,
  mobilityCount: 0,
  allergyCount: 0,
  stoolCount: 0,
  insulinCount: 0,
  glucoseCount: 0,
  kidneyCount: 0,
  anxietyCount: 0,
};

const CONDITION_STAT_CONFIG: Record<
  ConditionTag,
  { label: string; icon: keyof typeof Ionicons.glyphMap; statKey: keyof HomeStats }
> = {
  heart: { label: 'Breathing checks', icon: 'fitness-outline', statKey: 'breathingCount' },
  epilepsy: { label: 'Seizure events', icon: 'pulse-outline', statKey: 'seizureCount' },
  arthritis: { label: 'Mobility check-ins', icon: 'body-outline', statKey: 'mobilityCount' },
  allergy: { label: 'Allergy logs', icon: 'leaf-outline', statKey: 'allergyCount' },
  digestive: { label: 'Digestive logs', icon: 'nutrition-outline', statKey: 'stoolCount' },
  diabetes: { label: 'Insulin / glucose', icon: 'medical-outline', statKey: 'insulinCount' },
  kidney: { label: 'Kidney logs', icon: 'water-outline', statKey: 'kidneyCount' },
  anxiety: { label: 'Anxiety episodes', icon: 'happy-outline', statKey: 'anxietyCount' },
};

function useHomeStats(dogId: string | null) {
  const [stats, setStats] = useState<HomeStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (showLoader = true) => {
    if (!dogId) {
      setStats(defaultStats);
      setLoading(false);
      return;
    }
    if (showLoader) setLoading(true);
    const db = getDb();
    try {
      const [
        weightRows,
        breathingRows,
        seizureRows,
        medRows,
        mobilityRows,
        allergyRows,
        stoolRows,
        insulinRows,
        glucoseRows,
        kidneyRows,
        anxietyRows,
      ] = await Promise.all([
        db.getAllAsync<any>(
          'SELECT weightKg FROM weight_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 5',
          [dogId]
        ),
        db.getAllAsync<any>('SELECT id FROM breathing_checks WHERE dogId = ?', [dogId]),
        db.getAllAsync<any>('SELECT id FROM seizure_events WHERE dogId = ?', [dogId]),
        db.getAllAsync<any>('SELECT id FROM medications WHERE dogId = ?', [dogId]),
        db.getAllAsync<any>('SELECT id FROM mobility_logs WHERE dogId = ?', [dogId]),
        db.getAllAsync<any>('SELECT id FROM allergy_logs WHERE dogId = ?', [dogId]),
        db.getAllAsync<any>('SELECT id FROM stool_logs WHERE dogId = ?', [dogId]),
        db.getAllAsync<any>('SELECT id FROM insulin_logs WHERE dogId = ?', [dogId]),
        db.getAllAsync<any>('SELECT id FROM glucose_readings WHERE dogId = ?', [dogId]),
        db.getAllAsync<any>('SELECT id FROM kidney_logs WHERE dogId = ?', [dogId]),
        db.getAllAsync<any>('SELECT id FROM anxiety_logs WHERE dogId = ?', [dogId]),
      ]);
      const weightCountResult = await db.getFirstAsync<{ n: number }>(
        'SELECT COUNT(*) as n FROM weight_logs WHERE dogId = ?',
        [dogId]
      );
      const weightLogsCount = weightCountResult?.n ?? 0;
      const recentWeights = (weightRows || []).map((r: any) => r.weightKg).filter(Number.isFinite);
      setStats({
        weightLogsCount,
        recentWeights,
        breathingCount: (breathingRows || []).length,
        seizureCount: (seizureRows || []).length,
        medsCount: (medRows || []).length,
        mobilityCount: (mobilityRows || []).length,
        allergyCount: (allergyRows || []).length,
        stoolCount: (stoolRows || []).length,
        insulinCount: (insulinRows || []).length,
        glucoseCount: (glucoseRows || []).length,
        kidneyCount: (kidneyRows || []).length,
        anxietyCount: (anxietyRows || []).length,
      });
    } catch {
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  }, [dogId]);

  useEffect(() => {
    load(true);
  }, [load]);

  const refresh = useCallback(() => {
    load(false);
  }, [load]);

  return { stats, loading, refresh };
}

const HomeScreen: React.FC<TabProps> = ({ navigation }) => {
  const { dogs, currentDogId, setCurrentDogId, currentDog } = useDogContext();
  const { stats, loading, refresh } = useHomeStats(currentDog?.id ?? null);
  const parentNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      if (currentDog?.id) refresh();
    }, [currentDog?.id, refresh])
  );

  const conditionTags = currentDog?.primaryConditions ?? [];
  const hasAnyData =
    stats.weightLogsCount > 0 ||
    stats.medsCount > 0 ||
    conditionTags.some((tag) => {
      const config = CONDITION_STAT_CONFIG[tag];
      if (!config) return false;
      if (tag === 'diabetes') return stats.insulinCount > 0 || stats.glucoseCount > 0;
      return (stats[config.statKey] as number) > 0;
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>K9Care</Text>
        {dogs.length > 1 ? (
          <View style={styles.dogSelectorRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dogSelectorScroll}
            >
              {dogs.map((d) => {
                const isActive = d.id === currentDogId;
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.dogChip, isActive && styles.dogChipActive]}
                    onPress={() => setCurrentDogId(d.id)}
                  >
                    <Text style={[styles.dogChipText, isActive && styles.dogChipTextActive]}>
                      {d.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : currentDog ? (
          <Text style={styles.subtitle}>Hi, {currentDog.name}</Text>
        ) : (
          <Text style={styles.subtitle}>Add a dog to get started</Text>
        )}
      </View>

      {/* Track weight – hero CTA */}
      <TouchableOpacity
        style={styles.weightCard}
        onPress={() => parentNavigation.navigate('Weight')}
        activeOpacity={0.9}
      >
        <View style={styles.weightCardInner}>
          <View style={styles.weightHeader}>
            <View style={styles.weightIconWrap}>
              <Ionicons name="scale-outline" size={28} color={colors.primaryBlue} />
            </View>
            <View style={styles.weightTitleBlock}>
              <Text style={styles.weightTitle}>Track weight</Text>
              <Text style={styles.weightSubtitle}>
                {currentDog
                  ? stats.recentWeights.length > 0
                    ? `Latest: ${stats.recentWeights[0]} kg`
                    : 'Log weight for ' + currentDog.name
                  : 'Add a dog first'}
              </Text>
            </View>
          </View>
          {stats.recentWeights.length > 0 && (
            <View style={styles.miniChart}>
              <Text style={styles.miniChartLabel}>Last {stats.recentWeights.length} entries</Text>
              <View style={styles.barRow}>
                {stats.recentWeights.slice(0, 5).map((kg, i) => {
                  const max = Math.max(...stats.recentWeights);
                  const h = max > 0 ? (kg / max) * 24 : 0;
                  return (
                    <View key={i} style={[styles.bar, { height: Math.max(h, 4) }]} />
                  );
                })}
              </View>
              <View style={styles.barLabels}>
                {stats.recentWeights.slice(0, 5).map((kg, i) => (
                  <Text key={i} style={styles.barLabel} numberOfLines={1}>
                    {kg}
                  </Text>
                ))}
              </View>
            </View>
          )}
          {currentDog && (
            <AppButton
              title={stats.weightLogsCount > 0 ? 'Log weight' : 'Log first weight'}
              onPress={() => parentNavigation.navigate('Weight')}
              style={styles.weightCardButton}
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Seizures quick access – only when epilepsy is selected for this dog */}
      {currentDog?.primaryConditions?.includes('epilepsy') && (
        <TouchableOpacity
          style={styles.seizureCard}
          onPress={() => parentNavigation.navigate('Seizures')}
          activeOpacity={0.9}
        >
          <View style={styles.seizureCardInner}>
            <View style={styles.seizureHeader}>
              <View style={styles.seizureIconWrap}>
                <Ionicons name="pulse-outline" size={28} color={colors.primaryBlue} />
              </View>
              <View style={styles.seizureTitleBlock}>
                <Text style={styles.seizureTitle}>Seizures</Text>
                <Text style={styles.seizureSubtitle}>Start timer quickly for {currentDog.name}</Text>
              </View>
            </View>
            <AppButton
              title="Start seizure timer"
              onPress={() => parentNavigation.navigate('Seizures')}
              style={styles.seizureCardButton}
            />
          </View>
        </TouchableOpacity>
      )}

      {/* Data at a glance – only for conditions this dog is tracking */}
      {currentDog && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your data</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primaryBlue} style={styles.loader} />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statTile}>
                <Ionicons name="scale-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.statValue}>{stats.weightLogsCount}</Text>
                <Text style={styles.statLabel}>Weight logs</Text>
              </View>
              {conditionTags.map((tag) => {
                const config = CONDITION_STAT_CONFIG[tag];
                if (!config) return null;
                const value =
                  tag === 'diabetes'
                    ? stats.insulinCount + stats.glucoseCount
                    : (stats[config.statKey] as number);
                return (
                  <View key={tag} style={styles.statTile}>
                    <Ionicons name={config.icon} size={22} color={colors.textSecondary} />
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statLabel}>{config.label}</Text>
                  </View>
                );
              })}
              <View style={styles.statTile}>
                <Ionicons name="medkit-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.statValue}>{stats.medsCount}</Text>
                <Text style={styles.statLabel}>Medications</Text>
              </View>
            </View>
          )}
          {!loading && !hasAnyData && (
            <Text style={styles.emptyDataText}>
              Use Track and Meds to log data. It will show here.
            </Text>
          )}
        </View>
      )}

      {/* Vet report */}
      <View style={styles.vetSection}>
        <Card>
          <View style={styles.vetCardContent}>
            <Ionicons name="document-text-outline" size={24} color={colors.primaryBlue} />
            <View style={styles.vetCardText}>
              <Text style={styles.vetCardTitle}>Vet report</Text>
              <Text style={styles.vetCardSubtitle}>
                Summary for your vet: trends and logs in one place
              </Text>
            </View>
          </View>
          <AppButton
            title="View vet report"
            onPress={() => parentNavigation.navigate('VetReport')}
            style={styles.vetReportButton}
          />
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: 16,
    color: colors.textSecondary,
  },
  dogSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  dogSelectorScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  dogChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dogChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  dogChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dogChipTextActive: {
    color: '#fff',
  },
  weightCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  weightCardInner: {
    padding: spacing.lg,
  },
  weightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  weightIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  weightTitleBlock: {
    flex: 1,
  },
  weightTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weightSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  miniChart: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  miniChartLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 28,
    gap: 4,
  },
  bar: {
    flex: 1,
    backgroundColor: colors.primaryBlue,
    borderRadius: 4,
    minWidth: 4,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 4,
  },
  barLabel: {
    flex: 1,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  weightCardButton: {
    alignSelf: 'flex-start',
  },
  seizureCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  seizureCardInner: {
    padding: spacing.lg,
  },
  seizureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  seizureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  seizureTitleBlock: {
    flex: 1,
  },
  seizureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seizureSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  seizureCardButton: {
    alignSelf: 'flex-start',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  loader: {
    marginVertical: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statTile: {
    width: '48%',
    minWidth: 140,
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyDataText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  vetSection: {
    marginTop: spacing.sm,
  },
  vetCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vetCardText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  vetCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vetCardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  vetReportButton: {
    alignSelf: 'flex-start',
  },
});

export default HomeScreen;

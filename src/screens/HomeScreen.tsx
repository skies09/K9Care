import React, { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
	RootStackParamList,
	RootTabParamList,
} from "../navigation/RootNavigator";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDogContext } from "../context/DogContext";
import { getDb } from "../db/database";
import { colors } from "../theme/colors";
import { fonts, textStyles } from "../theme/typography";
import { spacing } from "../theme/spacing";
import { Card } from "../components/ui/Card";
import { Button as AppButton } from "../components/ui/Button";
import { BrandIcon, BrandIconName } from "../components/BrandIcon";
import { Ionicons } from "@expo/vector-icons";
import {
	formatWeight,
	formatWeightValue,
	normalizeWeightUnit,
} from "../utils/weightUnits";
import type { ConditionTag, VetAppointment } from "../types";

function formatDateYYYYMMDD(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function formatAppointmentDate(isoDate: string): string {
	const parsed = new Date(`${isoDate}T00:00:00`);
	if (Number.isNaN(parsed.getTime())) return isoDate;
	return parsed.toLocaleDateString(undefined, {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

type TabProps = BottomTabScreenProps<RootTabParamList, "HomeTab">;

type HomeStats = {
	weightLogsCount: number;
	recentWeights: number[];
	breathingCount: number;
	recentBreathing: number[];
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
	recentBreathing: [],
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
	{
		label: string;
		icon: BrandIconName;
		statKey: keyof HomeStats;
		screen: keyof RootStackParamList;
	}
> = {
	heart: {
		label: "Breathing checks",
		icon: "heart",
		statKey: "breathingCount",
		screen: "Breathing",
	},
	epilepsy: {
		label: "Seizure events",
		icon: "seizures",
		statKey: "seizureCount",
		screen: "Seizures",
	},
	arthritis: {
		label: "Mobility check-ins",
		icon: "arthritis",
		statKey: "mobilityCount",
		screen: "Arthritis",
	},
	allergy: {
		label: "Allergy logs",
		icon: "allergies",
		statKey: "allergyCount",
		screen: "Allergies",
	},
	digestive: {
		label: "Digestion logs",
		icon: "digestion",
		statKey: "stoolCount",
		screen: "Digestive",
	},
	diabetes: {
		label: "Insulin / glucose",
		icon: "diabetes",
		statKey: "insulinCount",
		screen: "Diabetes",
	},
	kidney: {
		label: "Kidney logs",
		icon: "kidney",
		statKey: "kidneyCount",
		screen: "Kidney",
	},
	anxiety: {
		label: "Anxiety episodes",
		icon: "anxiety",
		statKey: "anxietyCount",
		screen: "Anxiety",
	},
};

function useHomeStats(dogId: string | null) {
	const [stats, setStats] = useState<HomeStats>(defaultStats);
	const [loading, setLoading] = useState(true);

	const load = useCallback(
		async (showLoader = true) => {
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
						"SELECT weightKg FROM weight_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 5",
						[dogId],
					),
					db.getAllAsync<any>(
						"SELECT breathsPerMinute FROM breathing_checks WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 5",
						[dogId],
					),
					db.getAllAsync<any>(
						"SELECT id FROM seizure_events WHERE dogId = ?",
						[dogId],
					),
					db.getAllAsync<any>(
						"SELECT id FROM medications WHERE dogId = ?",
						[dogId],
					),
					db.getAllAsync<any>(
						"SELECT id FROM mobility_logs WHERE dogId = ?",
						[dogId],
					),
					db.getAllAsync<any>(
						"SELECT id FROM allergy_logs WHERE dogId = ?",
						[dogId],
					),
					db.getAllAsync<any>(
						"SELECT id FROM stool_logs WHERE dogId = ?",
						[dogId],
					),
					db.getAllAsync<any>(
						"SELECT id FROM insulin_logs WHERE dogId = ?",
						[dogId],
					),
					db.getAllAsync<any>(
						"SELECT id FROM glucose_readings WHERE dogId = ?",
						[dogId],
					),
					db.getAllAsync<any>(
						"SELECT id FROM kidney_logs WHERE dogId = ?",
						[dogId],
					),
					db.getAllAsync<any>(
						"SELECT id FROM anxiety_logs WHERE dogId = ?",
						[dogId],
					),
				]);
				const weightCountResult = await db.getFirstAsync<{ n: number }>(
					"SELECT COUNT(*) as n FROM weight_logs WHERE dogId = ?",
					[dogId],
				);
				const weightLogsCount = weightCountResult?.n ?? 0;
				const recentWeights = (weightRows || [])
					.map((r: any) => r.weightKg)
					.filter(Number.isFinite);
				const recentBreathing = (breathingRows || [])
					.map((r: any) => r.breathsPerMinute)
					.filter(Number.isFinite);
				setStats({
					weightLogsCount,
					recentWeights,
					breathingCount: (breathingRows || []).length,
					recentBreathing,
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
		},
		[dogId],
	);

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
	const parentNavigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const [appointments, setAppointments] = useState<VetAppointment[]>([]);

	const loadAppointments = useCallback(async () => {
		if (!currentDog?.id) {
			setAppointments([]);
			return;
		}
		const db = getDb();
		const today = formatDateYYYYMMDD(new Date());
		try {
			const rows = await db.getAllAsync<any>(
				`SELECT * FROM vet_appointments
         WHERE dogId = ? AND appointmentDate >= ?
         ORDER BY appointmentDate ASC, appointmentTime ASC
         LIMIT 10`,
				[currentDog.id, today],
			);
			setAppointments(
				(rows || []).map((row) => ({
					id: row.id,
					dogId: row.dogId,
					appointmentDate: row.appointmentDate,
					appointmentTime: row.appointmentTime,
					reason: row.reason,
					notes: row.notes,
					createdAt: row.createdAt,
				})),
			);
		} catch {
			setAppointments([]);
		}
	}, [currentDog?.id]);

	useFocusEffect(
		useCallback(() => {
			if (currentDog?.id) {
				refresh();
				void loadAppointments();
			} else {
				setAppointments([]);
			}
		}, [currentDog?.id, refresh, loadAppointments]),
	);

	const conditionTags = currentDog?.primaryConditions ?? [];
	const weightUnit = normalizeWeightUnit(currentDog?.weightUnit);
	const hasAnyData =
		stats.weightLogsCount > 0 ||
		stats.medsCount > 0 ||
		conditionTags.some((tag) => {
			const config = CONDITION_STAT_CONFIG[tag];
			if (!config) return false;
			if (tag === "diabetes")
				return stats.insulinCount > 0 || stats.glucoseCount > 0;
			return (stats[config.statKey] as number) > 0;
		});

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
		>
			<View style={styles.header}>
				<View style={styles.brandRow}>
					<View style={styles.brandLeft}>
						<BrandIcon name="logo" size={44} />
						<Text style={styles.title}>PawDex</Text>
					</View>
					<TouchableOpacity
						style={styles.settingsButton}
						onPress={() => parentNavigation.navigate("Settings")}
						hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
						accessibilityRole="button"
						accessibilityLabel="Settings"
					>
						<Ionicons
							name="settings-outline"
							size={24}
							color={colors.textPrimary}
						/>
					</TouchableOpacity>
				</View>
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
										style={[
											styles.dogChip,
											isActive && styles.dogChipActive,
										]}
										onPress={() => setCurrentDogId(d.id)}
									>
										<Text
											style={[
												styles.dogChipText,
												isActive &&
													styles.dogChipTextActive,
											]}
										>
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
					<Text style={styles.subtitle}>
						Add a dog to get started
					</Text>
				)}
			</View>

			{/* Track weight – hero CTA */}
			<TouchableOpacity
				style={styles.weightCard}
				onPress={() => parentNavigation.navigate("Weight")}
				activeOpacity={0.9}
			>
				<View style={styles.weightCardInner}>
					<View style={styles.weightHeader}>
						<View style={styles.weightIconWrap}>
							<BrandIcon name="weight" size={36} />
						</View>
						<View style={styles.weightTitleBlock}>
							<Text style={styles.weightTitle}>Track weight</Text>
							<Text style={styles.weightSubtitle}>
								{currentDog
									? stats.recentWeights.length > 0
										? `Latest: ${formatWeight(stats.recentWeights[0], weightUnit)}`
										: "Log weight for " + currentDog.name
									: "Add a dog first"}
							</Text>
						</View>
					</View>
					{stats.recentWeights.length > 0 && (
						<View style={styles.miniChart}>
							{(() => {
								// recentWeights is newest-first; chart shows oldest → latest (right).
								const chartWeightsKg = [
									...stats.recentWeights.slice(0, 5),
								].reverse();
								const chartWeights = chartWeightsKg.map((kg) =>
									Number(formatWeightValue(kg, weightUnit)),
								);
								const latestIndex = chartWeights.length - 1;
								const max = Math.max(...chartWeights);
								return (
									<>
										<Text style={styles.miniChartLabel}>
											Last {chartWeights.length} entries (
											{weightUnit})
										</Text>
										<View style={styles.barRow}>
											{chartWeights.map((value, i) => {
												const h =
													max > 0
														? (value / max) * 24
														: 0;
												const isLatest =
													i === latestIndex;
												return (
													<View
														key={i}
														style={[
															styles.bar,
															isLatest &&
																styles.barLatest,
															{
																height: Math.max(
																	h,
																	4,
																),
															},
														]}
													/>
												);
											})}
										</View>
										<View style={styles.barLabels}>
											{chartWeights.map((value, i) => {
												const isLatest =
													i === latestIndex;
												return (
													<Text
														key={i}
														style={[
															styles.barLabel,
															isLatest &&
																styles.barLabelLatest,
														]}
														numberOfLines={2}
													>
														{isLatest
															? `Latest\n${value}`
															: String(value)}
													</Text>
												);
											})}
										</View>
									</>
								);
							})()}
						</View>
					)}
					{currentDog && (
						<AppButton
							title={"Log weight"}
							onPress={() => parentNavigation.navigate("Weight")}
							style={styles.weightCardButton}
						/>
					)}
				</View>
			</TouchableOpacity>

			{/* Seizures quick access – only when epilepsy is selected for this dog */}
			{currentDog?.primaryConditions?.includes("epilepsy") && (
				<TouchableOpacity
					style={styles.quickCard}
					onPress={() => parentNavigation.navigate("Seizures")}
					activeOpacity={0.9}
				>
					<View style={styles.quickCardInner}>
						<View style={styles.quickHeader}>
							<View style={styles.quickIconWrap}>
								<BrandIcon name="seizures" size={36} />
							</View>
							<View style={styles.quickTitleBlock}>
								<Text style={styles.quickTitle}>
									Seizures
								</Text>
								<Text style={styles.quickSubtitle}>
									Start timer quickly for {currentDog.name}
								</Text>
							</View>
						</View>
						<AppButton
							title="Start seizure timer"
							onPress={() =>
								parentNavigation.navigate("Seizures")
							}
							style={styles.quickCardButton}
						/>
					</View>
				</TouchableOpacity>
			)}

			{/* Breathing quick access – under seizures when both are selected */}
			{currentDog?.primaryConditions?.includes("heart") && (
				<TouchableOpacity
					style={styles.quickCard}
					onPress={() => parentNavigation.navigate("Breathing")}
					activeOpacity={0.9}
				>
					<View style={styles.quickCardInner}>
						<View style={styles.quickHeader}>
							<View style={styles.quickIconWrap}>
								<BrandIcon name="heart" size={36} />
							</View>
							<View style={styles.quickTitleBlock}>
								<Text style={styles.quickTitle}>Breathing</Text>
								<Text style={styles.quickSubtitle}>
									{stats.recentBreathing.length > 0
										? `Latest: ${stats.recentBreathing[0]} / min`
										: `Log resting breathing for ${currentDog.name}`}
								</Text>
							</View>
						</View>
						<AppButton
							title="Log breathing"
							onPress={() =>
								parentNavigation.navigate("Breathing")
							}
							style={styles.quickCardButton}
						/>
					</View>
				</TouchableOpacity>
			)}

			{/* Data at a glance – only for conditions this dog is tracking */}
			{currentDog && (
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Your data</Text>
					{loading ? (
						<ActivityIndicator
							size="small"
							color={colors.primaryBlue}
							style={styles.loader}
						/>
					) : (
						<View style={styles.statsGrid}>
							<TouchableOpacity
								style={styles.statTile}
								onPress={() =>
									parentNavigation.navigate("Weight")
								}
								activeOpacity={0.85}
								accessibilityRole="button"
								accessibilityLabel="Open weight logs"
							>
								<BrandIcon name="weight" size={28} />
								<Text style={styles.statValue}>
									{stats.weightLogsCount}
								</Text>
								<Text style={styles.statLabel}>
									Weight logs
								</Text>
							</TouchableOpacity>
							{conditionTags.map((tag) => {
								const config = CONDITION_STAT_CONFIG[tag];
								if (!config) return null;
								const value =
									tag === "diabetes"
										? stats.insulinCount +
											stats.glucoseCount
										: (stats[config.statKey] as number);
								return (
									<TouchableOpacity
										key={tag}
										style={styles.statTile}
										onPress={() =>
											parentNavigation.navigate(
												config.screen,
											)
										}
										activeOpacity={0.85}
										accessibilityRole="button"
										accessibilityLabel={`Open ${config.label}`}
									>
										<BrandIcon
											name={config.icon}
											size={28}
										/>
										<Text style={styles.statValue}>
											{value}
										</Text>
										<Text style={styles.statLabel}>
											{config.label}
										</Text>
									</TouchableOpacity>
								);
							})}
							<TouchableOpacity
								style={styles.statTile}
								onPress={() => navigation.navigate("MedsTab")}
								activeOpacity={0.85}
								accessibilityRole="button"
								accessibilityLabel="Open medications"
							>
								<BrandIcon name="medication" size={28} />
								<Text style={styles.statValue}>
									{stats.medsCount}
								</Text>
								<Text style={styles.statLabel}>
									Medications
								</Text>
							</TouchableOpacity>
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
						<BrandIcon name="vet" size={40} />
						<View style={styles.vetCardText}>
							<Text style={styles.vetCardTitle}>Vet report</Text>
							<Text style={styles.vetCardSubtitle}>
								Summary for your vet: trends and logs in one
								place
							</Text>
						</View>
					</View>
					<AppButton
						title="View vet report"
						onPress={() => parentNavigation.navigate("VetReport")}
						style={styles.vetReportButton}
					/>
				</Card>
			</View>

			{/* Upcoming vet appointments */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Upcoming vet visits</Text>
				<Card>
					{appointments.length > 0 ? (
						<>
							<View style={styles.appointmentList}>
								{appointments.map((item) => (
									<View
										key={item.id}
										style={styles.appointmentRow}
									>
										<View
											style={styles.appointmentTextBlock}
										>
											<Text style={styles.appointmentDate}>
												{formatAppointmentDate(
													item.appointmentDate,
												)}
											</Text>
											<Text
												style={styles.appointmentReason}
											>
												{item.reason?.trim() ||
													"Vet appointment"}
											</Text>
										</View>
									</View>
								))}
							</View>
							<AppButton
								title="Add another visit"
								onPress={() =>
									parentNavigation.navigate(
										"VetAppointments",
									)
								}
								style={styles.appointmentSaveButton}
							/>
						</>
					) : (
						<AppButton
							title="Add upcoming vet visit"
							onPress={() =>
								parentNavigation.navigate("VetAppointments")
							}
							disabled={!currentDog}
							style={styles.appointmentSaveButton}
						/>
					)}
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
	brandRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	brandLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		flexShrink: 1,
	},
	settingsButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.cardBackground,
		borderWidth: 1,
		borderColor: colors.border,
	},
	title: {
		...textStyles.screenTitle,
	},
	subtitle: {
		...textStyles.subtitle,
		marginTop: spacing.xs,
	},
	dogSelectorRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: spacing.sm,
		gap: spacing.sm,
	},
	dogSelectorScroll: {
		flexDirection: "row",
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
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	dogChipText: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	dogChipTextActive: {
		color: colors.textOnPrimary,
	},
	weightCard: {
		backgroundColor: colors.cardBackground,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: spacing.lg,
		overflow: "hidden",
		shadowColor: colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.06,
		shadowRadius: 4,
		elevation: 2,
	},
	weightCardInner: {
		padding: spacing.lg,
	},
	weightHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.sm,
	},
	weightIconWrap: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.background,
		alignItems: "center",
		justifyContent: "center",
		marginRight: spacing.md,
	},
	weightTitleBlock: {
		flex: 1,
	},
	weightTitle: {
		...textStyles.cardTitle,
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
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "space-between",
		height: 28,
		gap: 4,
	},
	bar: {
		flex: 1,
		backgroundColor: colors.secondary,
		borderRadius: 4,
		minWidth: 4,
		opacity: 0.55,
	},
	barLatest: {
		backgroundColor: colors.primary,
		opacity: 1,
	},
	barLabels: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginTop: 4,
		gap: 4,
	},
	barLabel: {
		flex: 1,
		fontSize: 10,
		color: colors.textSecondary,
		textAlign: "center",
	},
	barLabelLatest: {
		color: colors.primary,
		fontWeight: "700",
		fontSize: 10,
	},
	weightCardButton: {
		alignSelf: "flex-start",
	},
	quickCard: {
		backgroundColor: colors.cardBackground,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: spacing.lg,
		overflow: "hidden",
		shadowColor: colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.06,
		shadowRadius: 4,
		elevation: 2,
	},
	quickCardInner: {
		padding: spacing.lg,
	},
	quickHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.sm,
	},
	quickIconWrap: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.background,
		alignItems: "center",
		justifyContent: "center",
		marginRight: spacing.md,
	},
	quickTitleBlock: {
		flex: 1,
	},
	quickTitle: {
		...textStyles.cardTitle,
	},
	quickSubtitle: {
		fontSize: 14,
		color: colors.textSecondary,
		marginTop: 2,
	},
	quickCardButton: {
		alignSelf: "flex-start",
	},
	section: {
		marginBottom: spacing.lg,
	},
	sectionTitle: {
		...textStyles.sectionTitle,
		marginBottom: spacing.sm,
	},
	loader: {
		marginVertical: spacing.sm,
	},
	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.sm,
	},
	statTile: {
		width: "48%",
		minWidth: 140,
		backgroundColor: colors.cardBackground,
		padding: spacing.md,
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
		alignItems: "flex-start",
	},
	statValue: {
		fontSize: 22,
		fontWeight: "700",
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
		fontStyle: "italic",
		marginTop: spacing.xs,
	},
	appointmentList: {
		marginBottom: spacing.sm,
	},
	appointmentRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: colors.border,
	},
	appointmentTextBlock: {
		flex: 1,
		paddingRight: spacing.sm,
	},
	appointmentDate: {
		fontFamily: fonts.headingSemi,
		fontSize: 15,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	appointmentReason: {
		fontSize: 13,
		color: colors.textSecondary,
		marginTop: 2,
	},
	appointmentSaveButton: {
		alignSelf: "flex-start",
		marginTop: 4,
	},
	vetSection: {
		marginTop: spacing.sm,
	},
	vetCardContent: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.sm,
	},
	vetCardText: {
		flex: 1,
		marginLeft: spacing.md,
	},
	vetCardTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	vetCardSubtitle: {
		fontSize: 13,
		color: colors.textSecondary,
		marginTop: 2,
	},
	vetReportButton: {
		alignSelf: "flex-start",
	},
});

export default HomeScreen;

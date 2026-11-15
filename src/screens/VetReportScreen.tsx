import React, { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useDogContext } from "../context/DogContext";
import { getDb } from "../db/database";
import { colors } from "../theme/colors";
import { fonts, textStyles } from '../theme/typography';
import { Button as AppButton } from "../components/ui/Button";
import {
	buildFullVetReportHtml,
	buildSectionVetReportHtml,
	isVetSectionEnabled,
	type VetSectionKey,
} from "../utils/vetReportHtml";
import { shareVetReportPdf } from "../utils/shareVetReportPdf";
import { showAlert } from "../utils/showAlert";
import { formatWeight, normalizeWeightUnit } from "../utils/weightUnits";

type ReportData = {
	weightLogs: Array<{
		weightKg: number;
		createdAt: string;
		note?: string | null;
	}>;
	breathingChecks: Array<{ breathsPerMinute: number; createdAt: string }>;
	seizureEvents: Array<{
		startTime: string;
		endTime: string;
		durationSeconds: number;
	}>;
	medications: Array<{
		name: string;
		dose: number;
		unit: string;
		startDate: string;
		notes?: string | null;
	}>;
	allergyLogs: Array<{
		createdAt: string;
		itchSeverity?: number;
		notes?: string | null;
	}>;
	mobilityLogs: Array<{
		createdAt: string;
		overallPain?: number;
		notes?: string | null;
	}>;
	stoolLogs: Array<{
		createdAt: string;
		stoolScore?: number;
		notes?: string | null;
	}>;
	insulinLogs: Array<{ doseUnits: number; givenAt: string }>;
	glucoseReadings: Array<{ value: number; takenAt: string }>;
	kidneyLogs: Array<{
		createdAt: string;
		waterIntakeMl?: number;
		urinationCount?: number;
	}>;
	anxietyLogs: Array<{
		trigger: string;
		severity?: number;
		createdAt: string;
	}>;
};

const defaultReport: ReportData = {
	weightLogs: [],
	breathingChecks: [],
	seizureEvents: [],
	medications: [],
	allergyLogs: [],
	mobilityLogs: [],
	stoolLogs: [],
	insulinLogs: [],
	glucoseReadings: [],
	kidneyLogs: [],
	anxietyLogs: [],
};

function formatDate(iso: string) {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function formatDateTime(iso: string) {
	return new Date(iso).toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

const VetReportScreen: React.FC = () => {
	const { currentDog } = useDogContext();
	const insets = useSafeAreaInsets();
	const navigation = useNavigation();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<ReportData>(defaultReport);

	const loadReport = useCallback(async () => {
		if (!currentDog) {
			setData(defaultReport);
			setLoading(false);
			return;
		}
		const db = getDb();
		const dogId = currentDog.id;
		try {
			const [
				weightRows,
				breathingRows,
				seizureRows,
				medRows,
				allergyRows,
				mobilityRows,
				stoolRows,
				insulinRows,
				glucoseRows,
				kidneyRows,
				anxietyRows,
			] = await Promise.all([
				db.getAllAsync<any>(
					"SELECT weightKg, createdAt, note FROM weight_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 100",
					[dogId],
				),
				db.getAllAsync<any>(
					"SELECT breathsPerMinute, createdAt FROM breathing_checks WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 100",
					[dogId],
				),
				db.getAllAsync<any>(
					"SELECT startTime, endTime, durationSeconds FROM seizure_events WHERE dogId = ? ORDER BY datetime(startTime) DESC LIMIT 100",
					[dogId],
				),
				db.getAllAsync<any>(
					"SELECT name, dose, unit, startDate, notes FROM medications WHERE dogId = ?",
					[dogId],
				),
				db.getAllAsync<any>(
					"SELECT createdAt, itchSeverity, notes FROM allergy_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 50",
					[dogId],
				),
				db.getAllAsync<any>(
					"SELECT createdAt, overallPain, notes FROM mobility_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 50",
					[dogId],
				),
				db.getAllAsync<any>(
					"SELECT createdAt, stoolScore, notes FROM stool_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 50",
					[dogId],
				),
				db.getAllAsync<any>(
					"SELECT doseUnits, givenAt FROM insulin_logs WHERE dogId = ? ORDER BY datetime(givenAt) DESC LIMIT 50",
					[dogId],
				),
				db.getAllAsync<any>(
					"SELECT value, takenAt FROM glucose_readings WHERE dogId = ? ORDER BY datetime(takenAt) DESC LIMIT 50",
					[dogId],
				),
				db.getAllAsync<any>(
					"SELECT createdAt, waterIntakeMl, urinationCount FROM kidney_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 50",
					[dogId],
				),
				db.getAllAsync<any>(
					"SELECT trigger, severity, createdAt FROM anxiety_logs WHERE dogId = ? ORDER BY datetime(createdAt) DESC LIMIT 50",
					[dogId],
				),
			]);
			setData({
				weightLogs: (weightRows || []).map((r: any) => ({
					weightKg: r.weightKg,
					createdAt: r.createdAt,
					note: r.note,
				})),
				breathingChecks: (breathingRows || []).map((r: any) => ({
					breathsPerMinute: r.breathsPerMinute,
					createdAt: r.createdAt,
				})),
				seizureEvents: (seizureRows || []).map((r: any) => ({
					startTime: r.startTime,
					endTime: r.endTime,
					durationSeconds: r.durationSeconds,
				})),
				medications: (medRows || []).map((r: any) => ({
					name: r.name,
					dose: r.dose,
					unit: r.unit,
					startDate: r.startDate,
					notes: r.notes,
				})),
				allergyLogs: (allergyRows || []).map((r: any) => ({
					createdAt: r.createdAt,
					itchSeverity: r.itchSeverity,
					notes: r.notes,
				})),
				mobilityLogs: (mobilityRows || []).map((r: any) => ({
					createdAt: r.createdAt,
					overallPain: r.overallPain,
					notes: r.notes,
				})),
				stoolLogs: (stoolRows || []).map((r: any) => ({
					createdAt: r.createdAt,
					stoolScore: r.stoolScore,
					notes: r.notes,
				})),
				insulinLogs: (insulinRows || []).map((r: any) => ({
					doseUnits: r.doseUnits,
					givenAt: r.givenAt,
				})),
				glucoseReadings: (glucoseRows || []).map((r: any) => ({
					value: r.value,
					takenAt: r.takenAt,
				})),
				kidneyLogs: (kidneyRows || []).map((r: any) => ({
					createdAt: r.createdAt,
					waterIntakeMl: r.waterIntakeMl,
					urinationCount: r.urinationCount,
				})),
				anxietyLogs: (anxietyRows || []).map((r: any) => ({
					trigger: r.trigger,
					severity: r.severity,
					createdAt: r.createdAt,
				})),
			});
		} catch {
			setData(defaultReport);
		} finally {
			setLoading(false);
		}
	}, [currentDog]);

	useEffect(() => {
		loadReport();
	}, [loadReport]);

	type SectionKey = VetSectionKey;

	const handleDownloadPdf = async () => {
		if (!currentDog) {
			showAlert("No dog selected", "Select a dog to generate a report.");
			return;
		}
		try {
			const html = buildFullVetReportHtml(
				currentDog.name,
				data,
				currentDog.primaryConditions,
				normalizeWeightUnit(currentDog.weightUnit),
			);
			await shareVetReportPdf(
				html,
				`Health summary – ${currentDog.name}`,
			);
		} catch (e: any) {
			showAlert("Error", e?.message ?? "Could not generate PDF.");
		}
	};

	const handleDownloadSection = async (section: SectionKey, label: string) => {
		if (!currentDog) {
			showAlert("No dog selected", "Select a dog to generate a report.");
			return;
		}
		try {
			const html = buildSectionVetReportHtml(
				currentDog.name,
				section,
				data,
				currentDog.primaryConditions,
				normalizeWeightUnit(currentDog.weightUnit),
			);
			await shareVetReportPdf(
				html,
				`Health summary – ${currentDog.name} – ${label}`,
			);
		} catch (e: any) {
			showAlert("Error", e?.message ?? "Could not generate PDF.");
		}
	};

	const conditions = currentDog?.primaryConditions ?? [];
	const showBreathing = isVetSectionEnabled("breathing", conditions);
	const showSeizures = isVetSectionEnabled("seizures", conditions);
	const showAllergy = isVetSectionEnabled("allergy", conditions);
	const showMobility = isVetSectionEnabled("mobility", conditions);
	const showStool = isVetSectionEnabled("stool", conditions);
	const showDiabetes = isVetSectionEnabled("insulin", conditions);
	const showKidney = isVetSectionEnabled("kidney", conditions);
	const showAnxiety = isVetSectionEnabled("anxiety", conditions);

	const hasAnyData =
		data.weightLogs.length > 0 ||
		data.medications.length > 0 ||
		(showBreathing && data.breathingChecks.length > 0) ||
		(showSeizures && data.seizureEvents.length > 0) ||
		(showAllergy && data.allergyLogs.length > 0) ||
		(showMobility && data.mobilityLogs.length > 0) ||
		(showStool && data.stoolLogs.length > 0) ||
		(showDiabetes &&
			(data.insulinLogs.length > 0 || data.glucoseReadings.length > 0)) ||
		(showKidney && data.kidneyLogs.length > 0) ||
		(showAnxiety && data.anxietyLogs.length > 0);

	return (
		<>
			<StatusBar style="dark" />
			<ScrollView
				style={styles.container}
				contentContainerStyle={[
					styles.content,
					{ paddingTop: insets.top + 16 },
				]}
			>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => navigation.goBack()}
					hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
				>
					<Ionicons
						name="chevron-back"
						size={28}
						color={colors.textPrimary}
					/>
				</TouchableOpacity>
				<Text style={styles.title}>Vet report</Text>
				{currentDog ? (
					<>
						<Text style={styles.dogName}>{currentDog.name}</Text>
						<Text style={styles.subtitle}>
							A clear health summary for your vet.
							{"\n"}
							PDFs include a simple graph and a detailed table —
							easy for you to check, and useful for your vet.
						</Text>
					</>
				) : (
					<Text style={styles.subtitle}>
						Add a dog to generate a report.
					</Text>
				)}

				{loading ? (
					<ActivityIndicator
						size="large"
						color={colors.primaryBlue}
						style={styles.loader}
					/>
				) : currentDog ? (
					<>
						{hasAnyData ? (
							<View style={styles.sections}>
								{data.weightLogs.length > 0 && (
									<View style={styles.block}>
										<Text style={styles.blockTitle}>
											Weight
										</Text>
										<Text style={styles.blockCount}>
											{data.weightLogs.length} entries
										</Text>
										{data.weightLogs
											.slice(0, 5)
											.map((r, i) => (
												<Text
													key={i}
													style={styles.blockRow}
												>
													{formatDate(r.createdAt)} –{" "}
													{formatWeight(
														r.weightKg,
														normalizeWeightUnit(
															currentDog.weightUnit,
														),
													)}
													{r.note
														? ` · ${r.note}`
														: ""}
												</Text>
											))}
										{data.weightLogs.length > 5 && (
											<Text style={styles.blockMore}>
												+{data.weightLogs.length - 5}{" "}
												more in PDF
											</Text>
										)}
										<TouchableOpacity
											onPress={() =>
												handleDownloadSection(
													"weight",
													"Weight",
												)
											}
											style={styles.blockDownloadButton}
											activeOpacity={0.8}
										>
											<Text style={styles.blockDownloadText}>
												Download PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{showBreathing && data.breathingChecks.length > 0 && (
									<View style={styles.block}>
										<Text style={styles.blockTitle}>
											Breathing (resting)
										</Text>
										<Text style={styles.blockCount}>
											{data.breathingChecks.length} checks
										</Text>
										{data.breathingChecks
											.slice(0, 5)
											.map((r, i) => (
												<Text
													key={i}
													style={styles.blockRow}
												>
													{formatDateTime(
														r.createdAt,
													)}{" "}
													– {r.breathsPerMinute} /min
												</Text>
											))}
										{data.breathingChecks.length > 5 && (
											<Text style={styles.blockMore}>
												+
												{data.breathingChecks.length -
													5}{" "}
												more in PDF
											</Text>
										)}
										<TouchableOpacity
											onPress={() =>
												handleDownloadSection(
													"breathing",
													"Breathing (resting)",
												)
											}
											style={styles.blockDownloadButton}
											activeOpacity={0.8}
										>
											<Text style={styles.blockDownloadText}>
												Download PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{showSeizures && data.seizureEvents.length > 0 && (
									<View style={styles.block}>
										<Text style={styles.blockTitle}>
											Seizure events
										</Text>
										<Text style={styles.blockCount}>
											{data.seizureEvents.length} events
										</Text>
										{data.seizureEvents
											.slice(0, 5)
											.map((r, i) => (
												<Text
													key={i}
													style={styles.blockRow}
												>
													{formatDateTime(
														r.startTime,
													)}{" "}
													– {r.durationSeconds}s
												</Text>
											))}
										{data.seizureEvents.length > 5 && (
											<Text style={styles.blockMore}>
												+{data.seizureEvents.length - 5}{" "}
												more in PDF
											</Text>
										)}
										<TouchableOpacity
											onPress={() =>
												handleDownloadSection(
													"seizures",
													"Seizure events",
												)
											}
											style={styles.blockDownloadButton}
											activeOpacity={0.8}
										>
											<Text style={styles.blockDownloadText}>
												Download PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{data.medications.length > 0 && (
									<View style={styles.block}>
										<Text style={styles.blockTitle}>
											Medications
										</Text>
										{data.medications.map((r, i) => (
											<Text
												key={i}
												style={styles.blockRow}
											>
												{r.name} – {r.dose} {r.unit}{" "}
												(from {formatDate(r.startDate)})
												{r.notes
													? ` · ${r.notes}`
													: ""}
											</Text>
										))}
										<TouchableOpacity
											onPress={() =>
												handleDownloadSection(
													"medications",
													"Medications",
												)
											}
											style={styles.blockDownloadButton}
											activeOpacity={0.8}
										>
											<Text style={styles.blockDownloadText}>
												Download PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{showAllergy && data.allergyLogs.length > 0 && (
									<View style={styles.block}>
										<Text style={styles.blockTitle}>
											Allergy / skin
										</Text>
										<Text style={styles.blockCount}>
											{data.allergyLogs.length} logs
										</Text>
										<TouchableOpacity
											onPress={() =>
												handleDownloadSection(
													"allergy",
													"Allergy / skin",
												)
											}
											style={styles.blockDownloadButton}
											activeOpacity={0.8}
										>
											<Text style={styles.blockDownloadText}>
												Download PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{showMobility && data.mobilityLogs.length > 0 && (
									<View style={styles.block}>
										<Text style={styles.blockTitle}>
											Mobility / arthritis
										</Text>
										<Text style={styles.blockCount}>
											{data.mobilityLogs.length} check-ins
										</Text>
										<TouchableOpacity
											onPress={() =>
												handleDownloadSection(
													"mobility",
													"Mobility / arthritis",
												)
											}
											style={styles.blockDownloadButton}
											activeOpacity={0.8}
										>
											<Text style={styles.blockDownloadText}>
												Download PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{showStool && data.stoolLogs.length > 0 && (
									<View style={styles.block}>
										<Text style={styles.blockTitle}>
											Digestion
										</Text>
										<Text style={styles.blockCount}>
											{data.stoolLogs.length} logs
										</Text>
										<TouchableOpacity
											onPress={() =>
												handleDownloadSection(
													"stool",
													"Digestion / stool",
												)
											}
											style={styles.blockDownloadButton}
											activeOpacity={0.8}
										>
											<Text style={styles.blockDownloadText}>
												Download PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{showDiabetes && data.insulinLogs.length > 0 && (
									<View style={styles.block}>
										<Text style={styles.blockTitle}>
											Insulin
										</Text>
										<Text style={styles.blockCount}>
											{data.insulinLogs.length} doses
										</Text>
										<TouchableOpacity
											onPress={() =>
												handleDownloadSection(
													"insulin",
													"Insulin doses",
												)
											}
											style={styles.blockDownloadButton}
											activeOpacity={0.8}
										>
											<Text style={styles.blockDownloadText}>
												Download PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{showDiabetes && data.glucoseReadings.length > 0 && (
									<View style={styles.block}>
										<Text style={styles.blockTitle}>
											Glucose
										</Text>
										<Text style={styles.blockCount}>
											{data.glucoseReadings.length}{" "}
											readings
										</Text>
										<TouchableOpacity
											onPress={() =>
												handleDownloadSection(
													"glucose",
													"Glucose readings",
												)
											}
											style={styles.blockDownloadButton}
											activeOpacity={0.8}
										>
											<Text style={styles.blockDownloadText}>
												Download PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{showKidney && data.kidneyLogs.length > 0 && (
									<View style={styles.block}>
										<Text style={styles.blockTitle}>
											Kidney / urinary
										</Text>
										<Text style={styles.blockCount}>
											{data.kidneyLogs.length} logs
										</Text>
										<TouchableOpacity
											onPress={() =>
												handleDownloadSection(
													"kidney",
													"Kidney / urinary",
												)
											}
											style={styles.blockDownloadButton}
											activeOpacity={0.8}
										>
											<Text style={styles.blockDownloadText}>
												Download PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{showAnxiety && data.anxietyLogs.length > 0 && (
									<View style={styles.block}>
										<Text style={styles.blockTitle}>
											Anxiety
										</Text>
										<Text style={styles.blockCount}>
											{data.anxietyLogs.length} episodes
										</Text>
										<TouchableOpacity
											onPress={() =>
												handleDownloadSection(
													"anxiety",
													"Anxiety",
												)
											}
											style={styles.blockDownloadButton}
											activeOpacity={0.8}
										>
											<Text style={styles.blockDownloadText}>
												Download PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
							</View>
						) : (
							<Text style={styles.emptyText}>
								No logged data yet for this dog. Use Track and
								Meds to add data, then return here to download a
								report.
							</Text>
						)}

						<View style={styles.downloadSection}>
							<AppButton
								title="Download full PDF"
								onPress={handleDownloadPdf}
								style={styles.downloadButton}
							/>
						</View>
					</>
				) : (
					<Text style={styles.emptyText}>
						Add a dog in the Dogs tab to generate a vet report.
					</Text>
				)}
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
		alignSelf: "flex-start",
		marginLeft: -6,
		marginBottom: 8,
	},
	title: {
		...textStyles.screenTitle,
		marginBottom: 4,
	},
	dogName: {
		fontFamily: fonts.headingBold,
		fontSize: 28,
		fontWeight: "700",
		color: colors.primaryBlue,
		marginBottom: 6,
	},
	subtitle: {
		...textStyles.subtitle,
		fontSize: 14,
		marginBottom: 20,
	},
	loader: {
		marginVertical: 24,
	},
	sections: {
		marginBottom: 0,
	},
	block: {
		backgroundColor: colors.cardBackground,
		padding: 16,
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
		marginBottom: 12,
	},
	blockTitle: {
		...textStyles.label,
		fontFamily: fonts.headingSemi,
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 4,
	},
	blockCount: {
		fontSize: 13,
		color: colors.textSecondary,
		marginBottom: 8,
	},
	blockRow: {
		fontSize: 13,
		color: colors.textPrimary,
		marginBottom: 4,
	},
	blockMore: {
		fontSize: 12,
		color: colors.textSecondary,
		fontStyle: "italic",
		marginTop: 4,
	},
	blockDownloadButton: {
		marginTop: 4,
	},
	blockDownloadText: {
		fontSize: 12,
		color: colors.primary,
		fontWeight: "600",
	},
	emptyText: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 12,
	},
	downloadSection: {
		marginTop: 4,
	},
	downloadButton: {
		alignSelf: "stretch",
		width: "100%",
	},
});

export default VetReportScreen;

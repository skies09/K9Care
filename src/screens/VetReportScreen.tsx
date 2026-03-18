import React, { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useDogContext } from "../context/DogContext";
import { getDb } from "../db/database";
import { colors } from "../theme/colors";
import { Button as AppButton } from "../components/ui/Button";

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
					"SELECT name, dose, unit, startDate FROM medications WHERE dogId = ?",
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

	const buildHtml = useCallback((): string => {
		const dogName = currentDog?.name ?? "Dog";
		const reportDate = formatDate(new Date().toISOString());
		const section = (title: string, rows: string) =>
			rows
				? `<h2 style="margin-top:20px;margin-bottom:8px;font-size:16px;color:#1A202C;">${title}</h2><table style="width:100%;border-collapse:collapse;font-size:13px;">${rows}</table>`
				: "";

		const weightRows = data.weightLogs
			.slice(0, 50)
			.map(
				(r) =>
					`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(r.createdAt)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${r.weightKg} kg</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${r.note || "-"}</td></tr>`,
			)
			.join("");
		const breathingRows = data.breathingChecks
			.slice(0, 50)
			.map(
				(r) =>
					`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDateTime(r.createdAt)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${r.breathsPerMinute} /min</td></tr>`,
			)
			.join("");
		const seizureRows = data.seizureEvents
			.slice(0, 50)
			.map(
				(r) =>
					`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDateTime(r.startTime)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${r.durationSeconds}s</td></tr>`,
			)
			.join("");
		const medRows = data.medications
			.map(
				(r) =>
					`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${r.name}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${r.dose} ${r.unit}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">From ${formatDate(r.startDate)}</td></tr>`,
			)
			.join("");
		const allergyRows = data.allergyLogs
			.slice(0, 30)
			.map(
				(r) =>
					`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(r.createdAt)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">Itch ${r.itchSeverity ?? "-"}/5</td></tr>`,
			)
			.join("");
		const mobilityRows = data.mobilityLogs
			.slice(0, 30)
			.map(
				(r) =>
					`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(r.createdAt)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">Pain ${r.overallPain ?? "-"}/5</td></tr>`,
			)
			.join("");
		const stoolRows = data.stoolLogs
			.slice(0, 30)
			.map(
				(r) =>
					`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(r.createdAt)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">Score ${r.stoolScore ?? "-"}/7</td></tr>`,
			)
			.join("");
		const insulinRows = data.insulinLogs
			.slice(0, 30)
			.map(
				(r) =>
					`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDateTime(r.givenAt)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${r.doseUnits} units</td></tr>`,
			)
			.join("");
		const glucoseRows = data.glucoseReadings
			.slice(0, 30)
			.map(
				(r) =>
					`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDateTime(r.takenAt)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${r.value}</td></tr>`,
			)
			.join("");
		const kidneyRows = data.kidneyLogs
			.slice(0, 30)
			.map(
				(r) =>
					`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(r.createdAt)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">Water ${r.waterIntakeMl ?? "-"} ml, Urinations ${r.urinationCount ?? "-"}</td></tr>`,
			)
			.join("");
		const anxietyRows = data.anxietyLogs
			.slice(0, 30)
			.map(
				(r) =>
					`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(r.createdAt)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${r.trigger} ${r.severity != null ? `(${r.severity}/5)` : ""}</td></tr>`,
			)
			.join("");

		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1A202C; font-size: 14px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #4A5568; font-size: 13px; margin-bottom: 24px; }
    th { text-align: left; padding: 6px; border-bottom: 2px solid #E2E8F0; font-weight: 600; }
  </style>
</head>
<body>
  <h1>K9Care – Vet report</h1>
  <p class="meta">${dogName} · Report generated ${reportDate}</p>
  ${section("Weight", weightRows ? `<tr><th>Date</th><th>Weight</th><th>Note</th></tr>${weightRows}` : "")}
  ${section("Breathing (resting bpm)", breathingRows ? `<tr><th>Date & time</th><th>Breaths/min</th></tr>${breathingRows}` : "")}
  ${section("Seizure events", seizureRows ? `<tr><th>Start time</th><th>Duration</th></tr>${seizureRows}` : "")}
  ${section("Medications", medRows ? `<tr><th>Name</th><th>Dose</th><th>Started</th></tr>${medRows}` : "")}
  ${section("Allergy / skin logs", allergyRows ? `<tr><th>Date</th><th>Itch severity</th></tr>${allergyRows}` : "")}
  ${section("Mobility / arthritis", mobilityRows ? `<tr><th>Date</th><th>Pain (1-5)</th></tr>${mobilityRows}` : "")}
  ${section("Digestive / stool", stoolRows ? `<tr><th>Date</th><th>Stool score</th></tr>${stoolRows}` : "")}
  ${section("Insulin doses", insulinRows ? `<tr><th>Date & time</th><th>Units</th></tr>${insulinRows}` : "")}
  ${section("Glucose readings", glucoseRows ? `<tr><th>Date & time</th><th>Value</th></tr>${glucoseRows}` : "")}
  ${section("Kidney / urinary", kidneyRows ? `<tr><th>Date</th><th>Details</th></tr>${kidneyRows}` : "")}
  ${section("Anxiety episodes", anxietyRows ? `<tr><th>Date</th><th>Trigger / severity</th></tr>${anxietyRows}` : "")}
</body>
</html>`;
	}, [currentDog, data]);

	type SectionKey =
		| "weight"
		| "breathing"
		| "seizures"
		| "medications"
		| "allergy"
		| "mobility"
		| "stool"
		| "insulin"
		| "glucose"
		| "kidney"
		| "anxiety";

	const buildSectionHtml = useCallback(
		(section: SectionKey): string => {
			const dogName = currentDog?.name ?? "Dog";
			const reportDate = formatDate(new Date().toISOString());
			const wrap = (title: string, headerRow: string, rows: string) => {
				if (!rows) return "";
				return `<h2 style="margin-top:20px;margin-bottom:8px;font-size:16px;color:#1A202C;">${title}</h2><table style="width:100%;border-collapse:collapse;font-size:13px;"><tr>${headerRow}</tr>${rows}</table>`;
			};

			let title = "";
			let header = "";
			let rows = "";

			switch (section) {
				case "weight":
					title = "Weight";
					header =
						'<th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Date</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Weight</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Note</th>';
					rows = data.weightLogs
						.slice(0, 50)
						.map(
							(r) =>
								`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(
									r.createdAt,
								)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${
									r.weightKg
								} kg</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${
									r.note || "-"
								}</td></tr>`,
						)
						.join("");
					break;
				case "breathing":
					title = "Breathing (resting bpm)";
					header =
						'<th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Date & time</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Breaths/min</th>';
					rows = data.breathingChecks
						.slice(0, 50)
						.map(
							(r) =>
								`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDateTime(
									r.createdAt,
								)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${
									r.breathsPerMinute
								} /min</td></tr>`,
						)
						.join("");
					break;
				case "seizures":
					title = "Seizure events";
					header =
						'<th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Start time</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Duration</th>';
					rows = data.seizureEvents
						.slice(0, 50)
						.map(
							(r) =>
								`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDateTime(
									r.startTime,
								)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${
									r.durationSeconds
								}s</td></tr>`,
						)
						.join("");
					break;
				case "medications":
					title = "Medications";
					header =
						'<th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Name</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Dose</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Started</th>';
					rows = data.medications
						.map(
							(r) =>
								`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${
									r.name
								}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${
									r.dose
								} ${
									r.unit
								}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(
									r.startDate,
								)}</td></tr>`,
						)
						.join("");
					break;
				case "allergy":
					title = "Allergy / skin logs";
					header =
						'<th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Date</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Itch severity</th>';
					rows = data.allergyLogs
						.map(
							(r) =>
								`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(
									r.createdAt,
								)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${
									r.itchSeverity ?? "-"
								}</td></tr>`,
						)
						.join("");
					break;
				case "mobility":
					title = "Mobility / arthritis";
					header =
						'<th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Date</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Pain (1-5)</th>';
					rows = data.mobilityLogs
						.map(
							(r) =>
								`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(
									r.createdAt,
								)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${
									r.overallPain ?? "-"
								}</td></tr>`,
						)
						.join("");
					break;
				case "stool":
					title = "Digestive / stool";
					header =
						'<th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Date</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Stool score</th>';
					rows = data.stoolLogs
						.map(
							(r) =>
								`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(
									r.createdAt,
								)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${
									r.stoolScore ?? "-"
								}</td></tr>`,
						)
						.join("");
					break;
				case "insulin":
					title = "Insulin doses";
					header =
						'<th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Date & time</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Units</th>';
					rows = data.insulinLogs
						.map(
							(r) =>
								`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDateTime(
									r.givenAt,
								)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${
									r.doseUnits
								}</td></tr>`,
						)
						.join("");
					break;
				case "glucose":
					title = "Glucose readings";
					header =
						'<th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Date & time</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Value</th>';
					rows = data.glucoseReadings
						.map(
							(r) =>
								`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDateTime(
									r.takenAt,
								)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${
									r.value
								}</td></tr>`,
						)
						.join("");
					break;
				case "kidney":
					title = "Kidney / urinary";
					header =
						'<th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Date</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Details</th>';
					rows = data.kidneyLogs
						.map((r) => {
							const parts = [];
							if (r.waterIntakeMl != null)
								parts.push(`Water: ${r.waterIntakeMl} ml`);
							if (r.urinationCount != null)
								parts.push(`Urination: ${r.urinationCount}x`);
							const details = parts.join(" · ") || "-";
							return `<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(
								r.createdAt,
							)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${details}</td></tr>`;
						})
						.join("");
					break;
				case "anxiety":
					title = "Anxiety episodes";
					header =
						'<th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Date</th><th style="text-align:left;padding:6px;border-bottom:2px solid #E2E8F0;">Trigger / severity</th>';
					rows = data.anxietyLogs
						.map(
							(r) =>
								`<tr><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${formatDate(
									r.createdAt,
								)}</td><td style="padding:6px;border-bottom:1px solid #E2E8F0;">${
									r.trigger
								} (${r.severity ?? "-"})</td></tr>`,
						)
						.join("");
					break;
			}

			const sectionHtml = wrap(title, header, rows);

			return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>K9Care – Vet report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1A202C; font-size: 14px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #4A5568; font-size: 13px; margin-bottom: 24px; }
    th { text-align: left; padding: 6px; border-bottom: 2px solid #E2E8F0; font-weight: 600; }
  </style>
</head>
<body>
  <h1>K9Care – Vet report</h1>
  <p class="meta">${dogName} · ${title} · Generated ${reportDate}</p>
  ${sectionHtml || "<p>No data for this section.</p>"}
</body>
</html>`;
		},
		[currentDog, data],
	);

	const handleDownloadPdf = async () => {
		if (!currentDog) {
			Alert.alert(
				"No dog selected",
				"Select a dog to generate a report.",
			);
			return;
		}
		try {
			const html = buildHtml();
			const { uri } = await Print.printToFileAsync({
				html,
				base64: false,
			});
			const canShare = await Sharing.isAvailableAsync();
			if (canShare) {
				await Sharing.shareAsync(uri, {
					mimeType: "application/pdf",
					dialogTitle: `Vet report – ${currentDog.name}`,
				});
			} else {
				Alert.alert(
					"Saved",
					`PDF saved. You can find it in your app's cache.`,
				);
			}
		} catch (e: any) {
			Alert.alert("Error", e?.message ?? "Could not generate PDF.");
		}
	};

	const handleDownloadSection = async (section: SectionKey, label: string) => {
		if (!currentDog) {
			Alert.alert(
				"No dog selected",
				"Select a dog to generate a report.",
			);
			return;
		}
		try {
			const html = buildSectionHtml(section);
			const { uri } = await Print.printToFileAsync({
				html,
				base64: false,
			});
			const canShare = await Sharing.isAvailableAsync();
			if (canShare) {
				await Sharing.shareAsync(uri, {
					mimeType: "application/pdf",
					dialogTitle: `Vet report – ${currentDog.name} – ${label}`,
				});
			} else {
				Alert.alert(
					"Saved",
					`PDF saved. You can find it in your app's cache.`,
				);
			}
		} catch (e: any) {
			Alert.alert("Error", e?.message ?? "Could not generate PDF.");
		}
	};

	const hasAnyData =
		data.weightLogs.length > 0 ||
		data.breathingChecks.length > 0 ||
		data.seizureEvents.length > 0 ||
		data.medications.length > 0 ||
		data.allergyLogs.length > 0 ||
		data.mobilityLogs.length > 0 ||
		data.stoolLogs.length > 0 ||
		data.insulinLogs.length > 0 ||
		data.glucoseReadings.length > 0 ||
		data.kidneyLogs.length > 0 ||
		data.anxietyLogs.length > 0;

	return (
		<>
			<StatusBar style="dark" />
			<ScrollView
				style={styles.container}
				contentContainerStyle={[
					styles.content,
					{ paddingTop: insets.top + 4 },
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
				<Text style={styles.subtitle}>
					{currentDog
						? `Summary for ${currentDog.name}. Download as PDF to share with your vet.`
						: "Add a dog to generate a report."}
				</Text>

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
													{r.weightKg} kg
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
												Download this section as PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{data.breathingChecks.length > 0 && (
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
												Download this section as PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{data.seizureEvents.length > 0 && (
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
												Download this section as PDF
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
												Download this section as PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{data.allergyLogs.length > 0 && (
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
												Download this section as PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{data.mobilityLogs.length > 0 && (
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
												Download this section as PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{data.stoolLogs.length > 0 && (
									<View style={styles.block}>
										<Text style={styles.blockTitle}>
											Digestive
										</Text>
										<Text style={styles.blockCount}>
											{data.stoolLogs.length} logs
										</Text>
										<TouchableOpacity
											onPress={() =>
												handleDownloadSection(
													"stool",
													"Digestive / stool",
												)
											}
											style={styles.blockDownloadButton}
											activeOpacity={0.8}
										>
											<Text style={styles.blockDownloadText}>
												Download this section as PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{data.insulinLogs.length > 0 && (
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
												Download this section as PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{data.glucoseReadings.length > 0 && (
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
												Download this section as PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{data.kidneyLogs.length > 0 && (
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
												Download this section as PDF
											</Text>
										</TouchableOpacity>
									</View>
								)}
								{data.anxietyLogs.length > 0 && (
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
												Download this section as PDF
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
								title="Download PDF report"
								onPress={handleDownloadPdf}
								style={styles.downloadButton}
							/>
							<Text style={styles.downloadHint}>
								Opens share sheet so you can save and send to
								your vet.
							</Text>
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
		marginBottom: 4,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: colors.textPrimary,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 20,
	},
	loader: {
		marginVertical: 24,
	},
	sections: {
		marginBottom: 24,
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
		fontSize: 16,
		fontWeight: "700",
		color: colors.textPrimary,
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
		color: colors.primaryBlue,
		fontWeight: "600",
	},
	emptyText: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 20,
	},
	downloadSection: {
		marginTop: 8,
	},
	downloadButton: {
		alignSelf: "flex-start",
		marginBottom: 8,
	},
	downloadHint: {
		fontSize: 12,
		color: colors.textSecondary,
	},
});

export default VetReportScreen;

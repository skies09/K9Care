import React, { useCallback, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useDogContext } from "../context/DogContext";
import { getDb } from "../db/database";
import { colors } from "../theme/colors";
import { fonts, textStyles } from "../theme/typography";
import { spacing } from "../theme/spacing";
import { Button as AppButton } from "../components/ui/Button";
import { BrandIcon } from "../components/BrandIcon";
import { AppDateTimePicker } from "../components/AppDateTimePicker";
import { showAlert, showConfirm } from "../utils/showAlert";
import type { VetAppointment } from "../types";

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

const VetAppointmentsScreen: React.FC = () => {
	const { currentDog } = useDogContext();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const [appointments, setAppointments] = useState<VetAppointment[]>([]);
	const [appointmentDateObj, setAppointmentDateObj] = useState(
		() => new Date(),
	);
	const [appointmentReason, setAppointmentReason] = useState("");
	const [saving, setSaving] = useState(false);

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
         LIMIT 20`,
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
			void loadAppointments();
		}, [loadAppointments]),
	);

	const handleAdd = async () => {
		if (!currentDog) {
			showAlert(
				"Add a dog first",
				"You need a dog profile to save vet appointments.",
			);
			return;
		}
		const appointmentDate = formatDateYYYYMMDD(appointmentDateObj);
		const reason = appointmentReason.trim() || null;
		const id = `vetappt_${Date.now()}`;
		const createdAt = new Date().toISOString();
		setSaving(true);
		try {
			const db = getDb();
			await db.runAsync(
				`INSERT INTO vet_appointments
          (id, dogId, appointmentDate, appointmentTime, reason, notes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
				[
					id,
					currentDog.id,
					appointmentDate,
					null,
					reason,
					null,
					createdAt,
				],
			);
			setAppointmentReason("");
			setAppointmentDateObj(new Date());
			await loadAppointments();
		} catch {
			showAlert("Error", "Could not save the appointment.");
		} finally {
			setSaving(false);
		}
	};

	const handleRemove = (appointment: VetAppointment) => {
		showConfirm(
			"Remove appointment?",
			`Remove the visit on ${formatAppointmentDate(appointment.appointmentDate)}?`,
			async () => {
				try {
					const db = getDb();
					await db.runAsync(
						"DELETE FROM vet_appointments WHERE id = ?",
						[appointment.id],
					);
					await loadAppointments();
				} catch {
					showAlert("Error", "Could not remove the appointment.");
				}
			},
			{ confirmLabel: "Remove", cancelLabel: "Keep" },
		);
	};

	return (
		<>
			<StatusBar style="dark" />
			<ScrollView
				style={styles.container}
				contentContainerStyle={[
					styles.content,
					{
						paddingTop: insets.top + 16,
						paddingBottom: Math.max(insets.bottom, 32),
					},
				]}
				keyboardShouldPersistTaps="handled"
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

				<View style={styles.titleRow}>
					<BrandIcon name="vet" size={40} />
					<Text style={styles.title}>Vet visits</Text>
				</View>
				<Text style={styles.subtitle}>
					{currentDog
						? `Save upcoming appointments for ${currentDog.name}.`
						: "Add a dog to save vet appointments."}
				</Text>

				{appointments.length > 0 && (
					<View style={styles.listCard}>
						<Text style={styles.listTitle}>Upcoming</Text>
						{appointments.map((item) => (
							<View key={item.id} style={styles.appointmentRow}>
								<View style={styles.appointmentTextBlock}>
									<Text style={styles.appointmentDate}>
										{formatAppointmentDate(
											item.appointmentDate,
										)}
									</Text>
									<Text style={styles.appointmentReason}>
										{item.reason?.trim() ||
											"Vet appointment"}
									</Text>
								</View>
								<TouchableOpacity
									onPress={() => handleRemove(item)}
									hitSlop={{
										top: 10,
										bottom: 10,
										left: 10,
										right: 10,
									}}
									accessibilityRole="button"
									accessibilityLabel="Remove appointment"
								>
									<Ionicons
										name="close-circle-outline"
										size={22}
										color={colors.textSecondary}
									/>
								</TouchableOpacity>
							</View>
						))}
					</View>
				)}

				<View style={styles.formCard}>
					<Text style={styles.formTitle}>Add a visit</Text>
					<AppDateTimePicker
						mode="date"
						label="Date"
						value={appointmentDateObj}
						displayValue={formatDateYYYYMMDD(appointmentDateObj)}
						onChange={setAppointmentDateObj}
					/>
					<TextInput
						style={styles.input}
						placeholder="What for? (optional — e.g. checkup, vaccines)"
						placeholderTextColor={colors.textSecondary}
						value={appointmentReason}
						onChangeText={setAppointmentReason}
					/>
					<AppButton
						title={saving ? "Saving…" : "Save appointment"}
						onPress={handleAdd}
						disabled={saving || !currentDog}
						style={styles.saveButton}
					/>
				</View>
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
	},
	backButton: {
		alignSelf: "flex-start",
		marginLeft: -6,
		marginBottom: 8,
	},
	titleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginBottom: 4,
	},
	title: {
		...textStyles.screenTitle,
		marginBottom: 0,
	},
	subtitle: {
		...textStyles.subtitle,
		fontSize: 14,
		marginBottom: 20,
	},
	listCard: {
		backgroundColor: colors.cardBackground,
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
		padding: 16,
		marginBottom: 16,
	},
	listTitle: {
		fontFamily: fonts.headingSemi,
		fontSize: 16,
		fontWeight: "600",
		color: colors.textPrimary,
		marginBottom: 4,
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
	formCard: {
		backgroundColor: colors.cardBackground,
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
		padding: 16,
	},
	formTitle: {
		fontFamily: fonts.headingSemi,
		fontSize: 16,
		fontWeight: "600",
		color: colors.textPrimary,
		marginBottom: 8,
	},
	input: {
		height: 44,
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
		paddingHorizontal: 12,
		backgroundColor: colors.background,
		color: colors.textPrimary,
		marginBottom: 8,
	},
	saveButton: {
		alignSelf: "flex-start",
		marginTop: 4,
	},
});

export default VetAppointmentsScreen;

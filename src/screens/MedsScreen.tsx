import React, { useEffect, useState } from "react";
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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getDb } from "../db/database";
import { useDogContext } from "../context/DogContext";
import { Medication, Vaccination } from "../types";
import { colors } from "../theme/colors";
import {
	ensureNotificationPermissions,
	scheduleOneOffNotification,
} from "../services/notifications";

type MedsTab = "meds" | "vaccines";

function formatDateYYYYMMDD(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

function formatTimeHHMM(date: Date): string {
	const h = String(date.getHours()).padStart(2, "0");
	const m = String(date.getMinutes()).padStart(2, "0");
	return `${h}:${m}`;
}

const MedsScreen: React.FC = () => {
	const { dogs, currentDogId, currentDog } = useDogContext();
	const [activeTab, setActiveTab] = useState<MedsTab>("meds");
	const [meds, setMeds] = useState<Medication[]>([]);
	const [vaccines, setVaccines] = useState<Vaccination[]>([]);
	const [name, setName] = useState("");
	const [dose, setDose] = useState("");
	const [unit, setUnit] = useState("mg");
	const [time, setTime] = useState("08:00");
	const [timeObj, setTimeObj] = useState<Date>(() => {
		const [h, m] = "08:00".split(":").map((v) => Number(v));
		const now = new Date();
		return new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			h || 8,
			m || 0,
			0,
		);
	});
	const [showTimePicker, setShowTimePicker] = useState(false);
	// When adding a med, which dog it's for (synced with current dog when switching from other tabs)
	const [addMedForDogId, setAddMedForDogId] = useState<string | null>(
		currentDogId,
	);

	const [vaccineName, setVaccineName] = useState("");
	const [vaccineDate, setVaccineDate] = useState(
		new Date().toISOString().slice(0, 10),
	);
	const [vaccineDateObj, setVaccineDateObj] = useState<Date>(new Date());
	const [showVaccineDatePicker, setShowVaccineDatePicker] = useState(false);
	const [vaccineNotes, setVaccineNotes] = useState("");
	const [addVaccineForDogId, setAddVaccineForDogId] = useState<string | null>(
		currentDogId,
	);

	useEffect(() => {
		setAddMedForDogId((prev) => currentDogId ?? prev);
		setAddVaccineForDogId((prev) => currentDogId ?? prev);
	}, [currentDogId]);

	useEffect(() => {
		if (!currentDog) return;
		const load = async () => {
			const db = getDb();
			try {
				const rows = await db.getAllAsync<any>(
					"SELECT * FROM medications WHERE dogId = ? ORDER BY name ASC",
					[currentDog.id],
				);
				const list: Medication[] = rows.map((row: any) => ({
					id: row.id,
					dogId: row.dogId,
					name: row.name,
					dose: row.dose,
					unit: row.unit,
					scheduleType: row.scheduleType,
					timesOfDayJson: row.timesOfDayJson,
					intervalHours: row.intervalHours,
					startDate: row.startDate,
					endDate: row.endDate,
					notes: row.notes,
				}));
				setMeds(list);
			} catch {
				// ignore
			}
		};
		void load();
	}, [currentDog]);

	useEffect(() => {
		if (!currentDog) return;
		const load = async () => {
			const db = getDb();
			try {
				const rows = await db.getAllAsync<any>(
					"SELECT * FROM vaccinations WHERE dogId = ? ORDER BY vaccineDate DESC, vaccineName ASC",
					[currentDog.id],
				);
				const list: Vaccination[] = rows.map((row: any) => ({
					id: row.id,
					dogId: row.dogId,
					vaccineName: row.vaccineName,
					vaccineDate: row.vaccineDate,
					notes: row.notes,
					createdAt: row.createdAt,
				}));
				setVaccines(list);
			} catch {
				// ignore
			}
		};
		void load();
	}, [currentDog]);

	useEffect(() => {
		const parsed = new Date(`${vaccineDate}T00:00:00`);
		if (!Number.isNaN(parsed.getTime())) {
			setVaccineDateObj(parsed);
		}
	}, [vaccineDate]);

	useEffect(() => {
		const parts = time.split(":");
		const hours = Number(parts[0]);
		const minutes = Number(parts[1] ?? 0);
		if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return;
		const now = new Date();
		setTimeObj(
			new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate(),
				hours,
				minutes,
				0,
			),
		);
	}, [time]);

	const handleAdd = async () => {
		const dogForMed =
			dogs.length >= 1 && addMedForDogId
				? (dogs.find((d) => d.id === addMedForDogId) ?? null)
				: currentDog;
		if (!dogForMed) {
			Alert.alert(
				"Add a dog first",
				"You need a dog profile to add medications.",
			);
			return;
		}
		const trimmedName = name.trim();
		if (!trimmedName) return;
		const numericDose = Number(dose) || 0;
		const id = `med_${Date.now()}`;
		const db = getDb();
		const timesOfDayJson = JSON.stringify([time]);
		const today = new Date().toISOString().slice(0, 10);

		try {
			await db.runAsync(
				"INSERT INTO medications (id, dogId, name, dose, unit, scheduleType, timesOfDayJson, startDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
				[
					id,
					dogForMed.id,
					trimmedName,
					numericDose,
					unit,
					"times-per-day",
					timesOfDayJson,
					today,
				],
			);
			const item: Medication = {
				id,
				dogId: dogForMed.id,
				name: trimmedName,
				dose: numericDose,
				unit,
				scheduleType: "times-per-day",
				timesOfDayJson,
				startDate: today,
			};
			if (dogForMed.id === currentDog?.id) {
				setMeds((prev) => [...prev, item]);
			}
		} catch {
			Alert.alert("Error", "Could not save medication.");
		}

		setName("");
		setDose("");

		await ensureNotificationPermissions();
		const [hours, minutes] = time.split(":").map((val) => Number(val));
		const now = new Date();
		const triggerDate = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			hours,
			minutes || 0,
			0,
		);
		if (triggerDate.getTime() <= now.getTime()) {
			triggerDate.setDate(triggerDate.getDate() + 1);
		}
		await scheduleOneOffNotification({
			identifier: id,
			title: `Medication for ${dogForMed.name}`,
			body: `${trimmedName} – ${numericDose || ""} ${unit}`.trim(),
			triggerDate,
		});
	};

	const handleAddVaccine = async () => {
		const dogForVaccine =
			dogs.length >= 1 && addVaccineForDogId
				? (dogs.find((d) => d.id === addVaccineForDogId) ?? null)
				: currentDog;
		if (!dogForVaccine) {
			Alert.alert(
				"Add a dog first",
				"You need a dog profile to add vaccine dates.",
			);
			return;
		}

		const trimmedName = vaccineName.trim();
		const trimmedDate = vaccineDate.trim();
		if (!trimmedName || !trimmedDate) return;

		const id = `vax_${Date.now()}`;
		const createdAt = new Date().toISOString();
		const db = getDb();
		try {
			await db.runAsync(
				"INSERT INTO vaccinations (id, dogId, vaccineName, vaccineDate, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
				[
					id,
					dogForVaccine.id,
					trimmedName,
					trimmedDate,
					vaccineNotes.trim() || null,
					createdAt,
				],
			);

			const item: Vaccination = {
				id,
				dogId: dogForVaccine.id,
				vaccineName: trimmedName,
				vaccineDate: trimmedDate,
				notes: vaccineNotes.trim() || null,
				createdAt,
			};
			if (dogForVaccine.id === currentDog?.id) {
				setVaccines((prev) => [item, ...prev]);
			}
		} catch {
			Alert.alert("Error", "Could not save vaccine date.");
		}

		setVaccineName("");
		setVaccineNotes("");
		setVaccineDate(formatDateYYYYMMDD(new Date()));
	};

	return (
		<KeyboardAvoidingView
			style={styles.keyboardContainer}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
		>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={styles.title}>Health</Text>
				<View style={styles.tabs}>
					<TouchableOpacity
						style={[
							styles.tab,
							activeTab === "meds" && styles.tabActive,
						]}
						onPress={() => setActiveTab("meds")}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "meds" && styles.tabTextActive,
							]}
						>
							Medication
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[
							styles.tab,
							activeTab === "vaccines" && styles.tabActive,
						]}
						onPress={() => setActiveTab("vaccines")}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "vaccines" &&
									styles.tabTextActive,
							]}
						>
							Vaccines
						</Text>
					</TouchableOpacity>
				</View>

				{activeTab === "meds" ? (
					<>
						<Text style={styles.subtitle}>
							Set up simple daily reminders. For complex schedules
							your vet recommends, use this as a helper alongside
							their instructions.
						</Text>

						<FlatList
							data={meds}
							keyExtractor={(item) => item.id}
							style={styles.list}
							scrollEnabled={false}
							ListHeaderComponent={
								<Text style={styles.listTitle}>
									Current medications
								</Text>
							}
							renderItem={({ item }) => (
								<View style={styles.listItem}>
									<Text style={styles.listItemTitle}>
										{item.name} – {item.dose} {item.unit}
									</Text>
									{item.timesOfDayJson && (
										<Text style={styles.listItemSub}>
											At:{" "}
											{JSON.parse(
												item.timesOfDayJson,
											).join(", ")}
										</Text>
									)}
								</View>
							)}
							ListEmptyComponent={
								<Text style={styles.emptyText}>
									No medications added yet.
								</Text>
							}
						/>

						<View style={styles.card}>
							<Text style={styles.cardTitle}>
								Add a medication
							</Text>
							{dogs.length >= 1 && (
								<View style={styles.forDogRow}>
									<Text style={styles.forDogLabel}>
										For dog:
									</Text>
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										contentContainerStyle={
											styles.forDogScroll
										}
										style={styles.forDogScrollView}
									>
										{dogs.map((d) => {
											const isSelected =
												d.id === addMedForDogId;
											return (
												<TouchableOpacity
													key={d.id}
													style={[
														styles.forDogChip,
														isSelected &&
															styles.forDogChipActive,
													]}
													onPress={() =>
														setAddMedForDogId(d.id)
													}
												>
													<Text
														style={[
															styles.forDogChipText,
															isSelected &&
																styles.forDogChipTextActive,
														]}
													>
														{d.name}
													</Text>
												</TouchableOpacity>
											);
										})}
									</ScrollView>
								</View>
							)}
							<TextInput
								style={styles.input}
								placeholder="Name (e.g. Pimobendan)"
								placeholderTextColor={colors.textSecondary}
								value={name}
								onChangeText={setName}
							/>
							<View style={styles.row}>
								<TextInput
									style={[styles.input, styles.rowInput]}
									placeholder="Dose"
									placeholderTextColor={colors.textSecondary}
									keyboardType="numeric"
									value={dose}
									onChangeText={setDose}
								/>
								<TextInput
									style={[styles.input, styles.rowInput]}
									placeholder="Unit (e.g. mg)"
									placeholderTextColor={colors.textSecondary}
									value={unit}
									onChangeText={setUnit}
								/>
							</View>
							<TouchableOpacity
								style={[styles.input, styles.dateInput]}
								onPress={() => setShowTimePicker(true)}
								activeOpacity={0.8}
							>
								<Text style={styles.dateInputLabel}>Time</Text>
								<Text style={styles.dateInputValue}>{time}</Text>
							</TouchableOpacity>
							{showTimePicker && (
								<View style={styles.datePickerWrap}>
									<DateTimePicker
										value={timeObj}
										mode="time"
										display={
											Platform.OS === "ios"
												? "spinner"
												: "default"
										}
										onChange={(_, selectedDate) => {
											if (Platform.OS !== "ios") {
												setShowTimePicker(false);
											}
											if (!selectedDate) return;
											setTimeObj(selectedDate);
											setTime(formatTimeHHMM(selectedDate));
										}}
									/>
									{Platform.OS === "ios" && (
										<TouchableOpacity
											style={styles.datePickerDone}
											onPress={() => setShowTimePicker(false)}
										>
											<Text style={styles.datePickerDoneText}>
												Done
											</Text>
										</TouchableOpacity>
									)}
								</View>
							)}
							<TouchableOpacity
								style={styles.primaryButton}
								onPress={handleAdd}
							>
								<Text style={styles.primaryButtonText}>
									Save and schedule
								</Text>
							</TouchableOpacity>
						</View>
					</>
				) : (
					<>
						<FlatList
							data={vaccines}
							keyExtractor={(item) => item.id}
							style={styles.list}
							scrollEnabled={false}
							ListHeaderComponent={
								<Text style={styles.listTitle}>
									Vaccine history
								</Text>
							}
							renderItem={({ item }) => (
								<View style={styles.listItem}>
									<Text style={styles.listItemTitle}>
										{item.vaccineName} – {item.vaccineDate}
									</Text>
									{!!item.notes && (
										<Text style={styles.listItemSub}>
											{item.notes}
										</Text>
									)}
								</View>
							)}
							ListEmptyComponent={
								<Text style={styles.emptyText}>
									No vaccines added yet.
								</Text>
							}
						/>

						<View style={styles.card}>
							<Text style={styles.cardTitle}>Add a vaccine</Text>
							{dogs.length >= 1 && (
								<View style={styles.forDogRow}>
									<Text style={styles.forDogLabel}>
										For dog:
									</Text>
									<ScrollView
										horizontal
										showsHorizontalScrollIndicator={false}
										contentContainerStyle={
											styles.forDogScroll
										}
										style={styles.forDogScrollView}
									>
										{dogs.map((d) => {
											const isSelected =
												d.id === addVaccineForDogId;
											return (
												<TouchableOpacity
													key={d.id}
													style={[
														styles.forDogChip,
														isSelected &&
															styles.forDogChipActive,
													]}
													onPress={() =>
														setAddVaccineForDogId(
															d.id,
														)
													}
												>
													<Text
														style={[
															styles.forDogChipText,
															isSelected &&
																styles.forDogChipTextActive,
														]}
													>
														{d.name}
													</Text>
												</TouchableOpacity>
											);
										})}
									</ScrollView>
								</View>
							)}

							<TextInput
								style={styles.input}
								placeholder="Vaccine name (e.g. Rabies)"
								placeholderTextColor={colors.textSecondary}
								value={vaccineName}
								onChangeText={setVaccineName}
							/>
							<TouchableOpacity
								style={[styles.input, styles.dateInput]}
								onPress={() => setShowVaccineDatePicker(true)}
								activeOpacity={0.8}
							>
								<Text style={styles.dateInputLabel}>
									Due date
								</Text>
								<Text style={styles.dateInputValue}>
									{vaccineDate}
								</Text>
							</TouchableOpacity>
							{showVaccineDatePicker && (
								<View style={styles.datePickerWrap}>
									<DateTimePicker
										value={vaccineDateObj}
										mode="date"
										display={
											Platform.OS === "ios"
												? "spinner"
												: "default"
										}
										onChange={(_, selectedDate) => {
											if (Platform.OS !== "ios") {
												setShowVaccineDatePicker(false);
											}
											if (!selectedDate) return;
											setVaccineDateObj(selectedDate);
											setVaccineDate(
												formatDateYYYYMMDD(
													selectedDate,
												),
											);
										}}
									/>
									{Platform.OS === "ios" && (
										<TouchableOpacity
											style={styles.datePickerDone}
											onPress={() =>
												setShowVaccineDatePicker(false)
											}
										>
											<Text
												style={
													styles.datePickerDoneText
												}
											>
												Done
											</Text>
										</TouchableOpacity>
									)}
								</View>
							)}
							<TextInput
								style={styles.input}
								placeholder="Notes (optional)"
								placeholderTextColor={colors.textSecondary}
								value={vaccineNotes}
								onChangeText={setVaccineNotes}
							/>
							<TouchableOpacity
								style={styles.primaryButton}
								onPress={handleAddVaccine}
							>
								<Text style={styles.primaryButtonText}>
									Save vaccine date
								</Text>
							</TouchableOpacity>
						</View>
					</>
				)}
			</ScrollView>
		</KeyboardAvoidingView>
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
		paddingTop: 64,
		paddingBottom: 32,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: colors.textPrimary,
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 14,
		color: colors.textSecondary,
		marginBottom: 16,
	},
	tabs: {
		flexDirection: "row",
		backgroundColor: colors.cardBackground,
		borderRadius: 999,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
		padding: 4,
		marginBottom: 12,
	},
	tab: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 999,
		alignItems: "center",
	},
	tabActive: {
		backgroundColor: colors.primaryBlue,
	},
	tabText: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.textSecondary,
	},
	tabTextActive: {
		color: "#fff",
	},
	list: {
		flex: 1,
		marginBottom: 12,
	},
	listTitle: {
		fontSize: 16,
		fontWeight: "600",
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
	},
	card: {
		backgroundColor: colors.cardBackground,
		padding: 16,
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
		marginBottom: 16,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: colors.textPrimary,
		marginBottom: 8,
	},
	forDogRow: {
		marginBottom: 12,
	},
	forDogLabel: {
		fontSize: 14,
		color: colors.textSecondary,
		fontWeight: "600",
		marginBottom: 6,
	},
	forDogScrollView: {
		minHeight: 44,
	},
	forDogScroll: {
		flexDirection: "row",
		gap: 8,
		paddingVertical: 2,
		alignItems: "center",
	},
	forDogChip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: colors.background,
		borderWidth: 1,
		borderColor: colors.border,
	},
	forDogChipActive: {
		backgroundColor: colors.primaryBlue,
		borderColor: colors.primaryBlue,
	},
	forDogChipText: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.textPrimary,
	},
	forDogChipTextActive: {
		color: "#fff",
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
	dateInput: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	dateInputLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.textSecondary,
	},
	dateInputValue: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	datePickerWrap: {
		marginTop: -4,
		marginBottom: 8,
		borderRadius: 12,
		overflow: "hidden",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
		backgroundColor: colors.cardBackground,
	},
	datePickerDone: {
		paddingVertical: 10,
		alignItems: "center",
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.border,
	},
	datePickerDoneText: {
		color: colors.primaryBlue,
		fontWeight: "700",
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	rowInput: {
		flex: 1,
	},
	primaryButton: {
		backgroundColor: colors.primaryBlue,
		paddingVertical: 10,
		borderRadius: 999,
		alignItems: "center",
	},
	primaryButtonText: {
		color: "#fff",
		fontWeight: "600",
	},
});

export default MedsScreen;

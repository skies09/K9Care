import React, { useEffect, useMemo, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	Image,
	Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDogContext } from "../context/DogContext";
import type { ConditionTag } from "../types";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { Button as AppButton } from "../components/ui/Button";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

type Step = 0 | 1 | 2 | 3 | 4 | 5;

function formatDateYYYYMMDD(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

const CONDITION_OPTIONS: {
	id: ConditionTag;
	label: string;
	description: string;
	icon: keyof typeof Ionicons.glyphMap;
}[] = [
	{
		id: "heart",
		label: "Heart",
		description: "Heart and breathing issues",
		icon: "heart",
	},
	{
		id: "epilepsy",
		label: "Seizures / epilepsy",
		description: "Seizures or fits",
		icon: "flash",
	},
	{
		id: "arthritis",
		label: "Arthritis & mobility",
		description: "Stiffness, pain, mobility",
		icon: "body",
	},
	{
		id: "allergy",
		label: "Allergies & skin",
		description: "Itch, flare-ups, ears",
		icon: "leaf",
	},
	{
		id: "digestive",
		label: "Digestive",
		description: "Stomach, stool, vomiting",
		icon: "nutrition",
	},
	{
		id: "diabetes",
		label: "Diabetes",
		description: "Insulin and glucose",
		icon: "medical",
	},
	{
		id: "kidney",
		label: "Kidney & urinary",
		description: "Water, urine, accidents",
		icon: "water",
	},
	{
		id: "anxiety",
		label: "Anxiety & behaviour",
		description: "Stress and triggers",
		icon: "happy",
	},
];

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
	const { addDog } = useDogContext();

	const [step, setStep] = useState<Step>(0);
	const [name, setName] = useState("");
	const [breed, setBreed] = useState("");
	const [date, setDate] = useState("");
	const [dobObj, setDobObj] = useState<Date>(new Date());
	const [showDobPicker, setShowDobPicker] = useState(false);
	const [weight, setWeight] = useState("");
	const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");
	const [weightUnknown, setWeightUnknown] = useState(false);
	const [selectedConditions, setSelectedConditions] = useState<
		ConditionTag[]
	>([]);

	const canGoNext = useMemo(() => {
		switch (step) {
			case 0:
				return name.trim().length > 0;
			case 1:
				return true; // breed optional
			case 2:
				return true; // date optional
			case 3:
				return weightUnknown || weight.trim().length > 0;
			case 4:
				return selectedConditions.length > 0;
			case 5:
				return true;
			default:
				return false;
		}
	}, [step, name, weightUnknown, weight, selectedConditions.length]);

	const toggleCondition = (id: ConditionTag) => {
		setSelectedConditions((prev) => {
			if (prev.includes(id)) {
				return prev.filter((c) => c !== id);
			}
			if (prev.length >= 3) {
				Alert.alert(
					"Limit reached",
					"You can choose up to 3 to start. You can add more later.",
				);
				return prev;
			}
			return [...prev, id];
		});
	};

	useEffect(() => {
		if (!date?.trim()) return;
		const parsed = new Date(`${date}T00:00:00`);
		if (!Number.isNaN(parsed.getTime())) setDobObj(parsed);
	}, [date]);

	const handleNext = () => {
		if (!canGoNext) return;
		if (step < 5) {
			setStep((prev) => (prev + 1) as Step);
		} else {
			handleFinish();
		}
	};

	const handleBack = () => {
		if (step === 0) return;
		setStep((prev) => (prev - 1) as Step);
	};

	const handleFinish = async () => {
		try {
			const parsedWeightKg =
				weightUnknown || !weight.trim()
					? null
					: weightUnit === "kg"
						? Number(weight)
						: Number(weight) * 0.453592;

			await addDog({
				name,
				breed: breed.trim() || null,
				dob: date.trim() || null,
				weightKg: Number.isFinite(parsedWeightKg || NaN)
					? parsedWeightKg
					: null,
				primaryConditions: selectedConditions,
			});

			navigation.reset({
				index: 0,
				routes: [{ name: "Tabs" }],
			});
		} catch (e: any) {
			Alert.alert(
				"Error",
				e?.message ?? "Something went wrong saving your dog.",
			);
		}
	};

	const renderStep = () => {
		switch (step) {
			case 0:
				return (
					<View style={styles.centerContent}>
						<Image
							source={require("../../assets/medical.png")}
							style={styles.imagePlaceholder}
							resizeMode="contain"
							accessible
							accessibilityLabel="Medical kit icon for dog health"
						/>
						<Text style={styles.tagline}>
							Let&apos;s set up your dog&apos;s health space.
						</Text>
						<View style={styles.fieldGroup}>
							<Text style={styles.label}>Dog&apos;s name</Text>
							<TextInput
								style={styles.input}
								placeholder="e.g. Bella"
								placeholderTextColor="rgba(255,255,255,0.8)"
								value={name}
								onChangeText={setName}
								accessibilityLabel="Dog's name"
								autoFocus
							/>
							<AppButton
								title="Next"
								onPress={handleNext}
								disabled={!canGoNext}
								variant="secondary"
								style={[
									styles.primaryBelowFieldButton,
									styles.onboardingButton,
								]}
							/>
						</View>
					</View>
				);
			case 1:
				return (
					<View style={styles.breedContent}>
						<Text style={[styles.title, styles.breedTitle]}>
							What&apos;s {name || "your dog"}&apos;s breed?
						</Text>
						<Text style={styles.body}>
							This helps vets understand their risk factors.
						</Text>
						<Text style={styles.label}>Breed (optional)</Text>
						<TextInput
							style={styles.input}
							placeholder="e.g. Labrador, Mixed"
							placeholderTextColor="rgba(255,255,255,0.8)"
							value={breed}
							onChangeText={setBreed}
						/>
						<Text style={styles.helper}>
							You can leave this blank if you&apos;re not sure.
						</Text>
						<AppButton
							title="Next"
							onPress={handleNext}
							disabled={!canGoNext}
							variant="secondary"
							style={styles.primaryBelowFieldButton}
						/>
					</View>
				);
			case 2:
				return (
					<View style={styles.breedContent}>
						<Text style={styles.title}>
							When is {name || "your dog"}&apos;s birthday?
						</Text>
						<Text style={styles.label}>(optional)</Text>
						<TouchableOpacity
							style={[styles.input, styles.dateInput]}
							onPress={() => setShowDobPicker(true)}
							activeOpacity={0.85}
						>
							<Text style={styles.dateInputLabel}>Birthday</Text>
							<Text style={styles.dateInputValue}>
								{date?.trim() ? date : "Select"}
							</Text>
						</TouchableOpacity>
						{showDobPicker && (
							<View style={styles.datePickerWrap}>
								<DateTimePicker
									value={dobObj}
									mode="date"
									display={Platform.OS === "ios" ? "spinner" : "default"}
									onChange={(_, selectedDate) => {
										if (Platform.OS !== "ios") {
											setShowDobPicker(false);
										}
										if (!selectedDate) return;
										setDobObj(selectedDate);
										setDate(formatDateYYYYMMDD(selectedDate));
									}}
								/>
								{Platform.OS === "ios" && (
									<TouchableOpacity
										style={styles.datePickerDone}
										onPress={() => setShowDobPicker(false)}
									>
										<Text style={styles.datePickerDoneText}>
											Done
										</Text>
									</TouchableOpacity>
								)}
								<TouchableOpacity
									style={styles.datePickerClear}
									onPress={() => {
										setDate("");
										setShowDobPicker(false);
									}}
								>
									<Text style={styles.datePickerClearText}>
										Clear birthday
									</Text>
								</TouchableOpacity>
							</View>
						)}
						<Text style={styles.helper}>An estimate is fine.</Text>
						<AppButton
							title="Next"
							onPress={handleNext}
							disabled={!canGoNext}
							variant="secondary"
							style={styles.primaryBelowFieldButton}
						/>
					</View>
				);
			case 3:
				return (
					<View style={styles.breedContent}>
						<Text style={styles.title}>
							What does {name || "your dog"} weigh?
						</Text>
						<Text style={styles.body}>
							An estimate is okay. You can update this anytime.
						</Text>
						<View style={styles.row}>
							<TextInput
								style={[styles.input, styles.inputWeight]}
								placeholder="e.g. 12.5"
								placeholderTextColor="rgba(255,255,255,0.8)"
								value={weight}
								onChangeText={(text) => {
									setWeight(text);
									setWeightUnknown(false);
								}}
								keyboardType="decimal-pad"
								editable={!weightUnknown}
							/>
							<View style={styles.unitToggle}>
								<TouchableOpacity
									style={[
										styles.chipSmall,
										weightUnit === "kg" &&
											styles.chipActive,
									]}
									onPress={() => setWeightUnit("kg")}
								>
									<Text
										style={[
											styles.chipText,
											weightUnit === "kg" &&
												styles.chipTextActive,
										]}
									>
										kg
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[
										styles.chipSmall,
										weightUnit === "lb" &&
											styles.chipActive,
									]}
									onPress={() => setWeightUnit("lb")}
								>
									<Text
										style={[
											styles.chipText,
											weightUnit === "lb" &&
												styles.chipTextActive,
										]}
									>
										lb
									</Text>
								</TouchableOpacity>
							</View>
						</View>
						<TouchableOpacity
							style={styles.linkButton}
							onPress={() => {
								setWeight("");
								setWeightUnknown(true);
							}}
						>
							<Text style={styles.linkText}>
								I&apos;m not sure yet
							</Text>
						</TouchableOpacity>
						<AppButton
							title="Next"
							onPress={handleNext}
							disabled={!canGoNext}
							variant="secondary"
							style={styles.primaryBelowFieldButton}
						/>
					</View>
				);
			case 4:
				return (
					<View style={styles.breedContent}>
						<Text style={styles.title}>
							What do you want to keep an eye on?
						</Text>
						<Text style={styles.body}>
							Choose up to 3 to start. You can change these later.
						</Text>
						<Text style={styles.helper}>
							{selectedConditions.length} of 3 selected
						</Text>
						<View style={styles.conditionsList}>
							{CONDITION_OPTIONS.map((option) => {
								const active = selectedConditions.includes(
									option.id,
								);
								return (
									<TouchableOpacity
										key={option.id}
										style={[
											styles.conditionCard,
											active && styles.conditionCardSelected,
										]}
										onPress={() =>
											toggleCondition(option.id)
										}
										activeOpacity={0.8}
									>
										<Ionicons
											name={option.icon}
											size={28}
											color={active ? "#FFFFFF" : "rgba(255,255,255,0.85)"}
											style={styles.conditionCardIcon}
										/>
										<View style={styles.conditionCardContent}>
											<Text
												style={[
													styles.conditionCardTitle,
													active && styles.conditionCardTitleSelected,
												]}
											>
												{option.label}
											</Text>
											<Text style={styles.conditionCardDescription}>
												{option.description}
											</Text>
										</View>
										<View
											style={[
												styles.conditionCardCircle,
												active && styles.conditionCardCircleSelected,
											]}
										>
											{active && (
												<Ionicons
													name="checkmark"
													size={16}
													color={colors.primaryBlue}
												/>
											)}
										</View>
									</TouchableOpacity>
								);
							})}
						</View>
						<AppButton
							title="Next"
							onPress={handleNext}
							disabled={!canGoNext}
							variant="secondary"
							style={styles.primaryBelowFieldButton}
						/>
					</View>
				);
			case 5:
			default:
				return (
					<View style={styles.breedContent}>
						<Text style={styles.title}>
							All set for {name || "your dog"}
						</Text>
						<View style={styles.summaryCard}>
							<Text style={styles.summaryLine}>Name: {name}</Text>
							{!!breed && (
								<Text style={styles.summaryLine}>
									Breed: {breed}
								</Text>
							)}
							{!!date && (
								<Text style={styles.summaryLine}>Birthday: {date}</Text>
							)}
							<Text style={styles.summaryLine}>
								Weight:{" "}
								{weightUnknown || !weight
									? "Not set"
									: `${weight} ${weightUnit}`}
							</Text>
							<Text
								style={[
									styles.summaryLine,
									styles.summaryLineLast,
								]}
							>
								Tracking:{" "}
								{selectedConditions.length
									? selectedConditions
											.map(
												(id) =>
													CONDITION_OPTIONS.find(
														(o) => o.id === id,
													)?.label ?? id,
											)
											.join(", ")
									: "None yet"}
							</Text>
						</View>
						<Text style={styles.body}>
							You can edit these details later from the Dogs
							screen.
						</Text>
						<AppButton
							title="Get started"
							onPress={handleNext}
							disabled={!canGoNext}
							variant="secondary"
							style={styles.primaryBelowFieldButton}
						/>
					</View>
				);
		}
	};

	return (
		<View style={styles.keyboardContainer}>
			{step > 0 && (
				<TouchableOpacity
					onPress={handleBack}
					style={styles.backIconButton}
					accessibilityRole="button"
					accessibilityLabel="Go back"
				>
					<Ionicons name="chevron-back" size={24} color="#FFFFFF" />
				</TouchableOpacity>
			)}
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
				scrollEnabled={true}
				showsVerticalScrollIndicator={true}
			>
				<View style={styles.headerRow}>
					<Text style={styles.brand} accessibilityRole="header">
						K9Care
					</Text>
				</View>
				<View
					style={styles.stepIndicator}
					accessible
					accessibilityLabel={`Onboarding progress, step ${step + 1} of 6`}
				>
					{[0, 1, 2, 3, 4, 5].map((i) => (
						<View
							key={i}
							style={[
								styles.stepDot,
								step === i && styles.stepDotActive,
								step > i && styles.stepDotCompleted,
							]}
						/>
					))}
				</View>
				{renderStep()}
			</ScrollView>
			{/* No global footer button; each step shows its own CTA in context */}
		</View>
	);
};

const styles = StyleSheet.create({
	keyboardContainer: {
		flex: 1,
		backgroundColor: colors.primaryBlue,
	},
	container: {
		flex: 1,
		backgroundColor: colors.primaryBlue,
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.xl * 1.5,
		paddingBottom: spacing.lg,
		justifyContent: "flex-start",
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		marginBottom: spacing.sm,
	},
	brand: {
		fontSize: 22,
		fontWeight: "700",
		color: "#ffffff",
		marginBottom: 4,
	},
	stepIndicator: {
		flexDirection: "row",
		alignSelf: "flex-end",
		marginBottom: spacing.lg,
	},
	stepDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "rgba(255,255,255,0.4)",
		marginRight: 6,
	},
	stepDotActive: {
		backgroundColor: "#ffffff",
	},
	stepDotCompleted: {
		backgroundColor: "#ffffff",
		opacity: 0.6,
	},
	centerContent: {
		alignItems: "center",
		justifyContent: "flex-start",
		marginTop: spacing.md,
	},
	imagePlaceholder: {
		width: 140,
		height: 140,
		borderRadius: 70,
		backgroundColor: "#FFFFFF",
		marginBottom: spacing.md,
	},
	tagline: {
		fontSize: 20,
		fontWeight: "600",
		color: "#ffffff",
		textAlign: "center",
		marginBottom: spacing.lg,
	},
	fieldGroup: {
		alignSelf: "stretch",
		marginTop: spacing.sm,
	},
	title: {
		fontSize: 26,
		fontWeight: "700",
		color: "#ffffff",
		marginBottom: spacing.sm,
	},
	breedTitle: {
		marginTop: spacing.lg,
	},
	body: {
		fontSize: 18,
		color: "rgba(255,255,255,0.9)",
		marginBottom: spacing.md,
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
		color: "#ffffff",
		marginBottom: 4,
	},
	input: {
		height: 48,
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.4)",
		paddingHorizontal: 12,
		backgroundColor: "rgba(255,255,255,0.1)",
		color: "#ffffff",
		marginBottom: spacing.sm,
	},
	dateInput: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	dateInputLabel: {
		fontSize: 16,
		fontWeight: "600",
		color: "rgba(255,255,255,0.9)",
	},
	dateInputValue: {
		fontSize: 16,
		fontWeight: "700",
		color: "#ffffff",
	},
	datePickerWrap: {
		marginTop: -6,
		marginBottom: spacing.sm,
		borderRadius: 12,
		overflow: "hidden",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.4)",
		backgroundColor: "rgba(255,255,255,0.08)",
	},
	datePickerDone: {
		paddingVertical: 10,
		alignItems: "center",
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "rgba(255,255,255,0.35)",
	},
	datePickerDoneText: {
		color: "#ffffff",
		fontWeight: "700",
	},
	datePickerClear: {
		paddingVertical: 10,
		alignItems: "center",
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "rgba(255,255,255,0.35)",
	},
	datePickerClearText: {
		color: "rgba(255,255,255,0.85)",
		fontWeight: "600",
	},
	inputWeight: {
		flex: 1,
		marginRight: spacing.sm,
	},
	helper: {
		fontSize: 15,
		color: "rgba(255,255,255,0.9)",
		marginTop: 4,
	},
	chipRow: {
		flexDirection: "row",
		marginBottom: spacing.sm,
	},
	chip: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 999,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.4)",
		backgroundColor: "rgba(255,255,255,0.1)",
		marginRight: 8,
	},
	chipSmall: {
		minWidth: 64,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		borderRadius: 999,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.4)",
		backgroundColor: "rgba(255,255,255,0.1)",
		marginRight: 4,
		alignItems: "center",
		justifyContent: "center",
	},
	chipActive: {
		borderColor: "#ffffff",
		backgroundColor: "rgba(255,255,255,0.2)",
	},
	chipText: {
		fontSize: 15,
		color: "rgba(255,255,255,0.9)",
	},
	chipTextActive: {
		color: "#ffffff",
		fontWeight: "600",
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
	},
	unitToggle: {
		flexDirection: "row",
	},
	linkButton: {
		marginTop: spacing.sm,
		alignSelf: "flex-start",
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		borderRadius: 999,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.7)",
		backgroundColor: "rgba(255,255,255,0.1)",
	},
	linkText: {
		fontSize: 16,
		color: "#ffffff",
	},
	conditionsList: {
		marginTop: spacing.sm,
	},
	conditionCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 14,
		borderWidth: 2,
		borderColor: "rgba(255,255,255,0.35)",
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.md,
		marginBottom: spacing.sm,
	},
	conditionCardSelected: {
		borderColor: "#FFFFFF",
		backgroundColor: "rgba(255,255,255,0.18)",
	},
	conditionCardIcon: {
		marginRight: spacing.sm,
	},
	conditionCardContent: {
		flex: 1,
		justifyContent: "center",
	},
	conditionCardTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#ffffff",
		marginBottom: 4,
	},
	conditionCardTitleSelected: {
		color: "#ffffff",
	},
	conditionCardDescription: {
		fontSize: 13,
		color: "rgba(255,255,255,0.85)",
		lineHeight: 18,
	},
	conditionCardCircle: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 2,
		borderColor: "rgba(255,255,255,0.6)",
		alignItems: "center",
		justifyContent: "center",
		marginLeft: spacing.sm,
	},
	conditionCardCircleSelected: {
		backgroundColor: "#FFFFFF",
		borderColor: "#FFFFFF",
	},
	summaryCard: {
		backgroundColor: "rgba(255,255,255,0.1)",
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.4)",
		padding: spacing.md,
		marginTop: spacing.sm,
		marginBottom: spacing.md,
	},
	summaryLine: {
		fontSize: 16,
		color: "#ffffff",
		marginBottom: 4,
	},
	summaryLineLast: {
		marginBottom: 0,
	},
	footer: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.lg,
		paddingTop: spacing.sm,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: colors.primaryBlue,
	},
	primaryBelowFieldButton: {
		marginTop: spacing.md,
		alignSelf: "stretch",
	},
	onboardingButton: {
		backgroundColor: "#FFFFFF",
	},
	backText: {
		fontSize: 16,
		color: "rgba(255,255,255,0.9)",
	},
	footerButton: {
		backgroundColor: "#FFFFFF",
	},
	backIconButton: {
		position: "absolute",
		top: spacing.xl * 1.5,
		left: spacing.lg,
		zIndex: 20,
		padding: spacing.xs,
	},
});

export default OnboardingScreen;

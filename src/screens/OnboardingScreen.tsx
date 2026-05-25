import React, { useMemo, useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { PartialDobPicker } from "../components/PartialDobPicker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDogContext } from "../context/DogContext";
import type { ConditionTag } from "../types";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { fonts, textStyles } from "../theme/typography";
import { spacing } from "../theme/spacing";
import { Button as AppButton } from "../components/ui/Button";
import {
	buildDobString,
	formatDobDisplay,
	parseDobParts,
	type DobParts,
} from "../utils/dobFormat";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

type Step = 0 | 1 | 2 | 3 | 4 | 5;

function defaultDobParts(): DobParts {
	return { year: new Date().getFullYear() - 2, month: 0, day: 0 };
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
	const [dobParts, setDobParts] = useState<DobParts>(defaultDobParts);
	const [weight, setWeight] = useState("");
	const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");
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
				return weight.trim().length > 0;
			case 4:
				return selectedConditions.length > 0;
			case 5:
				return true;
			default:
				return false;
		}
	}, [step, name, weight, selectedConditions.length]);

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

	const handleDobChange = (parts: DobParts) => {
		setDobParts(parts);
		setDate(buildDobString(parts));
	};

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
			const parsedWeightKg = !weight.trim()
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
						<View style={[styles.fieldGroup, styles.nameStepCard]}>
							<Text style={styles.nameQuestion}>
								What is your dog&apos;s name?
							</Text>
							<TextInput
								style={styles.inputOnLight}
								placeholder="e.g. Bella"
								placeholderTextColor="rgba(31, 111, 120, 0.45)"
								value={name}
								onChangeText={setName}
								accessibilityLabel="Dog's name"
								autoFocus
							/>
							<AppButton
								title="Next"
								onPress={handleNext}
								disabled={!canGoNext}
								variant="onboarding"
								size="large"
								style={styles.primaryBelowFieldButton}
							/>
						</View>
					</View>
				);
			case 1:
				return (
					<View style={styles.centerContent}>
						<View style={[styles.fieldGroup, styles.nameStepCard]}>
							<Text style={styles.nameQuestion}>
								What&apos;s {name || "your dog"}&apos;s breed?
							</Text>
							<View style={styles.helperBlock}>
								<Text style={styles.helperOnLight}>
									This helps vets understand their risk
									factors. Optional — leave blank if
									you&apos;re not sure.
								</Text>
							</View>
							<TextInput
								style={styles.inputOnLight}
								placeholder="e.g. Labrador, Mixed"
								placeholderTextColor="rgba(31, 111, 120, 0.45)"
								value={breed}
								onChangeText={setBreed}
							/>
							<AppButton
								title="Next"
								onPress={handleNext}
								disabled={!canGoNext}
								variant="onboarding"
								size="large"
								style={styles.primaryBelowFieldButton}
							/>
						</View>
					</View>
				);
			case 2:
				return (
					<View style={styles.centerContent}>
						<View style={[styles.fieldGroup, styles.nameStepCard]}>
							<Text style={styles.nameQuestion}>
								When is {name || "your dog"}&apos;s birthday?
							</Text>
							<View style={styles.helperBlock}>
								<Text style={styles.helperOnLight}>
									Tap Year, Month, or Day to change each part.
									Optional — year only is fine.
								</Text>
							</View>
							<View style={styles.datePickerWrapOnLight}>
								<PartialDobPicker
									parts={dobParts}
									onChange={handleDobChange}
								/>
							</View>
							<TouchableOpacity
								style={styles.linkSkipOnLight}
								onPress={() => {
									setDate("");
									setDobParts(defaultDobParts());
									setStep((prev) => (prev + 1) as Step);
								}}
								accessibilityRole="button"
								accessibilityLabel="Skip birthday and continue"
							>
								<Text style={styles.linkSkipTextOnLight}>
									I don&apos;t know their birthday
								</Text>
							</TouchableOpacity>
							<AppButton
								title="Next"
								onPress={handleNext}
								disabled={!canGoNext}
								variant="onboarding"
								size="large"
								style={styles.primaryBelowFieldButton}
							/>
						</View>
					</View>
				);
			case 3:
				return (
					<View style={styles.centerContent}>
						<View style={[styles.fieldGroup, styles.nameStepCard]}>
							<Text style={styles.nameQuestion}>
								What does {name || "your dog"} weigh?
							</Text>
							<View style={styles.helperBlock}>
								<Text style={styles.helperOnLight}>
									You can update this anytime.{"\n"}Optional —
									an estimate is fine.
								</Text>
							</View>
							<View style={styles.weightRow}>
								<TextInput
									style={[
										styles.inputOnLight,
										styles.inputWeightOnLight,
									]}
									placeholder="e.g. 12.5"
									placeholderTextColor="rgba(31, 111, 120, 0.45)"
									value={weight}
									onChangeText={setWeight}
									keyboardType="decimal-pad"
									autoFocus
								/>
								<View style={styles.unitToggle}>
									<TouchableOpacity
										style={[
											styles.chipOnLight,
											weightUnit === "kg" &&
												styles.chipOnLightActive,
										]}
										onPress={() => setWeightUnit("kg")}
									>
										<Text
											style={[
												styles.chipOnLightText,
												weightUnit === "kg" &&
													styles.chipOnLightTextActive,
											]}
										>
											kg
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.chipOnLight,
											weightUnit === "lb" &&
												styles.chipOnLightActive,
										]}
										onPress={() => setWeightUnit("lb")}
									>
										<Text
											style={[
												styles.chipOnLightText,
												weightUnit === "lb" &&
													styles.chipOnLightTextActive,
											]}
										>
											lb
										</Text>
									</TouchableOpacity>
								</View>
							</View>
							<TouchableOpacity
								style={styles.linkSkipOnLight}
								onPress={() => {
									setWeight("");
									setStep((prev) => (prev + 1) as Step);
								}}
								accessibilityRole="button"
								accessibilityLabel="Skip weight, not sure yet"
							>
								<Text style={styles.linkSkipTextOnLight}>
									I&apos;m not sure yet
								</Text>
							</TouchableOpacity>
							<AppButton
								title="Next"
								onPress={handleNext}
								disabled={!canGoNext}
								variant="onboarding"
								size="large"
								style={styles.primaryBelowFieldButton}
							/>
						</View>
					</View>
				);
			case 4:
				return (
					<View style={styles.centerContent}>
						<View style={[styles.fieldGroup, styles.nameStepCard]}>
							<Text style={styles.nameQuestion}>
								What conditions do you want to keep an eye on?
							</Text>
							<View style={styles.helperBlock}>
								<Text style={styles.helperOnLight}>
									Choose up to 3 to start.{"\n"}You can change
									these later.
								</Text>
								<Text style={styles.helperOnLight}>
									{selectedConditions.length} of 3 selected
								</Text>
							</View>
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
												active &&
													styles.conditionCardSelected,
											]}
											onPress={() =>
												toggleCondition(option.id)
											}
											activeOpacity={0.8}
										>
											<Ionicons
												name={option.icon}
												size={28}
												color={
													active
														? colors.textOnPrimary
														: colors.primary
												}
												style={styles.conditionCardIcon}
											/>
											<View
												style={
													styles.conditionCardContent
												}
											>
												<Text
													style={[
														styles.conditionCardTitle,
														active &&
															styles.conditionCardTitleSelected,
													]}
												>
													{option.label}
												</Text>
												<Text
													style={[
														styles.conditionCardDescription,
														active &&
															styles.conditionCardDescriptionSelected,
													]}
												>
													{option.description}
												</Text>
											</View>
											<View
												style={[
													styles.conditionCardCircle,
													active &&
														styles.conditionCardCircleSelected,
												]}
											>
												{active && (
													<MaterialCommunityIcons
														name="check-bold"
														size={20}
														color={colors.primary}
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
								variant="onboarding"
								size="large"
								style={styles.primaryBelowFieldButton}
							/>
						</View>
					</View>
				);
			case 5:
			default: {
				const trackingLabels = selectedConditions
					.map(
						(id) =>
							CONDITION_OPTIONS.find((o) => o.id === id)?.label ??
							id,
					)
					.join(", ");
				const summaryItems = [
					{
						label: "Name",
						value: name,
						complete: name.trim().length > 0,
						emptyText: "Not set",
					},
					{
						label: "Breed",
						value: breed.trim(),
						complete: breed.trim().length > 0,
						emptyText: "Skipped",
					},
					{
						label: "Birthday",
						value: date.trim() ? formatDobDisplay(date) : "",
						complete: date.trim().length > 0,
						emptyText: "Skipped",
					},
					{
						label: "Weight",
						value: weight.trim()
							? `${weight} ${weightUnit}`
							: "",
						complete: weight.trim().length > 0,
						emptyText: "Not set",
					},
					{
						label: "Tracking",
						value: trackingLabels,
						complete: selectedConditions.length > 0,
						emptyText: "None yet",
					},
				];

				return (
					<View style={styles.centerContent}>
						<View style={[styles.fieldGroup, styles.nameStepCard]}>
							<Text style={styles.nameQuestion}>
								All set for {name || "your dog"}
							</Text>
							<View style={styles.summaryCard}>
								{summaryItems.map((item, index) => (
									<View
										key={item.label}
										style={[
											styles.summaryRow,
											item.complete &&
												styles.summaryRowComplete,
											index === summaryItems.length - 1 &&
												styles.summaryRowLast,
										]}
									>
										<View
											style={[
												styles.summaryCheck,
												item.complete &&
													styles.summaryCheckComplete,
											]}
										>
											{item.complete && (
												<MaterialCommunityIcons
													name="check-bold"
													size={16}
													color={colors.textOnPrimary}
												/>
											)}
										</View>
										<View style={styles.summaryRowContent}>
											<Text
												style={[
													styles.summaryLabel,
													!item.complete &&
														styles.summaryLabelMuted,
												]}
											>
												{item.label}
											</Text>
											<Text
												style={[
													styles.summaryValue,
													item.complete &&
														styles.summaryValueComplete,
													!item.complete &&
														styles.summaryValueMuted,
												]}
											>
												{item.complete
													? item.value
													: item.emptyText}
											</Text>
										</View>
									</View>
								))}
							</View>
							<View style={styles.helperBlock}>
								<Text style={styles.helperOnLight}>
									You can edit these details later from the
									Dogs screen.
								</Text>
							</View>
							<AppButton
								title="Get started"
								onPress={handleNext}
								disabled={!canGoNext}
								variant="onboarding"
								size="large"
								style={styles.primaryBelowFieldButton}
							/>
						</View>
					</View>
				);
			}
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
		backgroundColor: colors.primary,
	},
	container: {
		flex: 1,
		backgroundColor: colors.primary,
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
		...textStyles.brand,
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
		fontFamily: fonts.headingSemi,
		fontSize: 20,
		fontWeight: "600",
		color: colors.textOnPrimary,
		textAlign: "center",
		marginBottom: spacing.lg,
	},
	fieldGroup: {
		alignSelf: "stretch",
		marginTop: spacing.sm,
	},
	title: {
		fontFamily: fonts.headingBold,
		fontSize: 26,
		fontWeight: "700",
		color: colors.textOnPrimary,
		marginBottom: spacing.sm,
	},
	body: {
		fontFamily: fonts.body,
		fontSize: 18,
		color: "rgba(255,255,255,0.9)",
		marginBottom: spacing.md,
	},
	label: {
		...textStyles.label,
		color: colors.textOnPrimary,
		marginBottom: 4,
	},
	nameStepCard: {
		alignSelf: "stretch",
		backgroundColor: colors.primaryHover,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.5)",
		padding: spacing.md,
		marginTop: spacing.xs,
	},
	nameQuestion: {
		fontFamily: fonts.headingBold,
		fontSize: 24,
		fontWeight: "700",
		lineHeight: 30,
		color: colors.primary,
		marginBottom: spacing.sm,
	},
	helperBlock: {
		marginBottom: spacing.sm,
		gap: 2,
	},
	helperOnLight: {
		fontFamily: fonts.body,
		fontSize: 15,
		lineHeight: 20,
		color: "rgba(31, 111, 120, 0.75)",
	},
	inputOnLight: {
		height: 52,
		borderRadius: 12,
		borderWidth: 1.5,
		borderColor: colors.primary,
		paddingHorizontal: 14,
		backgroundColor: colors.cardBackground,
		color: colors.primary,
		fontFamily: fonts.body,
		fontSize: 17,
		marginBottom: spacing.sm,
	},
	inputFilled: {
		height: 52,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: colors.cardBackground,
		paddingHorizontal: 14,
		backgroundColor: colors.cardBackground,
		color: colors.primary,
		fontFamily: fonts.body,
		fontSize: 17,
		marginBottom: spacing.sm,
		shadowColor: colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
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
		color: "rgba(31, 111, 120, 0.65)",
	},
	dateInputValue: {
		fontSize: 16,
		fontWeight: "700",
		color: colors.primary,
	},
	datePickerWrapOnLight: {
		marginBottom: spacing.sm,
		borderRadius: 12,
		borderWidth: 1.5,
		borderColor: colors.primary,
		backgroundColor: colors.cardBackground,
	},
	linkSkipOnLight: {
		alignSelf: "center",
		marginTop: spacing.xs,
		marginBottom: spacing.sm,
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.sm,
	},
	linkSkipTextOnLight: {
		fontFamily: fonts.bodyMedium,
		fontSize: 16,
		fontWeight: "600",
		color: colors.primary,
		textDecorationLine: "underline",
	},
	weightRow: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "stretch",
		marginBottom: spacing.sm,
	},
	inputWeightOnLight: {
		flex: 1,
		minWidth: 0,
		marginRight: spacing.sm,
		marginBottom: 0,
	},
	chipOnLight: {
		minWidth: 64,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm + 2,
		borderRadius: 999,
		borderWidth: 1.5,
		borderColor: colors.primary,
		backgroundColor: colors.cardBackground,
		marginRight: 4,
		alignItems: "center",
		justifyContent: "center",
	},
	chipOnLightActive: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	chipOnLightText: {
		fontFamily: fonts.bodyMedium,
		fontSize: 15,
		fontWeight: "600",
		color: colors.primary,
	},
	chipOnLightTextActive: {
		color: colors.textOnPrimary,
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
		marginBottom: spacing.xs,
	},
	conditionCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.cardBackground,
		borderRadius: 12,
		borderWidth: 1.5,
		borderColor: colors.primary,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.md,
		marginBottom: spacing.sm,
	},
	conditionCardSelected: {
		borderColor: colors.primary,
		backgroundColor: colors.primary,
	},
	conditionCardIcon: {
		marginRight: spacing.sm,
	},
	conditionCardContent: {
		flex: 1,
		justifyContent: "center",
	},
	conditionCardTitle: {
		fontFamily: fonts.headingBold,
		fontSize: 17,
		fontWeight: "700",
		color: colors.primary,
		marginBottom: 4,
	},
	conditionCardTitleSelected: {
		color: colors.textOnPrimary,
	},
	conditionCardDescription: {
		fontFamily: fonts.body,
		fontSize: 13,
		color: "rgba(31, 111, 120, 0.75)",
		lineHeight: 18,
	},
	conditionCardDescriptionSelected: {
		color: "rgba(255, 255, 255, 0.9)",
	},
	conditionCardCircle: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 2,
		borderColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
		marginLeft: spacing.sm,
	},
	conditionCardCircleSelected: {
		backgroundColor: colors.textOnPrimary,
		borderColor: colors.textOnPrimary,
	},
	summaryCard: {
		backgroundColor: colors.cardBackground,
		borderRadius: 12,
		borderWidth: 1.5,
		borderColor: colors.primary,
		padding: spacing.sm,
		marginBottom: spacing.sm,
		gap: spacing.xs,
	},
	summaryRow: {
		flexDirection: "row",
		alignItems: "center",
		borderRadius: 10,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.sm,
	},
	summaryRowComplete: {
		backgroundColor: colors.primarySoft,
		borderWidth: 1.5,
		borderColor: colors.primary,
	},
	summaryRowLast: {
		marginBottom: 0,
	},
	summaryCheck: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 2,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
		marginRight: spacing.sm,
	},
	summaryCheckComplete: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	summaryRowContent: {
		flex: 1,
	},
	summaryLabel: {
		fontFamily: fonts.bodyMedium,
		fontSize: 13,
		fontWeight: "600",
		color: colors.primary,
		marginBottom: 2,
	},
	summaryLabelMuted: {
		color: colors.textSecondary,
	},
	summaryValue: {
		fontFamily: fonts.body,
		fontSize: 15,
		lineHeight: 20,
		color: colors.textSecondary,
	},
	summaryValueComplete: {
		fontFamily: fonts.headingBold,
		fontSize: 17,
		fontWeight: "700",
		lineHeight: 22,
		color: colors.primary,
	},
	summaryValueMuted: {
		fontStyle: "italic",
	},
	footer: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.lg,
		paddingTop: spacing.sm,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: colors.primary,
	},
	primaryBelowFieldButton: {
		marginTop: spacing.md,
		alignSelf: "stretch",
		width: "100%",
	},
	backText: {
		fontSize: 16,
		color: "rgba(255,255,255,0.9)",
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

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	KeyboardAvoidingView,
	Platform,
	Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { File, Directory, Paths } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDogContext } from "../context/DogContext";
import type { ConditionTag } from "../types";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

const CONDITION_OPTIONS: { id: ConditionTag; label: string }[] = [
	{ id: "heart", label: "Heart" },
	{ id: "epilepsy", label: "Seizures / epilepsy" },
	{ id: "arthritis", label: "Arthritis & mobility" },
	{ id: "allergy", label: "Allergies & skin" },
	{ id: "digestive", label: "Digestive" },
	{ id: "diabetes", label: "Diabetes" },
	{ id: "kidney", label: "Kidney & urinary" },
	{ id: "anxiety", label: "Anxiety & behaviour" },
];

type Props = NativeStackScreenProps<RootStackParamList, "EditDog">;

const EditDogScreen: React.FC<Props> = ({ route, navigation }) => {
	const { dogId } = route.params;
	const insets = useSafeAreaInsets();
	const { dogs, updateDog, setCurrentDogId } = useDogContext();
	const dog = dogs.find((d) => d.id === dogId);

	const [name, setName] = useState(dog?.name ?? "");
	const [breed, setBreed] = useState(dog?.breed ?? "");
	const [dob, setDob] = useState(dog?.dob ?? "");
	const [weight, setWeight] = useState(
		dog?.weightKg != null ? String(dog.weightKg) : "",
	);
	const [notes, setNotes] = useState(dog?.notes ?? "");
	const [photoUri, setPhotoUri] = useState<string | null>(
		dog?.photoUri ?? null,
	);
	const [selectedConditions, setSelectedConditions] = useState<
		ConditionTag[]
	>(dog?.primaryConditions ?? []);

	const isFirstMount = useRef(true);

	const buildPayload = useCallback(
		(photo: string | null) => {
			const weightNum = weight.trim() ? parseFloat(weight) : null;
			return {
				name: name.trim(),
				breed: breed.trim() || null,
				dob: dob.trim() || null,
				weightKg:
					weightNum != null && Number.isFinite(weightNum)
						? weightNum
						: null,
				notes: notes.trim() || null,
				photoUri: photo,
				primaryConditions: selectedConditions,
			};
		},
		[name, breed, dob, weight, notes, selectedConditions],
	);

	// Auto-save form fields (debounced). Skip first mount.
	useEffect(() => {
		if (!dog) return;
		if (isFirstMount.current) {
			isFirstMount.current = false;
			return;
		}
		if (name.trim().length === 0) return;
		const t = setTimeout(() => {
			updateDog(dogId, buildPayload(photoUri ?? null));
			setCurrentDogId(dogId);
		}, 600);
		return () => clearTimeout(t);
	}, [dogId, name, breed, dob, weight, notes, selectedConditions]);

	const toggleCondition = (id: ConditionTag) => {
		setSelectedConditions((prev) => {
			if (prev.includes(id)) return prev.filter((c) => c !== id);
			if (prev.length >= 5) return prev; // allow up to 5 when editing
			return [...prev, id];
		});
	};

	const handleSave = () => {
		if (name.trim().length === 0 || !dog) return;
		updateDog(dogId, buildPayload(photoUri ?? null));
		setCurrentDogId(dogId);
		navigation.goBack();
	};

	const pickPhoto = async () => {
		const { status } =
			await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Permission needed",
				"Allow access to your photos to add a dog photo.",
			);
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});
		if (result.canceled || !result.assets?.[0]?.uri) return;
		const uri = result.assets[0].uri;
		try {
			const dir = new Directory(Paths.document, "dog_photos");
			if (!dir.exists) dir.create();
			const destFile = new File(dir, `${dogId}.jpg`);
			// Use legacy copyAsync; it handles image-picker URIs (ph://, content://) reliably
			await FileSystemLegacy.copyAsync({ from: uri, to: destFile.uri });
			setPhotoUri(destFile.uri);
			updateDog(dogId, buildPayload(destFile.uri));
			setCurrentDogId(dogId);
		} catch (e: any) {
			Alert.alert("Error", e?.message ?? "Could not save photo.");
		}
	};

	if (!dog) {
		return (
			<View style={styles.container}>
				<Text style={styles.error}>Dog not found.</Text>
			</View>
		);
	}

	return (
		<>
			<StatusBar style="dark" />
			<KeyboardAvoidingView
				style={styles.keyboard}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
			>
				<ScrollView
					style={styles.container}
					contentContainerStyle={[
						styles.content,
						{ paddingTop: insets.top + 4 },
					]}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.headerRow}>
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
						<TouchableOpacity
							style={[
								styles.saveButtonHeader,
								name.trim().length === 0 && styles.saveButtonHeaderDisabled,
							]}
							onPress={handleSave}
							disabled={name.trim().length === 0}
						>
							<Text style={styles.saveButtonHeaderText}>Save</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.card}>
						<View style={styles.photoSection}>
							{photoUri ? (
								<Image
									source={{ uri: photoUri }}
									style={styles.photoImage}
								/>
							) : (
								<TouchableOpacity
									onPress={pickPhoto}
									style={styles.photoTouchable}
									activeOpacity={0.85}
								>
									<View style={styles.photoPlaceholder}>
										<Ionicons
											name="camera-outline"
											size={32}
											color={colors.primaryBlue}
										/>
										<Text style={styles.photoPlaceholderText}>Add photo</Text>
									</View>
								</TouchableOpacity>
							)}
						</View>
						<TextInput
							style={styles.input}
							value={name}
							onChangeText={setName}
							placeholder="Dog's name"
							placeholderTextColor={colors.textSecondary}
						/>
						<TextInput
							style={styles.input}
							value={breed}
							onChangeText={setBreed}
							placeholder="Breed (optional)"
							placeholderTextColor={colors.textSecondary}
						/>
						<View style={styles.fieldRow}>
							<TextInput
								style={[
									styles.input,
									styles.inputHalf,
									styles.inputHalfFirst,
								]}
								value={dob}
								onChangeText={setDob}
								placeholder="Birthday"
								placeholderTextColor={colors.textSecondary}
							/>
							<TextInput
								style={[styles.input, styles.inputHalf]}
								value={weight}
								onChangeText={setWeight}
								placeholder="Weight (kg)"
								placeholderTextColor={colors.textSecondary}
								keyboardType="decimal-pad"
							/>
						</View>
						<TextInput
							style={[styles.input, styles.noteInput]}
							value={notes}
							onChangeText={setNotes}
							placeholder="Notes (optional)"
							placeholderTextColor={colors.textSecondary}
							multiline
						/>
					</View>

					<View style={styles.card}>
						<View style={styles.cardHeader}>
							<View style={styles.cardIconWrap}>
								<Ionicons
									name="medkit-outline"
									size={28}
									color={colors.primaryBlue}
								/>
							</View>
							<View style={styles.cardTitleBlock}>
								<Text style={styles.cardTitle}>
									Health areas to track
								</Text>
								<Text style={styles.cardSubtitle}>
									Select up to 5.
								</Text>
							</View>
						</View>
						<View style={styles.chips}>
							{CONDITION_OPTIONS.map((opt) => {
								const active = selectedConditions.includes(
									opt.id,
								);
								return (
									<TouchableOpacity
										key={opt.id}
										style={[
											styles.chip,
											active && styles.chipActive,
										]}
										onPress={() => toggleCondition(opt.id)}
										activeOpacity={0.7}
									>
										<Text
											style={[
												styles.chipText,
												active && styles.chipTextActive,
											]}
										>
											{opt.label}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</>
	);
};

const PHOTO_SIZE = 88;

const styles = StyleSheet.create({
	keyboard: { flex: 1, backgroundColor: colors.background },
	container: { flex: 1, backgroundColor: colors.background },
	content: {
		paddingHorizontal: 16,
		paddingBottom: 32,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	backButton: {
		padding: 4,
	},
	saveButtonHeader: {
		paddingVertical: 8,
		paddingHorizontal: 12,
	},
	saveButtonHeaderDisabled: {
		opacity: 0.5,
	},
	saveButtonHeaderText: {
		fontSize: 17,
		fontWeight: "600",
		color: colors.primaryBlue,
	},
	error: { fontSize: 16, color: colors.textSecondary, padding: spacing.lg },
	card: {
		backgroundColor: colors.cardBackground,
		padding: 20,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 8,
		elevation: 3,
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},
	cardIconWrap: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: colors.background,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 14,
	},
	cardTitleBlock: { flex: 1 },
	cardTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	cardSubtitle: {
		fontSize: 13,
		color: colors.textSecondary,
		marginTop: 2,
	},
	photoSection: {
		alignItems: "flex-start",
		marginBottom: 16,
	},
	photoTouchable: { alignSelf: "flex-start" },
	photoImage: {
		width: PHOTO_SIZE,
		height: PHOTO_SIZE,
		borderRadius: PHOTO_SIZE / 2,
	},
	photoPlaceholder: {
		width: PHOTO_SIZE,
		height: PHOTO_SIZE,
		borderRadius: PHOTO_SIZE / 2,
		backgroundColor: colors.background,
		borderWidth: 2,
		borderColor: colors.border,
		borderStyle: "dashed",
		alignItems: "center",
		justifyContent: "center",
	},
	photoPlaceholderText: {
		fontSize: 12,
		color: colors.textSecondary,
		marginTop: 4,
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
	inputHalf: { flex: 1, marginBottom: 0 },
	inputHalfFirst: { marginRight: 8 },
	noteInput: {
		height: 80,
		textAlignVertical: "top",
	},
	fieldRow: {
		flexDirection: "row",
		marginBottom: 8,
	},
	chips: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
	chip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.cardBackground,
		marginRight: 8,
		marginBottom: 8,
	},
	chipActive: {
		borderColor: colors.primaryBlue,
		backgroundColor: "#E6F0FF",
	},
	chipText: { fontSize: 14, color: colors.textSecondary },
	chipTextActive: { color: colors.primaryBlue, fontWeight: "600" },
});

export default EditDogScreen;

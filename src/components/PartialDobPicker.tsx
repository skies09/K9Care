import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { fonts } from "../theme/typography";
import {
	getDayOptions,
	getYearOptions,
	formatDobPartsDisplay,
	type DobParts,
} from "../utils/dobFormat";

const MONTH_LABELS = [
	"—",
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

type ActiveField = "year" | "month" | "day";

type Props = {
	parts: DobParts;
	onChange: (parts: DobParts) => void;
};

export const PartialDobPicker: React.FC<Props> = ({ parts, onChange }) => {
	const [activeField, setActiveField] = useState<ActiveField>("year");
	const years = useMemo(() => getYearOptions(), []);
	const days = useMemo(
		() => getDayOptions(parts.month, parts.year),
		[parts.month, parts.year],
	);

	const setYear = (year: number) => {
		const nextDays = getDayOptions(parts.month, year);
		const day =
			parts.day > 0 && parts.month > 0 && parts.day > nextDays.length
				? 0
				: parts.day;
		onChange({ year, month: parts.month, day });
	};

	const setMonth = (month: number) => {
		if (month <= 0) {
			onChange({ year: parts.year, month: 0, day: 0 });
			return;
		}
		const nextDays = getDayOptions(month, parts.year);
		const day =
			parts.day > 0 && parts.day > nextDays.length ? 0 : parts.day;
		onChange({ year: parts.year, month, day });
	};

	const setDay = (day: number) => {
		onChange({ year: parts.year, month: parts.month, day });
	};

	const dayEnabled = parts.month > 0;
	const pickerHeight = Platform.OS === "ios" ? 216 : 48;

	return (
		<View style={styles.root}>
			<Text style={styles.selectionLabel}>Selected</Text>
			<Text style={styles.selectionValue}>
				{formatDobPartsDisplay(parts)}
			</Text>

			<View style={styles.tabs}>
				{(["year", "month", "day"] as const).map((field) => {
					const isActive = activeField === field;
					const isDay = field === "day";
					const disabled = isDay && !dayEnabled;
					return (
						<Pressable
							key={field}
							style={[
								styles.tab,
								isActive && styles.tabActive,
								disabled && styles.tabDisabled,
							]}
							onPress={() => {
								if (disabled) return;
								setActiveField(field);
							}}
							disabled={disabled}
							accessibilityRole="button"
							accessibilityState={{
								selected: isActive,
								disabled,
							}}
							accessibilityLabel={
								field === "year"
									? "Edit year"
									: field === "month"
										? "Edit month"
										: "Edit day"
							}
						>
							<Text
								style={[
									styles.tabText,
									isActive && styles.tabTextActive,
									disabled && styles.tabTextDisabled,
								]}
							>
								{field === "year"
									? "Year"
									: field === "month"
										? "Month"
										: "Day"}
							</Text>
						</Pressable>
					);
				})}
			</View>

			<View style={styles.pickerPanel}>
				{activeField === "year" && (
					<Picker
						selectedValue={parts.year}
						onValueChange={(v) => setYear(Number(v))}
						style={[styles.picker, { height: pickerHeight }]}
						itemStyle={styles.pickerItem}
						{...(Platform.OS === "android"
							? { mode: "dropdown" as const }
							: {})}
					>
						{years.map((y) => (
							<Picker.Item key={y} label={String(y)} value={y} />
						))}
					</Picker>
				)}
				{activeField === "month" && (
					<Picker
						selectedValue={parts.month}
						onValueChange={(v) => setMonth(Number(v))}
						style={[styles.picker, { height: pickerHeight }]}
						itemStyle={styles.pickerItem}
						{...(Platform.OS === "android"
							? { mode: "dropdown" as const }
							: {})}
					>
						{MONTH_LABELS.map((label, index) => (
							<Picker.Item
								key={label + index}
								label={label}
								value={index}
							/>
						))}
					</Picker>
				)}
				{activeField === "day" && dayEnabled && (
					<Picker
						selectedValue={parts.day}
						onValueChange={(v) => setDay(Number(v))}
						style={[styles.picker, { height: pickerHeight }]}
						itemStyle={styles.pickerItem}
						{...(Platform.OS === "android"
							? { mode: "dropdown" as const }
							: {})}
					>
						<Picker.Item label="—" value={0} />
						{days.map((d) => (
							<Picker.Item key={d} label={String(d)} value={d} />
						))}
					</Picker>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		paddingTop: spacing.sm,
		paddingHorizontal: spacing.xs,
	},
	selectionLabel: {
		fontFamily: fonts.bodyMedium,
		fontSize: 13,
		fontWeight: "600",
		color: "rgba(31, 111, 120, 0.7)",
		textAlign: "center",
		marginBottom: 4,
	},
	selectionValue: {
		fontFamily: fonts.headingBold,
		fontSize: 28,
		fontWeight: "700",
		color: colors.primary,
		textAlign: "center",
		marginBottom: spacing.sm,
	},
	tabs: {
		flexDirection: "row",
		marginBottom: spacing.sm,
		borderRadius: 10,
		backgroundColor: colors.primaryHover,
		padding: 4,
	},
	tab: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: "center",
	},
	tabActive: {
		backgroundColor: colors.cardBackground,
		shadowColor: colors.shadow,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 2,
		elevation: 2,
	},
	tabDisabled: {
		opacity: 0.4,
	},
	tabText: {
		fontFamily: fonts.bodyMedium,
		fontSize: 15,
		fontWeight: "600",
		color: "rgba(31, 111, 120, 0.65)",
	},
	tabTextActive: {
		color: colors.primary,
	},
	tabTextDisabled: {
		color: "rgba(31, 111, 120, 0.45)",
	},
	pickerPanel: {
		backgroundColor: colors.cardBackground,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.border,
		overflow: Platform.OS === "android" ? "hidden" : "visible",
	},
	picker: {
		width: "100%",
		backgroundColor: colors.cardBackground,
	},
	pickerItem: {
		fontSize: 22,
		fontWeight: "600",
		color: colors.primary,
		height: Platform.OS === "ios" ? 216 : undefined,
	},
	hint: {
		fontFamily: fonts.body,
		fontSize: 13,
		lineHeight: 18,
		color: "rgba(31, 111, 120, 0.75)",
		textAlign: "center",
		marginTop: spacing.sm,
		paddingHorizontal: spacing.xs,
	},
});

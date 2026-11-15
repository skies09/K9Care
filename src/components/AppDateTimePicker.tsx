import React, { useMemo, useState } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Platform,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { colors } from "../theme/colors";

type Mode = "time" | "date";

type Props = {
	mode: Mode;
	value: Date;
	label: string;
	displayValue: string;
	onChange: (date: Date) => void;
	style?: StyleProp<ViewStyle>;
};

const MONTH_LABELS = [
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

function daysInMonth(year: number, monthIndex: number): number {
	return new Date(year, monthIndex + 1, 0).getDate();
}

function withDateParts(
	base: Date,
	parts: { year?: number; month?: number; day?: number },
): Date {
	const year = parts.year ?? base.getFullYear();
	const month = parts.month ?? base.getMonth();
	const maxDay = daysInMonth(year, month);
	const day = Math.min(parts.day ?? base.getDate(), maxDay);
	return new Date(year, month, day, base.getHours(), base.getMinutes(), 0, 0);
}

function withTimeParts(
	base: Date,
	parts: { hour?: number; minute?: number },
): Date {
	return new Date(
		base.getFullYear(),
		base.getMonth(),
		base.getDate(),
		parts.hour ?? base.getHours(),
		parts.minute ?? base.getMinutes(),
		0,
		0,
	);
}

/** Cross-platform date/time field. Web uses Pickers (native DateTimePicker is unsupported). */
export function AppDateTimePicker({
	mode,
	value,
	label,
	displayValue,
	onChange,
	style,
}: Props) {
	const [open, setOpen] = useState(false);
	const years = useMemo(() => {
		const current = new Date().getFullYear();
		const list: number[] = [];
		for (let y = current - 5; y <= current + 15; y += 1) list.push(y);
		return list;
	}, []);
	const hours = useMemo(
		() => Array.from({ length: 24 }, (_, i) => i),
		[],
	);
	const minutes = useMemo(
		() => Array.from({ length: 60 }, (_, i) => i),
		[],
	);
	const days = useMemo(() => {
		const count = daysInMonth(value.getFullYear(), value.getMonth());
		return Array.from({ length: count }, (_, i) => i + 1);
	}, [value]);

	const field = (
		<TouchableOpacity
			style={[styles.field, style]}
			onPress={() => setOpen((prev) => !prev)}
			activeOpacity={0.8}
		>
			<Text style={styles.label}>{label}</Text>
			<Text style={styles.value}>{displayValue}</Text>
		</TouchableOpacity>
	);

	if (Platform.OS === "web") {
		return (
			<>
				{field}
				{open && (
					<View style={styles.pickerWrap}>
						{mode === "date" ? (
							<View style={styles.webRow}>
								<View style={styles.webCol}>
									<Text style={styles.webColLabel}>Day</Text>
									<Picker
										selectedValue={value.getDate()}
										onValueChange={(v) =>
											onChange(
												withDateParts(value, {
													day: Number(v),
												}),
											)
										}
										style={styles.webPicker}
									>
										{days.map((d) => (
											<Picker.Item
												key={d}
												label={String(d)}
												value={d}
											/>
										))}
									</Picker>
								</View>
								<View style={styles.webCol}>
									<Text style={styles.webColLabel}>Month</Text>
									<Picker
										selectedValue={value.getMonth()}
										onValueChange={(v) =>
											onChange(
												withDateParts(value, {
													month: Number(v),
												}),
											)
										}
										style={styles.webPicker}
									>
										{MONTH_LABELS.map((m, index) => (
											<Picker.Item
												key={m}
												label={m}
												value={index}
											/>
										))}
									</Picker>
								</View>
								<View style={[styles.webCol, styles.webColYear]}>
									<Text style={styles.webColLabel}>Year</Text>
									<Picker
										selectedValue={value.getFullYear()}
										onValueChange={(v) =>
											onChange(
												withDateParts(value, {
													year: Number(v),
												}),
											)
										}
										style={styles.webPicker}
									>
										{years.map((y) => (
											<Picker.Item
												key={y}
												label={String(y)}
												value={y}
											/>
										))}
									</Picker>
								</View>
							</View>
						) : (
							<View style={styles.webRow}>
								<View style={styles.webCol}>
									<Text style={styles.webColLabel}>Hour</Text>
									<Picker
										selectedValue={value.getHours()}
										onValueChange={(v) =>
											onChange(
												withTimeParts(value, {
													hour: Number(v),
												}),
											)
										}
										style={styles.webPicker}
									>
										{hours.map((h) => (
											<Picker.Item
												key={h}
												label={String(h).padStart(2, "0")}
												value={h}
											/>
										))}
									</Picker>
								</View>
								<View style={styles.webCol}>
									<Text style={styles.webColLabel}>
										Minute
									</Text>
									<Picker
										selectedValue={value.getMinutes()}
										onValueChange={(v) =>
											onChange(
												withTimeParts(value, {
													minute: Number(v),
												}),
											)
										}
										style={styles.webPicker}
									>
										{minutes.map((m) => (
											<Picker.Item
												key={m}
												label={String(m).padStart(2, "0")}
												value={m}
											/>
										))}
									</Picker>
								</View>
							</View>
						)}
						<TouchableOpacity
							style={styles.done}
							onPress={() => setOpen(false)}
						>
							<Text style={styles.doneText}>Done</Text>
						</TouchableOpacity>
					</View>
				)}
			</>
		);
	}

	return (
		<>
			{field}
			{open && (
				<View style={styles.pickerWrap}>
					<DateTimePicker
						value={value}
						mode={mode}
						display={Platform.OS === "ios" ? "spinner" : "default"}
						onChange={(_, selectedDate) => {
							if (Platform.OS !== "ios") {
								setOpen(false);
							}
							if (!selectedDate) return;
							onChange(selectedDate);
						}}
					/>
					{Platform.OS === "ios" && (
						<TouchableOpacity
							style={styles.done}
							onPress={() => setOpen(false)}
						>
							<Text style={styles.doneText}>Done</Text>
						</TouchableOpacity>
					)}
				</View>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	field: {
		height: 44,
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
		paddingHorizontal: 12,
		backgroundColor: colors.cardBackground,
		marginBottom: 8,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.textSecondary,
	},
	value: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.textPrimary,
	},
	pickerWrap: {
		marginTop: -4,
		marginBottom: 8,
		borderRadius: 12,
		overflow: "hidden",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: colors.border,
		backgroundColor: colors.cardBackground,
	},
	webRow: {
		flexDirection: "row",
		gap: 8,
		paddingHorizontal: 10,
		paddingTop: 10,
		paddingBottom: 4,
	},
	webCol: {
		flex: 1,
		minWidth: 0,
	},
	webColYear: {
		flex: 1.2,
	},
	webColLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: colors.textSecondary,
		marginBottom: 4,
	},
	webPicker: {
		width: "100%",
		height: 40,
		color: colors.textPrimary,
		backgroundColor: colors.background,
		borderRadius: 8,
	},
	done: {
		paddingVertical: 10,
		alignItems: "center",
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: colors.border,
	},
	doneText: {
		color: colors.primary,
		fontWeight: "700",
	},
});

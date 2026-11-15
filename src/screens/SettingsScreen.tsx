import React from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Linking,
	Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { textStyles } from "../theme/typography";
import { spacing } from "../theme/spacing";
import { Card } from "../components/ui/Card";
import { LEGAL } from "../constants/legal";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

async function openUrl(url: string | null, missingLabel: string) {
	if (!url) {
		Alert.alert(
			"Coming soon",
			`${missingLabel} will be available here once the page is live.`,
		);
		return;
	}
	const supported = await Linking.canOpenURL(url);
	if (supported) {
		await Linking.openURL(url);
	} else {
		Alert.alert("Unable to open link", url);
	}
}

export default function SettingsScreen({ navigation }: Props) {
	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.content}
		>
			<View style={styles.headerRow}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => navigation.goBack()}
					hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
					accessibilityRole="button"
					accessibilityLabel="Go back"
				>
					<Ionicons
						name="chevron-back"
						size={28}
						color={colors.textPrimary}
					/>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Settings</Text>
				<View style={styles.headerSpacer} />
			</View>

			<Text style={styles.sectionLabel}>About</Text>
			<Card>
				<Text style={styles.appName}>{LEGAL.appName}</Text>
				<Text style={styles.body}>{LEGAL.disclaimer}</Text>
			</Card>

			<Text style={styles.sectionLabel}>Legal & support</Text>
			<Card>
				<TouchableOpacity
					style={styles.row}
					onPress={() =>
						openUrl(LEGAL.privacyPolicyUrl, "Privacy policy")
					}
					accessibilityRole="button"
					accessibilityLabel="Privacy policy"
				>
					<Ionicons
						name="shield-checkmark-outline"
						size={22}
						color={colors.primary}
					/>
					<Text style={styles.rowLabel}>Privacy policy</Text>
					<Ionicons
						name="chevron-forward"
						size={18}
						color={colors.textSecondary}
					/>
				</TouchableOpacity>
				<View style={styles.divider} />
				<TouchableOpacity
					style={styles.row}
					onPress={() => openUrl(LEGAL.supportUrl, "Support")}
					accessibilityRole="button"
					accessibilityLabel="Support"
				>
					<Ionicons
						name="help-circle-outline"
						size={22}
						color={colors.primary}
					/>
					<Text style={styles.rowLabel}>Support</Text>
					<Ionicons
						name="chevron-forward"
						size={18}
						color={colors.textSecondary}
					/>
				</TouchableOpacity>
				<View style={styles.divider} />
				<TouchableOpacity
					style={styles.row}
					onPress={() =>
						Linking.openURL(`mailto:${LEGAL.supportEmail}`)
					}
					accessibilityRole="button"
					accessibilityLabel="Email support"
				>
					<Ionicons
						name="mail-outline"
						size={22}
						color={colors.primary}
					/>
					<Text style={styles.rowLabel}>{LEGAL.supportEmail}</Text>
					<Ionicons
						name="chevron-forward"
						size={18}
						color={colors.textSecondary}
					/>
				</TouchableOpacity>
			</Card>

			<Text style={styles.footerNote}>
				Data stays on this device. No account required.
			</Text>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	content: {
		paddingHorizontal: 16,
		paddingTop: 48,
		paddingBottom: 40,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.lg,
	},
	backButton: {
		width: 40,
		alignItems: "flex-start",
	},
	headerTitle: {
		...textStyles.screenTitle,
		flex: 1,
		textAlign: "center",
	},
	headerSpacer: {
		width: 40,
	},
	sectionLabel: {
		...textStyles.label,
		marginBottom: spacing.sm,
		marginTop: spacing.sm,
		color: colors.textSecondary,
		textTransform: "uppercase",
		letterSpacing: 0.6,
		fontSize: 12,
	},
	appName: {
		...textStyles.cardTitle,
		marginBottom: spacing.sm,
	},
	body: {
		...textStyles.body,
		fontSize: 15,
		lineHeight: 22,
		color: colors.textSecondary,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		gap: 12,
	},
	rowLabel: {
		...textStyles.body,
		flex: 1,
		fontSize: 16,
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: colors.border,
	},
	footerNote: {
		...textStyles.subtitle,
		fontSize: 13,
		marginTop: spacing.lg,
		textAlign: "center",
	},
});

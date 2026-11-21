import React from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Linking,
} from "react-native";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { textStyles } from "../theme/typography";
import { spacing } from "../theme/spacing";
import { Card } from "../components/ui/Card";
import { LEGAL } from "../constants/legal";
import { showAlert } from "../utils/showAlert";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

function mailTo(subject: string, body: string) {
	const query = [
		`subject=${encodeURIComponent(subject)}`,
		`body=${encodeURIComponent(body)}`,
	].join("&");
	return `mailto:${LEGAL.supportEmail}?${query}`;
}

function versionLabel() {
	const version = Constants.expoConfig?.version ?? "1.0.0";
	const build = Constants.platform?.ios?.buildNumber;
	return build ? `Version ${version} (${build})` : `Version ${version}`;
}

async function openExternal(url: string) {
	try {
		await Linking.openURL(url);
	} catch {
		showAlert("Unable to open link", url);
	}
}

async function openMail(subject: string, body: string) {
	const url = mailTo(subject, body);
	try {
		await Linking.openURL(url);
	} catch {
		showAlert(
			"Unable to open email",
			`Please email ${LEGAL.supportEmail} instead.`,
		);
	}
}

export default function SettingsScreen({ navigation }: Props) {
	const insets = useSafeAreaInsets();

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={[
				styles.content,
				{ paddingTop: insets.top + 16 },
			]}
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
				<Text style={styles.body}>
					A personal health journal for dogs — keep notes and history
					in one place.
				</Text>
				<Text style={styles.version}>{versionLabel()}</Text>
			</Card>

			<Text style={styles.sectionLabel}>Disclaimer</Text>
			<Card>
				<Text style={styles.disclaimerTitle}>
					Not veterinary advice
				</Text>
				<Text style={styles.body}>{LEGAL.disclaimer}</Text>
			</Card>

			<Text style={styles.sectionLabel}>Legal</Text>
			<Card>
				<TouchableOpacity
					style={styles.row}
					onPress={() => navigation.navigate("PrivacyPolicy")}
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
				{LEGAL.privacyPolicyUrl ? (
					<>
						<View style={styles.divider} />
						<TouchableOpacity
							style={styles.row}
							onPress={() => openExternal(LEGAL.privacyPolicyUrl as string)}
							accessibilityRole="link"
							accessibilityLabel="Open privacy policy on the web"
						>
							<Ionicons
								name="open-outline"
								size={22}
								color={colors.primary}
							/>
							<Text style={styles.rowLabel}>
								Privacy policy on the web
							</Text>
							<Ionicons
								name="chevron-forward"
								size={18}
								color={colors.textSecondary}
							/>
						</TouchableOpacity>
					</>
				) : null}
				{LEGAL.supportUrl ? (
					<>
						<View style={styles.divider} />
						<TouchableOpacity
							style={styles.row}
							onPress={() => openExternal(LEGAL.supportUrl as string)}
							accessibilityRole="link"
							accessibilityLabel="Open support page"
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
					</>
				) : null}
			</Card>

			<Text style={styles.sectionLabel}>Feedback</Text>
			<Card>
				<TouchableOpacity
					style={styles.row}
					onPress={() =>
						openMail(
							"PawDex feedback",
							"Hi PawDex team,\n\nHere’s my feedback:\n\n",
						)
					}
					accessibilityRole="button"
					accessibilityLabel="Send feedback"
				>
					<Ionicons
						name="chatbubble-ellipses-outline"
						size={22}
						color={colors.primary}
					/>
					<Text style={styles.rowLabel}>Send feedback</Text>
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
						openMail(
							"PawDex bug report",
							"Hi PawDex team,\n\nI found a bug / issue:\n\nWhat happened:\n\nWhat I expected:\n\nDevice / browser:\n\n",
						)
					}
					accessibilityRole="button"
					accessibilityLabel="Report a bug or issue"
				>
					<Ionicons
						name="bug-outline"
						size={22}
						color={colors.primary}
					/>
					<Text style={styles.rowLabel}>Report a bug or issue</Text>
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
	disclaimerTitle: {
		...textStyles.cardTitle,
		fontSize: 16,
		marginBottom: spacing.sm,
	},
	body: {
		...textStyles.body,
		fontSize: 15,
		lineHeight: 22,
		color: colors.textSecondary,
	},
	version: {
		...textStyles.subtitle,
		fontSize: 13,
		marginTop: spacing.sm,
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

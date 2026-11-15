import React from "react";
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors } from "../theme/colors";
import { textStyles } from "../theme/typography";
import { spacing } from "../theme/spacing";
import { Card } from "../components/ui/Card";
import { LEGAL } from "../constants/legal";

type Props = NativeStackScreenProps<RootStackParamList, "PrivacyPolicy">;

export default function PrivacyPolicyScreen({ navigation }: Props) {
	const insets = useSafeAreaInsets();

	return (
		<ScrollView
			style={styles.container}
			contentContainerStyle={[
				styles.content,
				{
					paddingTop: insets.top + 16,
					paddingBottom: Math.max(insets.bottom, 40),
				},
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
				<Text style={styles.headerTitle}>Privacy policy</Text>
				<View style={styles.headerSpacer} />
			</View>

			<Text style={styles.updated}>
				Last updated: {LEGAL.privacyPolicyLastUpdated}
			</Text>

			{LEGAL.privacyPolicySections.map((section) => (
				<Card key={section.title} style={styles.sectionCard}>
					<Text style={styles.sectionTitle}>{section.title}</Text>
					<Text style={styles.body}>{section.body}</Text>
				</Card>
			))}
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
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: spacing.sm,
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
	updated: {
		...textStyles.subtitle,
		fontSize: 13,
		marginBottom: spacing.md,
		textAlign: "center",
	},
	sectionCard: {
		marginBottom: spacing.sm,
	},
	sectionTitle: {
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
});

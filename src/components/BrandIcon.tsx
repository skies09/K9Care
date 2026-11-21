import React from "react";
import { Image, ImageStyle, StyleProp } from "react-native";

export type BrandIconName =
	| "logo"
	| "health"
	| "medication"
	| "vet"
	| "activity"
	| "symptoms"
	| "weight"
	| "graph"
	| "dog"
	| "seizures"
	| "allergies"
	| "arthritis"
	| "digestion"
	| "diabetes"
	| "kidney"
	| "anxiety"
	| "heart"
	| "paw";

const SOURCES: Record<BrandIconName, number> = {
	logo: require("../../assets/icons/branded/logo.png"),
	health: require("../../assets/icons/branded/health-v3.png"),
	medication: require("../../assets/icons/branded/medication.png"),
	vet: require("../../assets/icons/branded/vet.png"),
	activity: require("../../assets/icons/branded/activity.png"),
	symptoms: require("../../assets/icons/branded/symptoms.png"),
	weight: require("../../assets/icons/branded/weight.png"),
	graph: require("../../assets/icons/branded/graph.png"),
	dog: require("../../assets/icons/branded/dog.png"),
	seizures: require("../../assets/icons/branded/seizures.png"),
	allergies: require("../../assets/icons/branded/allergies.png"),
	arthritis: require("../../assets/icons/branded/arthritis-standing.png"),
	digestion: require("../../assets/icons/branded/digestion.png"),
	diabetes: require("../../assets/icons/branded/diabetes.png"),
	kidney: require("../../assets/icons/branded/kidney.png"),
	anxiety: require("../../assets/icons/branded/anxiety.png"),
	heart: require("../../assets/icons/branded/heart.png"),
	paw: require("../../assets/icons/branded/paw-simple.png"),
};

type Props = {
	name: BrandIconName;
	size?: number;
	style?: StyleProp<ImageStyle>;
	opacity?: number;
};

/** Custom PawDex illustrated icons (brand teal palette, transparent PNG). */
export function BrandIcon({ name, size = 28, style, opacity = 1 }: Props) {
	return (
		<Image
			source={SOURCES[name]}
			style={[
				{
					width: size,
					height: size,
					opacity,
					backgroundColor: "transparent",
				},
				style,
			]}
			resizeMode="contain"
			accessibilityIgnoresInvertColors
		/>
	);
}

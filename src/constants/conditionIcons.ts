import type { BrandIconName } from "../components/BrandIcon";
import type { ConditionTag } from "../types";

/** Brand icons for each health area. */
export const CONDITION_ICONS: Record<ConditionTag, BrandIconName> = {
	heart: "heart",
	epilepsy: "seizures",
	arthritis: "arthritis",
	allergy: "allergies",
	digestive: "digestion",
	diabetes: "diabetes",
	kidney: "kidney",
	anxiety: "anxiety",
};

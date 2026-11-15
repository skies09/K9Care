export type WeightUnit = "kg" | "lb";

const LB_PER_KG = 2.2046226218;

export function normalizeWeightUnit(unit: unknown): WeightUnit {
	return unit === "lb" ? "lb" : "kg";
}

/** Convert a user-entered value in `unit` to kilograms for storage. */
export function toKg(value: number, unit: WeightUnit): number {
	return unit === "kg" ? value : value / LB_PER_KG;
}

/** Convert a stored kilogram value to the user's preferred unit. */
export function fromKg(kg: number, unit: WeightUnit): number {
	return unit === "kg" ? kg : kg * LB_PER_KG;
}

export function formatWeightValue(
	kg: number,
	unit: WeightUnit,
	digits = 1,
): string {
	return fromKg(kg, unit).toFixed(digits);
}

export function formatWeight(
	kg: number,
	unit: WeightUnit,
	digits = 1,
): string {
	return `${formatWeightValue(kg, unit, digits)} ${unit}`;
}

const MONTH_NAMES = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
];

export type DobParts = {
	year: number;
	month: number; // 0 = not set
	day: number; // 0 = not set
};

export function buildDobString(parts: DobParts): string {
	const { year, month, day } = parts;
	if (month <= 0) return String(year);
	if (day <= 0) {
		return `${year}-${String(month).padStart(2, '0')}`;
	}
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseDobParts(dob: string): DobParts | null {
	const s = dob.trim();
	if (!s) return null;

	const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
	if (ymd) {
		return {
			year: parseInt(ymd[1], 10),
			month: parseInt(ymd[2], 10),
			day: parseInt(ymd[3], 10),
		};
	}

	const ym = /^(\d{4})-(\d{2})$/.exec(s);
	if (ym) {
		return {
			year: parseInt(ym[1], 10),
			month: parseInt(ym[2], 10),
			day: 0,
		};
	}

	const yOnly = /^(\d{4})$/.exec(s);
	if (yOnly) {
		return { year: parseInt(yOnly[1], 10), month: 0, day: 0 };
	}

	return null;
}

export function formatDobDisplay(dob: string): string {
	const parts = parseDobParts(dob);
	if (!parts) return dob.trim() || 'Select';

	return formatDobPartsDisplay(parts);
}

export function formatDobPartsDisplay(parts: DobParts): string {
	const { year, month, day } = parts;
	if (month <= 0) return String(year);
	if (day <= 0) {
		return `${MONTH_NAMES[month - 1]} ${year}`;
	}
	return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

export function getYearOptions(): number[] {
	const current = new Date().getFullYear();
	const years: number[] = [];
	for (let y = current; y >= current - 40; y--) {
		years.push(y);
	}
	return years;
}

export function getDayOptions(month: number, year: number): number[] {
	if (month <= 0) return [];
	const daysInMonth = new Date(year, month, 0).getDate();
	return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}

/** HTML helpers for vet report PDFs (tables + simple SVG charts). */

import { fromKg } from "./weightUnits";

const TEAL = "#1F6F78";
const SAGE = "#9BC4B5";
const TEXT = "#2E3A4B";
const MUTED = "#5A6573";
const BORDER = "#D4E4DE";
const ROW_ALT = "#F7F3EF";

export function formatReportDate(iso: string) {
	return new Date(iso).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function formatReportDateTime(iso: string) {
	return new Date(iso).toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export type ChartPoint = {
	at: string; // ISO date
	value: number;
	label?: string;
};

export type TableColumn = {
	header: string;
	align?: "left" | "right" | "center";
};

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function stats(values: number[]) {
	if (!values.length) return null;
	const min = Math.min(...values);
	const max = Math.max(...values);
	const avg = values.reduce((a, b) => a + b, 0) / values.length;
	const latest = values[values.length - 1];
	return { min, max, avg, latest, count: values.length };
}

function formatNum(n: number, digits = 1) {
	return Number.isInteger(n) ? String(n) : n.toFixed(digits);
}

/** Chronological SVG line chart (oldest → newest). */
export function buildLineChartSvg(
	points: ChartPoint[],
	options: {
		yLabel: string;
		width?: number;
		height?: number;
	},
): string {
	if (points.length < 2) return "";

	const width = options.width ?? 520;
	const height = options.height ?? 180;
	const padL = 44;
	const padR = 16;
	const padT = 16;
	const padB = 36;
	const plotW = width - padL - padR;
	const plotH = height - padT - padB;

	const values = points.map((p) => p.value);
	let minV = Math.min(...values);
	let maxV = Math.max(...values);
	if (minV === maxV) {
		minV -= 1;
		maxV += 1;
	}
	const range = maxV - minV;

	const coords = points.map((p, i) => {
		const x = padL + (i / (points.length - 1)) * plotW;
		const y = padT + (1 - (p.value - minV) / range) * plotH;
		return { x, y, p };
	});

	const polyline = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
	const areaPath = [
		`M ${coords[0].x.toFixed(1)} ${(padT + plotH).toFixed(1)}`,
		...coords.map((c) => `L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`),
		`L ${coords[coords.length - 1].x.toFixed(1)} ${(padT + plotH).toFixed(1)}`,
		"Z",
	].join(" ");

	const yTicks = [0, 0.5, 1].map((t) => {
		const v = minV + range * (1 - t);
		const y = padT + t * plotH;
		return { v, y };
	});

	const firstLabel = formatReportDate(points[0].at);
	const lastLabel = formatReportDate(points[points.length - 1].at);

	const dots = coords
		.map(
			(c) =>
				`<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3.5" fill="${TEAL}" />`,
		)
		.join("");

	return `
<figure class="chart-wrap">
  <figcaption class="chart-caption">${escapeHtml(options.yLabel)} over time</figcaption>
  <svg viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${width}px;height:auto;display:block;">
    <rect x="0" y="0" width="${width}" height="${height}" fill="#FFFFFF" rx="8" />
    ${yTicks
			.map(
				(t) => `
      <line x1="${padL}" y1="${t.y.toFixed(1)}" x2="${width - padR}" y2="${t.y.toFixed(1)}" stroke="${BORDER}" stroke-width="1" />
      <text x="${padL - 8}" y="${(t.y + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="${MUTED}">${formatNum(t.v)}</text>
    `,
			)
			.join("")}
    <path d="${areaPath}" fill="${SAGE}" opacity="0.35" />
    <polyline points="${polyline}" fill="none" stroke="${TEAL}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
    ${dots}
    <text x="${padL}" y="${height - 10}" font-size="10" fill="${MUTED}">${escapeHtml(firstLabel)}</text>
    <text x="${width - padR}" y="${height - 10}" text-anchor="end" font-size="10" fill="${MUTED}">${escapeHtml(lastLabel)}</text>
  </svg>
</figure>`;
}

export function buildDataTable(
	columns: TableColumn[],
	rows: string[][],
): string {
	if (!rows.length) return "";
	const head = columns
		.map(
			(c) =>
				`<th style="text-align:${c.align ?? "left"};">${escapeHtml(c.header)}</th>`,
		)
		.join("");
	const body = rows
		.map((row, i) => {
			const bg = i % 2 === 1 ? ROW_ALT : "#FFFFFF";
			const cells = row
				.map((cell, ci) => {
					const align = columns[ci]?.align ?? "left";
					return `<td style="text-align:${align};background:${bg};">${escapeHtml(
						cell,
					)}</td>`;
				})
				.join("");
			return `<tr>${cells}</tr>`;
		})
		.join("");
	return `<table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function buildSummaryChips(
	items: { label: string; value: string }[],
): string {
	if (!items.length) return "";
	return `<div class="summary">${items
		.map(
			(i) =>
				`<div class="chip"><span class="chip-label">${escapeHtml(
					i.label,
				)}</span><span class="chip-value">${escapeHtml(i.value)}</span></div>`,
		)
		.join("")}</div>`;
}

function summaryFromValues(
	values: number[],
	unit: string,
	digits = 1,
): { label: string; value: string }[] {
	const s = stats(values);
	if (!s) return [];
	const u = unit ? ` ${unit}` : "";
	return [
		{ label: "Readings", value: String(s.count) },
		{ label: "Latest", value: `${formatNum(s.latest, digits)}${u}` },
		{ label: "Average", value: `${formatNum(s.avg, digits)}${u}` },
		{ label: "Range", value: `${formatNum(s.min, digits)}–${formatNum(s.max, digits)}${u}` },
	];
}

type SectionBlock = {
	title: string;
	ownerNote: string;
	vetNote?: string;
	summary?: { label: string; value: string }[];
	chartSvg?: string;
	tableHtml: string;
	emptyMessage?: string;
};

export function renderSectionBlock(block: SectionBlock): string {
	if (!block.tableHtml) {
		return `
<section class="section">
  <h2>${escapeHtml(block.title)}</h2>
  <p class="empty">${escapeHtml(block.emptyMessage ?? "No entries recorded for this section yet.")}</p>
</section>`;
	}
	return `
<section class="section">
  <h2>${escapeHtml(block.title)}</h2>
  <p class="owner-note">${escapeHtml(block.ownerNote)}</p>
  ${block.vetNote ? `<p class="vet-note"><strong>For your vet:</strong> ${escapeHtml(block.vetNote)}</p>` : ""}
  ${block.summary ? buildSummaryChips(block.summary) : ""}
  ${block.chartSvg ?? ""}
  <h3 class="table-heading">Detailed readings</h3>
  ${block.tableHtml}
</section>`;
}

const DOCUMENT_CSS = `
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    padding: 28px;
    color: ${TEXT};
    font-size: 13px;
    line-height: 1.45;
  }
  h1 { font-size: 22px; color: ${TEAL}; margin: 0 0 6px; }
  h2 { font-size: 17px; color: ${TEAL}; margin: 0 0 8px; border-bottom: 2px solid ${SAGE}; padding-bottom: 6px; }
  h3.table-heading { font-size: 13px; color: ${MUTED}; margin: 16px 0 8px; font-weight: 600; }
  .dog-name { font-size: 28px; font-weight: 700; color: ${TEAL}; margin: 0 0 6px; line-height: 1.2; }
  .meta { color: ${MUTED}; font-size: 12px; margin: 0 0 8px; }
  .intro {
    background: #F4FAF8;
    border: 1px solid ${BORDER};
    border-radius: 10px;
    padding: 12px 14px;
    margin: 0 0 22px;
    color: ${MUTED};
    font-size: 12px;
  }
  .section { margin-bottom: 28px; page-break-inside: avoid; }
  .owner-note { margin: 0 0 6px; color: ${TEXT}; }
  .vet-note { margin: 0 0 12px; color: ${MUTED}; font-size: 12px; }
  .empty { color: ${MUTED}; font-style: italic; }
  .summary { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 12px; }
  .chip {
    background: #FFFFFF;
    border: 1px solid ${BORDER};
    border-radius: 8px;
    padding: 8px 10px;
    min-width: 88px;
  }
  .chip-label { display: block; font-size: 10px; color: ${MUTED}; text-transform: uppercase; letter-spacing: 0.4px; }
  .chip-value { display: block; font-size: 14px; font-weight: 700; color: ${TEAL}; margin-top: 2px; }
  .chart-wrap { margin: 0 0 8px; }
  .chart-caption { font-size: 11px; color: ${MUTED}; margin: 0 0 6px; }
  table.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  table.data-table th {
    text-align: left;
    padding: 8px 8px;
    border-bottom: 2px solid ${TEAL};
    color: ${TEAL};
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  table.data-table td {
    padding: 7px 8px;
    border-bottom: 1px solid ${BORDER};
    vertical-align: top;
  }
  .footer {
    margin-top: 28px;
    padding-top: 12px;
    border-top: 1px solid ${BORDER};
    color: ${MUTED};
    font-size: 11px;
  }
`;

function wrapDocument(options: {
	dogName: string;
	subtitle: string;
	bodyHtml: string;
}): string {
	const generated = formatReportDate(new Date().toISOString());
	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>K9Care – Health summary for ${escapeHtml(options.dogName)}</title>
  <style>${DOCUMENT_CSS}</style>
</head>
<body>
  <h1>K9Care health summary</h1>
  <p class="dog-name">${escapeHtml(options.dogName)}</p>
  <p class="meta">${escapeHtml(options.subtitle)} · Prepared ${escapeHtml(generated)}</p>
  <div class="intro">
    <strong>For you:</strong> a clear record of what you’ve tracked.<br/>
    <strong>For your vet:</strong> dates, values, and trends to review at appointments.
    This is owner-recorded information — not a diagnosis.
  </div>
  ${options.bodyHtml}
  <p class="footer">Generated with K9Care. Owner-recorded journal data for discussion with your veterinary team.</p>
</body>
</html>`;
}

// —— Section builders ——

function chronological<T extends { at: string }>(items: T[]): T[] {
	return [...items].sort(
		(a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
	);
}

export type VetReportData = {
	weightLogs: Array<{ weightKg: number; createdAt: string; note?: string | null }>;
	breathingChecks: Array<{ breathsPerMinute: number; createdAt: string }>;
	seizureEvents: Array<{
		startTime: string;
		durationSeconds: number;
	}>;
	medications: Array<{
		name: string;
		dose: number;
		unit: string;
		startDate: string;
		notes?: string | null;
	}>;
	allergyLogs: Array<{
		createdAt: string;
		itchSeverity?: number;
		notes?: string | null;
	}>;
	mobilityLogs: Array<{
		createdAt: string;
		overallPain?: number;
		notes?: string | null;
	}>;
	stoolLogs: Array<{
		createdAt: string;
		stoolScore?: number;
		notes?: string | null;
	}>;
	insulinLogs: Array<{ doseUnits: number; givenAt: string }>;
	glucoseReadings: Array<{ value: number; takenAt: string }>;
	kidneyLogs: Array<{
		createdAt: string;
		waterIntakeMl?: number;
		urinationCount?: number;
	}>;
	anxietyLogs: Array<{
		trigger: string;
		severity?: number;
		createdAt: string;
	}>;
};

export type VetSectionKey =
	| "weight"
	| "breathing"
	| "seizures"
	| "medications"
	| "allergy"
	| "mobility"
	| "stool"
	| "insulin"
	| "glucose"
	| "kidney"
	| "anxiety";

export function buildWeightSection(
	data: VetReportData,
	weightUnit: "kg" | "lb" = "kg",
): string {
	const unit = weightUnit === "lb" ? "lb" : "kg";
	const toDisplay = (kg: number) =>
		unit === "kg" ? kg : fromKg(kg, "lb");
	const series = chronological(
		data.weightLogs.map((r) => ({
			at: r.createdAt,
			value: toDisplay(r.weightKg),
			note: r.note,
		})),
	).slice(-40);
	const values = series.map((s) => s.value);
	const newestFirst = [...series].reverse();
	return renderSectionBlock({
		title: "Weight",
		ownerNote: `Your dog’s recorded weight over time (${unit}).`,
		vetNote: `Trend chart (oldest → newest) plus a dated table in ${unit}.`,
		summary: summaryFromValues(values, unit),
		chartSvg: buildLineChartSvg(
			series.map((s) => ({ at: s.at, value: s.value })),
			{ yLabel: `Weight (${unit})` },
		),
		tableHtml: buildDataTable(
			[
				{ header: "Date" },
				{ header: `Weight (${unit})`, align: "right" },
				{ header: "Note" },
			],
			newestFirst.map((r) => [
				formatReportDate(r.at),
				formatNum(r.value),
				r.note?.trim() || "—",
			]),
		),
	});
}

export function buildBreathingSection(data: VetReportData): string {
	const series = chronological(
		data.breathingChecks.map((r) => ({
			at: r.createdAt,
			value: r.breathsPerMinute,
		})),
	).slice(-40);
	const values = series.map((s) => s.value);
	const newestFirst = [...series].reverse();
	return renderSectionBlock({
		title: "Resting breathing rate",
		ownerNote: "Breaths per minute counted while your dog was resting.",
		vetNote: "Resting respiratory rate (breaths/min). Higher rates may warrant clinical review.",
		summary: summaryFromValues(values, "/min", 0),
		chartSvg: buildLineChartSvg(series, { yLabel: "Breaths per minute" }),
		tableHtml: buildDataTable(
			[
				{ header: "Date & time" },
				{ header: "Breaths / min", align: "right" },
			],
			newestFirst.map((r) => [
				formatReportDateTime(r.at),
				String(r.value),
			]),
		),
	});
}

export function buildSeizuresSection(data: VetReportData): string {
	const series = chronological(
		data.seizureEvents.map((r) => ({
			at: r.startTime,
			value: r.durationSeconds,
		})),
	).slice(-40);
	const values = series.map((s) => s.value);
	const newestFirst = [...series].reverse();
	return renderSectionBlock({
		title: "Seizure events",
		ownerNote: "Times and lengths of seizure episodes you recorded.",
		vetNote: "Onset time and duration in seconds for each logged event.",
		summary: summaryFromValues(values, "sec", 0),
		chartSvg: buildLineChartSvg(series, { yLabel: "Duration (seconds)" }),
		tableHtml: buildDataTable(
			[
				{ header: "Started" },
				{ header: "Duration (seconds)", align: "right" },
			],
			newestFirst.map((r) => [
				formatReportDateTime(r.at),
				String(r.value),
			]),
		),
	});
}

export function buildMedicationsSection(data: VetReportData): string {
	const rows = data.medications;
	return renderSectionBlock({
		title: "Medications",
		ownerNote: "Medicines you’ve logged for your dog.",
		vetNote:
			"Name, dose, unit, start date, and owner notes (e.g. planned dose changes) as recorded.",
		summary: [{ label: "Medications", value: String(rows.length) }],
		tableHtml: buildDataTable(
			[
				{ header: "Medication" },
				{ header: "Dose" },
				{ header: "Started" },
				{ header: "Notes" },
			],
			rows.map((r) => [
				r.name,
				`${formatNum(r.dose)} ${r.unit}`,
				formatReportDate(r.startDate),
				r.notes?.trim() || "—",
			]),
		),
	});
}

export function buildAllergySection(data: VetReportData): string {
	const series = chronological(
		data.allergyLogs
			.filter((r) => r.itchSeverity != null)
			.map((r) => ({
				at: r.createdAt,
				value: r.itchSeverity as number,
				note: r.notes,
			})),
	).slice(-40);
	const all = [...data.allergyLogs].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
	return renderSectionBlock({
		title: "Allergies & skin",
		ownerNote: "Itch and skin notes you’ve kept (severity out of 5).",
		vetNote: "Owner itch severity scale 1–5, with optional notes.",
		summary: summaryFromValues(
			series.map((s) => s.value),
			"/5",
			0,
		),
		chartSvg: buildLineChartSvg(
			series.map((s) => ({ at: s.at, value: s.value })),
			{ yLabel: "Itch severity (1–5)" },
		),
		tableHtml: buildDataTable(
			[
				{ header: "Date" },
				{ header: "Itch (1–5)", align: "right" },
				{ header: "Notes" },
			],
			all.slice(0, 40).map((r) => [
				formatReportDate(r.createdAt),
				r.itchSeverity != null ? String(r.itchSeverity) : "—",
				r.notes?.trim() || "—",
			]),
		),
	});
}

export function buildMobilitySection(data: VetReportData): string {
	const series = chronological(
		data.mobilityLogs
			.filter((r) => r.overallPain != null)
			.map((r) => ({
				at: r.createdAt,
				value: r.overallPain as number,
				note: r.notes,
			})),
	).slice(-40);
	const all = [...data.mobilityLogs].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
	return renderSectionBlock({
		title: "Mobility & arthritis",
		ownerNote: "Pain or stiffness you’ve noticed (out of 5).",
		vetNote: "Owner overall pain score 1–5 over time.",
		summary: summaryFromValues(
			series.map((s) => s.value),
			"/5",
			0,
		),
		chartSvg: buildLineChartSvg(
			series.map((s) => ({ at: s.at, value: s.value })),
			{ yLabel: "Pain score (1–5)" },
		),
		tableHtml: buildDataTable(
			[
				{ header: "Date" },
				{ header: "Pain (1–5)", align: "right" },
				{ header: "Notes" },
			],
			all.slice(0, 40).map((r) => [
				formatReportDate(r.createdAt),
				r.overallPain != null ? String(r.overallPain) : "—",
				r.notes?.trim() || "—",
			]),
		),
	});
}

export function buildStoolSection(data: VetReportData): string {
	const series = chronological(
		data.stoolLogs
			.filter((r) => r.stoolScore != null)
			.map((r) => ({
				at: r.createdAt,
				value: r.stoolScore as number,
				note: r.notes,
			})),
	).slice(-40);
	const all = [...data.stoolLogs].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
	return renderSectionBlock({
		title: "Digestion",
		ownerNote: "Stool scores you’ve recorded (scale used in the app).",
		vetNote: "Owner stool score over time (app scale).",
		summary: summaryFromValues(
			series.map((s) => s.value),
			"",
			0,
		),
		chartSvg: buildLineChartSvg(
			series.map((s) => ({ at: s.at, value: s.value })),
			{ yLabel: "Stool score" },
		),
		tableHtml: buildDataTable(
			[
				{ header: "Date" },
				{ header: "Stool score", align: "right" },
				{ header: "Notes" },
			],
			all.slice(0, 40).map((r) => [
				formatReportDate(r.createdAt),
				r.stoolScore != null ? String(r.stoolScore) : "—",
				r.notes?.trim() || "—",
			]),
		),
	});
}

export function buildInsulinSection(data: VetReportData): string {
	const series = chronological(
		data.insulinLogs.map((r) => ({
			at: r.givenAt,
			value: r.doseUnits,
		})),
	).slice(-40);
	const newestFirst = [...series].reverse();
	return renderSectionBlock({
		title: "Insulin doses",
		ownerNote: "Insulin units you’ve logged.",
		vetNote: "Dose (units) and time given.",
		summary: summaryFromValues(
			series.map((s) => s.value),
			"units",
		),
		chartSvg: buildLineChartSvg(series, { yLabel: "Insulin (units)" }),
		tableHtml: buildDataTable(
			[
				{ header: "Date & time" },
				{ header: "Units", align: "right" },
			],
			newestFirst.map((r) => [
				formatReportDateTime(r.at),
				formatNum(r.value),
			]),
		),
	});
}

export function buildGlucoseSection(data: VetReportData): string {
	const series = chronological(
		data.glucoseReadings.map((r) => ({
			at: r.takenAt,
			value: r.value,
		})),
	).slice(-40);
	const newestFirst = [...series].reverse();
	return renderSectionBlock({
		title: "Glucose readings",
		ownerNote: "Blood glucose values you’ve recorded.",
		vetNote: "Owner-recorded glucose values with date and time.",
		summary: summaryFromValues(
			series.map((s) => s.value),
			"",
		),
		chartSvg: buildLineChartSvg(series, { yLabel: "Glucose" }),
		tableHtml: buildDataTable(
			[
				{ header: "Date & time" },
				{ header: "Value", align: "right" },
			],
			newestFirst.map((r) => [
				formatReportDateTime(r.at),
				formatNum(r.value),
			]),
		),
	});
}

export function buildKidneySection(data: VetReportData): string {
	const waterSeries = chronological(
		data.kidneyLogs
			.filter((r) => r.waterIntakeMl != null)
			.map((r) => ({
				at: r.createdAt,
				value: r.waterIntakeMl as number,
			})),
	).slice(-40);
	const all = [...data.kidneyLogs].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
	return renderSectionBlock({
		title: "Kidney & urinary",
		ownerNote: "Water intake and toilet trips you’ve noted.",
		vetNote: "Approximate water (ml) and urination count by date.",
		summary: summaryFromValues(
			waterSeries.map((s) => s.value),
			"ml",
			0,
		),
		chartSvg: buildLineChartSvg(waterSeries, {
			yLabel: "Water intake (ml)",
		}),
		tableHtml: buildDataTable(
			[
				{ header: "Date" },
				{ header: "Water (ml)", align: "right" },
				{ header: "Urinations", align: "right" },
			],
			all.slice(0, 40).map((r) => [
				formatReportDate(r.createdAt),
				r.waterIntakeMl != null ? String(r.waterIntakeMl) : "—",
				r.urinationCount != null ? String(r.urinationCount) : "—",
			]),
		),
	});
}

export function buildAnxietySection(data: VetReportData): string {
	const series = chronological(
		data.anxietyLogs
			.filter((r) => r.severity != null)
			.map((r) => ({
				at: r.createdAt,
				value: r.severity as number,
				trigger: r.trigger,
			})),
	).slice(-40);
	const all = [...data.anxietyLogs].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
	return renderSectionBlock({
		title: "Anxiety & behaviour",
		ownerNote: "Triggers and how strong the episode felt (out of 5).",
		vetNote: "Owner-reported trigger and severity 1–5.",
		summary: summaryFromValues(
			series.map((s) => s.value),
			"/5",
			0,
		),
		chartSvg: buildLineChartSvg(
			series.map((s) => ({ at: s.at, value: s.value })),
			{ yLabel: "Severity (1–5)" },
		),
		tableHtml: buildDataTable(
			[
				{ header: "Date" },
				{ header: "Trigger" },
				{ header: "Severity (1–5)", align: "right" },
			],
			all.slice(0, 40).map((r) => [
				formatReportDate(r.createdAt),
				r.trigger || "—",
				r.severity != null ? String(r.severity) : "—",
			]),
		),
	});
}

type SectionBuilder = (
	data: VetReportData,
	options?: { weightUnit?: "kg" | "lb" },
) => string;

const SECTION_BUILDERS: Record<VetSectionKey, SectionBuilder> = {
	weight: (data, options) => buildWeightSection(data, options?.weightUnit),
	breathing: (data) => buildBreathingSection(data),
	seizures: (data) => buildSeizuresSection(data),
	medications: (data) => buildMedicationsSection(data),
	allergy: (data) => buildAllergySection(data),
	mobility: (data) => buildMobilitySection(data),
	stool: (data) => buildStoolSection(data),
	insulin: (data) => buildInsulinSection(data),
	glucose: (data) => buildGlucoseSection(data),
	kidney: (data) => buildKidneySection(data),
	anxiety: (data) => buildAnxietySection(data),
};

export const VET_SECTION_LABELS: Record<VetSectionKey, string> = {
	weight: "Weight",
	breathing: "Resting breathing",
	seizures: "Seizures",
	medications: "Medications",
	allergy: "Allergies & skin",
	mobility: "Mobility & arthritis",
	stool: "Digestion",
	insulin: "Insulin",
	glucose: "Glucose",
	kidney: "Kidney & urinary",
	anxiety: "Anxiety & behaviour",
};

/**
 * Condition-linked report sections. Weight + medications are always allowed.
 * Heart → breathing, seizures → epilepsy, etc.
 */
export const VET_SECTION_CONDITION: Partial<
	Record<VetSectionKey, string>
> = {
	breathing: "heart",
	seizures: "epilepsy",
	allergy: "allergy",
	mobility: "arthritis",
	stool: "digestive",
	insulin: "diabetes",
	glucose: "diabetes",
	kidney: "kidney",
	anxiety: "anxiety",
};

export function isVetSectionEnabled(
	section: VetSectionKey,
	conditions: readonly string[] | null | undefined,
): boolean {
	const required = VET_SECTION_CONDITION[section];
	if (!required) return true;
	return (conditions ?? []).includes(required);
}

export function buildFullVetReportHtml(
	dogName: string,
	data: VetReportData,
	conditions?: readonly string[] | null,
	weightUnit: "kg" | "lb" = "kg",
): string {
	const options = { weightUnit };
	const body = (Object.keys(SECTION_BUILDERS) as VetSectionKey[])
		.filter((key) => isVetSectionEnabled(key, conditions))
		.map((key) => SECTION_BUILDERS[key](data, options))
		.join("\n");
	return wrapDocument({
		dogName,
		subtitle: "Full health summary",
		bodyHtml: body,
	});
}

export function buildSectionVetReportHtml(
	dogName: string,
	section: VetSectionKey,
	data: VetReportData,
	conditions?: readonly string[] | null,
	weightUnit: "kg" | "lb" = "kg",
): string {
	if (!isVetSectionEnabled(section, conditions)) {
		return wrapDocument({
			dogName,
			subtitle: VET_SECTION_LABELS[section],
			bodyHtml: `<p class="empty">This section isn’t included because it isn’t one of ${escapeHtml(dogName)}’s selected health areas.</p>`,
		});
	}
	return wrapDocument({
		dogName,
		subtitle: VET_SECTION_LABELS[section],
		bodyHtml: SECTION_BUILDERS[section](data, { weightUnit }),
	});
}

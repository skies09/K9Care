import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { showAlert } from "./showAlert";

/**
 * Native: write a PDF file and open the share sheet.
 * Web: open the report in a new tab, show it, and offer Save as PDF once
 * (user can save or cancel and keep reading the report).
 */
export async function shareVetReportPdf(
	html: string,
	dialogTitle: string,
): Promise<void> {
	if (Platform.OS === "web") {
		await openReportInBrowser(html, dialogTitle);
		return;
	}

	const result = await Print.printToFileAsync({ html, base64: false });
	if (!result?.uri) {
		throw new Error("Could not create the PDF file.");
	}

	const canShare = await Sharing.isAvailableAsync();
	if (canShare) {
		await Sharing.shareAsync(result.uri, {
			mimeType: "application/pdf",
			dialogTitle,
		});
		return;
	}

	showAlert("Saved", "PDF saved on this device.");
}

function openReportInBrowser(html: string, title: string): Promise<void> {
	return new Promise((resolve, reject) => {
		if (typeof window === "undefined" || typeof document === "undefined") {
			reject(new Error("Saving is not available in this environment."));
			return;
		}

		const reportHtml = injectBrowserChrome(html, title);
		const reportWindow = window.open("", "_blank");
		if (!reportWindow) {
			try {
				downloadHtmlFile(reportHtml, title);
				showAlert(
					"Report ready",
					"Your browser blocked the new tab, so we downloaded the report instead. Open the file to view it, then choose Save as PDF if you need a PDF.",
				);
				resolve();
			} catch (e) {
				reject(e instanceof Error ? e : new Error(String(e)));
			}
			return;
		}

		reportWindow.document.open();
		reportWindow.document.write(reportHtml);
		reportWindow.document.close();
		reportWindow.document.title = title;

		let savePrompted = false;
		const promptSaveOnce = () => {
			if (savePrompted || reportWindow.closed) return;
			savePrompted = true;
			try {
				reportWindow.focus();
				// Browser save/PDF dialog (same API as print, labeled as save in our UI)
				reportWindow.print();
			} catch {
				// Window stays open with the report visible
			}
			resolve();
		};

		// Prompt save once after the report has painted — do not also
		// bind onload + timeout (that caused two dialogs).
		const whenReady = () => {
			setTimeout(promptSaveOnce, 300);
		};

		if (reportWindow.document.readyState === "complete") {
			whenReady();
		} else {
			reportWindow.addEventListener("load", whenReady, { once: true });
			// Safety if load never fires after document.write
			setTimeout(() => {
				if (!savePrompted) whenReady();
			}, 800);
		}
	});
}

/** Toolbar so canceling save still leaves a useful on-screen report. */
function injectBrowserChrome(html: string, title: string): string {
	const toolbar = `
<style>
  .k9-save-toolbar {
    position: sticky;
    top: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    background: #F7F3EF;
    border-bottom: 1px solid #D4E4DE;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .k9-save-toolbar p {
    margin: 0;
    color: #5A6573;
    font-size: 13px;
  }
  .k9-save-toolbar button {
    background: #1F6F78;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  @media print {
    .k9-save-toolbar { display: none !important; }
  }
</style>
<div class="k9-save-toolbar">
  <p>${escapeAttr(title)} — cancel save to keep reading this page.</p>
  <button type="button" onclick="window.print()">Save as PDF</button>
</div>`;

	if (/<body[^>]*>/i.test(html)) {
		return html.replace(/<body([^>]*)>/i, `<body$1>${toolbar}`);
	}
	return `${toolbar}${html}`;
}

function escapeAttr(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function downloadHtmlFile(html: string, title: string) {
	const blob = new Blob([html], { type: "text/html;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	const safeName = title.replace(/[^\w\- ]+/g, "").trim() || "K9Care-report";
	anchor.href = url;
	anchor.download = `${safeName}.html`;
	anchor.rel = "noopener";
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

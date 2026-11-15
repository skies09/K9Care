import { Platform } from 'react-native';
import { colors } from './colors';

const STYLE_ID = 'k9care-web-focus-styles';

/** Replace the browser’s default blue focus ring with brand teal on web. */
export function installWebFocusStyles() {
	if (Platform.OS !== 'web') return;
	if (typeof document === 'undefined') return;
	if (document.getElementById(STYLE_ID)) return;

	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = `
		input:focus,
		textarea:focus,
		select:focus,
		[contenteditable="true"]:focus {
			outline: 2px solid ${colors.primary} !important;
			outline-offset: 1px;
			border-color: ${colors.primary} !important;
			box-shadow: 0 0 0 3px ${colors.primarySoft} !important;
		}
		input:focus-visible,
		textarea:focus-visible,
		select:focus-visible {
			outline: 2px solid ${colors.primary} !important;
			outline-offset: 1px;
		}
	`;
	document.head.appendChild(style);
}

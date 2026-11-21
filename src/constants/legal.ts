/** Legal / support copy used in Settings and store readiness. */
export const LEGAL = {
	/**
	 * Live HTTPS pages required by App Store Connect.
	 * Host store/privacy.html and store/support.html, then paste the URLs here.
	 * See APP_STORE_CHECKLIST.md at the repo root.
	 */
	privacyPolicyUrl: null as string | null,
	supportUrl: null as string | null,
	supportEmail: "contact@pawdex.com",
	appName: "PawDex",
	disclaimer:
		"PawDex is for tracking your dog’s health notes and history so you can share them with your vet. It is not veterinary advice, not a diagnosis, and not a substitute for professional care. If anything about your dog concerns you, seek medical advice from your vet straight away.",
	privacyPolicyLastUpdated: "21 November 2026",
	privacyPolicySections: [
		{
			title: "About this policy",
			body: "PawDex is a simple journal for your dog’s health notes. We don’t ask you to sign up, and we don’t sell your information. This page explains how we look after what you add in the app.",
		},
		{
			title: "What you might save in the app",
			body: "Things you add yourself — like your dog’s name, breed, birthday, weight, notes, and the health areas you want to track. You can also add an optional photo, keep day-to-day notes (like breathing, seizures, or meds), and set medication reminders. There’s no account to create.",
		},
		{
			title: "Your notes stay on this device",
			body: "Dogs, photos, health logs, and medication reminders are stored only on the phone or tablet where you use PawDex. There is no account and no cloud copy. We don’t use analytics, advertising, or tracking, and we don’t sell or share what you enter. A vet report or a feedback email leaves the device only when you choose to send it, through the share sheet or your email app.",
		},
		{
			title: "Photos and reminders",
			body: "We may ask to use your photos so you can add a picture of your dog, or to send reminders for medications. You’re free to say no — you can still use the journal without those.",
		},
		{
			title: "How we use what you enter",
			body: "Only to show your dogs’ history back to you in the app, and to help you share a summary with your vet if you choose.",
		},
		{
			title: "Sharing with us or your vet",
			body: "If you tap Send feedback or Report a bug, your email app opens and you decide what to write. If you share a vet report, you choose when and with whom to share it.",
		},
		{
			title: "Removing your data",
			body: "You can remove a dog anytime from the Dogs screen. That deletes their details from the app. Uninstalling PawDex deletes everything the app stored on that device. There is no separate account to close.",
		},
		{
			title: "Who the app is for",
			body: "PawDex is made for adult dog owners and carers looking after their pups — not for children.",
		},
		{
			title: "If this page changes",
			body: "As PawDex grows, we might update this policy. We’ll refresh the “Last updated” date at the top when we do.",
		},
		{
			title: "Questions?",
			body: "We’re happy to help. Use Settings → Send feedback, or email us at contact@pawdex.com.",
		},
	],
};

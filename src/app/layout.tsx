import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { NexenInspector } from '@/components/_internal/NexenInspector';

export const metadata: Metadata = {
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
	title: { default: 'DukaanSaathi', template: '%s | DukaanSaathi' },
	description: 'Cash-flow visibility and udhaar, supplier and expense tracking for kirana shops.',
	applicationName: 'DukaanSaathi',
	openGraph: {
		type: 'website',
		siteName: 'DukaanSaathi',
		title: "DukaanSaathi: know your shop's cash before it runs short",
		description: 'Udhaar, supplier bills and expenses in one place, with a 30/60/90-day cash forecast in English and Hindi.',
	},
};

// Fit phones with notches, colour the browser bar with the brand colour, and never block pinch-zoom.
export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	viewportFit: 'cover',
	themeColor: '#243a7a',
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>
				<NexenInspector />
				{children}
			</body>
		</html>
	);
}

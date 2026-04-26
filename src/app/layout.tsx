import '../styles/globals.css';

export const metadata = {
  metadataBase: new URL('https://copperquartz.family'),
  title: 'Copper & Quartz',
  description: 'Coming soon.',
  openGraph: {
    title: 'Levi & Meghan · September 29, 2026',
    description: 'Join us in Santa Barbara',
    url: 'https://copperquartz.family',
    siteName: 'Levi & Meghan',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Levi & Meghan · September 29, 2026 · Santa Barbara',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

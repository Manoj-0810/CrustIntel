import './globals.css';

export const metadata = {
  title: 'CrustIntel — AI Competitive Intelligence War Room',
  description:
    'Autonomous competitive intelligence agent powered by Crustdata + AI. Real-time signal detection, market mapping, and strategic intelligence briefs.',
  keywords: 'competitive intelligence, AI agent, Crustdata, market analysis',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Geist:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}

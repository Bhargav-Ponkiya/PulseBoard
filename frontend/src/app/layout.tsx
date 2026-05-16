import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PulseBoard — AI Observability',
  description: 'AI-powered real-time observability platform for microservices',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f8f8' },
    { media: '(prefers-color-scheme: dark)', color: '#090910' },
  ],
  colorScheme: 'dark light',
};

/**
 * Inline script injected before React hydration to prevent flash of wrong theme.
 * Reads localStorage or system preference and applies the correct class to <html>.
 */
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('pulseboard_theme');
    var theme = (stored === 'light' || stored === 'dark')
      ? stored
      : 'light';
    document.documentElement.classList.add(theme);
  } catch(e) {
    document.documentElement.classList.add('light');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-flash theme script — must run before any paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

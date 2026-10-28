import { Nunito } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { ServiceWorkerRegister } from '@/components/service-worker-register';
import './globals.css';

// Nunito: rounded and friendly, yet highly readable for longer training text.
const nunito = Nunito({ variable: '--font-nunito', subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: { default: 'Beacon: training & support for peer supporters', template: '%s · Beacon' },
  description:
    'Beacon helps university peer supporters build core skills, track their progress and refer peers to the right campus and local services.',
  applicationName: 'Beacon',
  appleWebApp: { capable: true, title: 'Beacon', statusBarStyle: 'default' },
};

export const viewport = {
  themeColor: '#0f8b7e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

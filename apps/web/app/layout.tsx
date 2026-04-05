import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { DatasetProvider } from '@/lib/context/dataset-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'TPHZero Copilot',
  description: 'Monitoreo inteligente de biorremediación de suelos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <DatasetProvider>
          <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
            <SidebarNav />
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        </DatasetProvider>
      </body>
    </html>
  );
}

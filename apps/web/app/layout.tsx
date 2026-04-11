import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { ThemeProvider } from '@/components/providers/theme-provider';
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
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var k='tphzero-contrast-preset';if(localStorage.getItem(k)==='field'){document.documentElement.classList.add('field-hc');document.documentElement.setAttribute('data-contrast-preset','field')}}catch(e){}",
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <DatasetProvider>
            <div className="flex h-screen overflow-hidden bg-background text-foreground">
              <SidebarNav />
              <div className="flex min-w-0 flex-1 flex-col">
                <Header />
                <main className="flex-1 overflow-y-auto">{children}</main>
              </div>
            </div>
          </DatasetProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

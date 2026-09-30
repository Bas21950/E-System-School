import type { Metadata } from 'next';
import './globals.css';
import TopBar from '@/components/layout/TopBar';
import UpdateOverlay from '@/components/system/UpdateOverlay';

export const metadata: Metadata = {
  title: 'E-System School | ระบบทะเบียนโรงเรียน',
  description: 'ระบบทะเบียนนักเรียนออนไลน์สำหรับโรงเรียน',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-slate-50">
        <div id="app-shell" className="min-h-screen">
          <div className="flex min-h-screen flex-col">
            <TopBar />
            <main className="mx-auto flex-1 w-full max-w-[1440px] px-4 py-5 overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
        <UpdateOverlay />
      </body>
    </html>
  );
}

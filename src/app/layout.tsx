import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CFBMS — Campus Facility Booking Management System',
  description:
    'A centralized booking system for campus facilities at President University. Academic project — ISAPMD Final Examination.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#F4F6FA] font-sans antialiased">{children}</body>
    </html>
  );
}

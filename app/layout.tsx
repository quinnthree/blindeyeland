import type { Metadata } from 'next';
import { IM_Fell_English } from 'next/font/google';
import './globals.css';

const fell = IM_Fell_English({
  variable: '--font-fell',
  subsets: ['latin'],
  weight: ['400'],
});

export const metadata: Metadata = {
  title: 'Blind Eye Land',
  description:
    "You've arrived in Blind Eye. Nobody remembers getting here. Wander the town, meet its residents, and discover its stories.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fell.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#0b0e1f] text-[#f2e8d5]">
        {children}
      </body>
    </html>
  );
}

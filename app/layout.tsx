import { Inter, Space_Grotesk } from 'next/font/google';
import { GameProvider } from '@/lib/GameContext';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata = {
  title: 'Hero Realm Strategy',
  description: 'A mobile strategy MMO',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body suppressHydrationWarning className="bg-zinc-950 text-white font-sans overflow-x-hidden">
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}

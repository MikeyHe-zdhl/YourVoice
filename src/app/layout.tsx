import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YourVoice',
  description: 'AI-driven video localization workspace for dubbing, subtitles, and content packaging.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import './globals.css';
import './entrance.css';

export const metadata: Metadata = {
  title: { default: 'Better Than Mona Lisa — An Independent Art Museum', template: '%s · Better Than Mona Lisa' },
  description: 'An independent digital museum of extraordinary paintings. Walk the exhibition, discover eight collections, and look closer at the art.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}

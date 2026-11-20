import './globals.css';

export const metadata = {
  title: 'Doomsday Ready',
  description: 'Plan your MCU rewatch and book an opening night watch party.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

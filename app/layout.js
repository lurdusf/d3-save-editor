import './globals.css';

export const metadata = {
  title: 'Drakengard 3 Save Editor',
  description: 'Edit Drakengard 3 (PS3 / RPCS3) PAYLOAD saves in your browser.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

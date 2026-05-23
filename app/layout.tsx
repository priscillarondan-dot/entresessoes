
import "./globals.css";

export const metadata = {
  title: "EntreSessões",
  description: "Acompanhamento terapêutico entre sessões",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

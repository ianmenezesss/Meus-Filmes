import "./globals.css";

export const metadata = {
  title: "Meus Filmes",
  description: "Coleção pessoal de filmes assistidos e a assistir",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="bg-bg text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}

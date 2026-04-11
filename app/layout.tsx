import "./globals.css";

export const metadata = {
  title: "physics",
  description: "Visual-first physics explainers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

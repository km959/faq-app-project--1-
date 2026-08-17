import "./globals.css";

export const metadata = {
  title: "FAQ App",
  description: "Simple login + FAQ manager",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

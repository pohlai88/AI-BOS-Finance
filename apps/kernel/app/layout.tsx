/**
 * Kernel App Layout
 * 
 * Minimal layout for the Kernel service.
 * This is primarily an API service with no UI.
 */

export const metadata = {
  title: "AIBOS Kernel",
  description: "Control Plane for AIBOS",
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


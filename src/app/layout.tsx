import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { RoleProvider } from '@/context/RoleContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MuteTaxes Dashboard",
  description: "Simplifying taxes, amplifying peace of mind.",
  icons: {
    icon: "/images/logo/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <RoleProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

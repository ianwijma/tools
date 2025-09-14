import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Online Tools Collection",
  description: "A collection of useful online tools that prioritize frontend execution for performance and privacy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // This script runs synchronously before any other content loads
                // to prevent theme flashing
                
                const root = document.documentElement;
                
                // Function to get system theme
                function getSystemTheme() {
                  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                
                // Function to apply theme immediately
                function applyTheme(theme) {
                  root.classList.remove('light', 'dark');
                  root.classList.add(theme);
                  
                  // Also set CSS custom properties immediately
                  if (theme === 'dark') {
                    root.style.setProperty('--background', '#0a0a0a');
                    root.style.setProperty('--foreground', '#ededed');
                  } else {
                    root.style.setProperty('--background', '#ffffff');
                    root.style.setProperty('--foreground', '#171717');
                  }
                }
                
                try {
                  // Try to get saved theme from localStorage
                  const savedTheme = localStorage.getItem('ui-theme');
                  
                  if (savedTheme === 'light' || savedTheme === 'dark') {
                    applyTheme(savedTheme);
                  } else if (savedTheme === 'auto') {
                    applyTheme(getSystemTheme());
                  } else {
                    // No saved theme or invalid theme, default to dark
                    applyTheme('dark');
                  }
                } catch (e) {
                  // localStorage not available, default to dark
                  applyTheme('dark');
                }
                
                // Store the applied theme for React to use later
                window.__INITIAL_THEME__ = root.classList.contains('dark') ? 'dark' : 'light';
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

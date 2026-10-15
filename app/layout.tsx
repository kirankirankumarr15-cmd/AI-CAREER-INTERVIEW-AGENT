import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerPilot AI — Your AI Career Coach",
  description: "Build. Apply. Practice. Interview. Improve. Get Job Ready.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isExtensionError(e) {
                  var src = (e && (e.filename || (e.error && e.error.stack))) || '';
                  var msg = (e && (e.message || (e.error && e.error.message))) || '';
                  return (
                    src.indexOf('chrome-extension://') !== -1 ||
                    src.indexOf('moz-extension://') !== -1 ||
                    msg.indexOf('Minified React error #299') !== -1 ||
                    msg.indexOf('embed_script.js') !== -1
                  );
                }
                window.addEventListener('error', function(event) {
                  if (isExtensionError(event)) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return true;
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(event) {
                  if (isExtensionError(event.reason)) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return true;
                  }
                }, true);
              })();

              (function() {
                try {
                  var stored = localStorage.getItem('careerpilot-theme') || 'system';
                  var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  var doc = document.documentElement;
                  if (isDark) {
                    doc.classList.add('dark');
                    doc.classList.remove('light');
                    doc.setAttribute('data-theme', 'dark');
                  } else {
                    doc.classList.remove('dark');
                    doc.classList.add('light');
                    doc.setAttribute('data-theme', 'light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}

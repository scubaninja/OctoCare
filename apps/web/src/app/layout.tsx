import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'OctoCare Support Hub',
  description: 'Customer portal and agent dashboard for OctoCare support operations.',
};

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/submit-case', label: 'Submit Case' },
  { href: '/track-case', label: 'Track Case' },
  { href: '/knowledge-base', label: 'Knowledge Base' },
  { href: '/assistant', label: 'AI Assistant' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="border-b border-slate-200 bg-slate-950 text-slate-100">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 text-sm">
            <p>Always-on support for customers and internal service teams.</p>
            <p className="hidden text-slate-300 md:block">Fast answers, proactive case management, and AI-assisted triage.</p>
          </div>
        </div>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 text-lg font-black text-white shadow-lg shadow-primary-300/40">
                O
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-950">OctoCare Support Hub</p>
                <p className="text-sm text-slate-500">Customer care operations, unified.</p>
              </div>
            </Link>
            <nav className="flex flex-wrap gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-185px)] max-w-7xl px-6 py-10">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>© 2024 OctoCare. Built for exceptional customer support experiences.</p>
            <p>Customer portal, AI assistance, and agent workflow intelligence in one place.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

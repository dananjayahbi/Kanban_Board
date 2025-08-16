import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart2, Bell, Columns3 } from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Kanban",
  description: "Personal Kanban board manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={cn(`${geistSans.variable} ${geistMono.variable} antialiased`)}>
        <div className="min-h-screen grid grid-cols-[260px_1fr]">
          <aside className="border-r bg-sidebar text-sidebar-foreground">
            <div className="p-4 font-semibold text-lg">{process.env.NEXT_PUBLIC_APP_NAME || "My Kanban"}</div>
            <nav className="px-2 space-y-1">
              <Link href="/boards" className="group flex items-center gap-2 rounded-md px-3 py-2 hover:bg-sidebar-accent">
                <Columns3 className="h-4 w-4" />
                <span>Boards</span>
              </Link>
              <Link href="/dashboard" className="group flex items-center gap-2 rounded-md px-3 py-2 hover:bg-sidebar-accent">
                <BarChart2 className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link href="/alerts" className="group flex items-center gap-2 rounded-md px-3 py-2 hover:bg-sidebar-accent">
                <Bell className="h-4 w-4" />
                <span>Alerts</span>
              </Link>
            </nav>
            <div className="px-4 py-6 mt-auto text-xs text-muted-foreground">
              <p>Light theme enforced</p>
            </div>
          </aside>
          <div className="min-h-screen flex flex-col">
            <header className="border-b px-6 h-14 flex items-center justify-between bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="font-medium">{metadata.title as string}</div>
              <div className="flex items-center gap-2">
                <Link href="/boards/new">
                  <Button size="sm">New Board</Button>
                </Link>
              </div>
            </header>
            <main className="p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

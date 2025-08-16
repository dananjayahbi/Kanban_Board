import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart2, Bell, Columns3 } from "lucide-react";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import * as Lucide from "lucide-react";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch top 7 favorite boards (server component)
  let favorites: { id: string; title: string; color: string | null }[] = [];
  try {
    const pb = (prisma as any).board;
  favorites = await pb.findMany({ where: { isFavorite: true }, orderBy: { favoriteAt: "desc" }, take: 7, select: { id: true, title: true, color: true, icon: true } });
  } catch {}
  return (
    <html lang="en" className="light">
      <body className={cn(`${geistSans.variable} ${geistMono.variable} antialiased`)}>
        <SidebarProvider defaultOpen={false}>
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <div className="flex items-center justify-between px-2">
                <div className="font-semibold text-lg truncate">
                  {process.env.NEXT_PUBLIC_APP_NAME || "My Kanban"}
                </div>
                <SidebarTrigger />
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/dashboard"><BarChart2 className="mr-2" /> <span>Dashboard</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/boards"><Columns3 className="mr-2" /> <span>Boards</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/alerts"><Bell className="mr-2" /> <span>Alerts</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/priorities"><span className="inline-block h-3 w-3 rounded-sm bg-purple-500 mr-2" /><span>Priorities</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Favorites</SidebarGroupLabel>
                <SidebarGroupContent>
                  {favorites.length === 0 ? (
                    <div className="px-2 text-sm text-muted-foreground group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
                      <span className="hidden group-data-[collapsible=icon]:inline-block h-2 w-2 rounded-full bg-sidebar-border" />
                      <span className="group-data-[collapsible=icon]:sr-only">No favorites</span>
                    </div>
                  ) : (
                    <SidebarMenu>
                      {favorites.map((b) => {
                        const Icon = (Lucide as any)[(b as any).icon] as any;
                        return (
                          <SidebarMenuItem key={b.id}>
                            <SidebarMenuButton asChild>
                              <Link href={`/boards/${b.id}`} className="flex items-center gap-2">
                                {Icon ? (
                                  <Icon className="h-4 w-4" />
                                ) : (
                                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: b.color ?? "#6366f1" }} />
                                )}
                                <span className="truncate group-data-[collapsible=icon]:sr-only">{b.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  )}
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter />
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <main className="p-6 overflow-x-hidden">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}

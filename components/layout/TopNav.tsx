"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { User, Settings, LogOut, Shield, Menu, X, BookOpen } from "lucide-react";
import { useState } from "react";

export default function TopNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = (session?.user as any)?.role || "viewer";
  const canAccessAdmin = role === "admin" || role === "analyst";

  const roleBadgeColors: Record<string, string> = {
    admin: "bg-amber-600 text-white",
    analyst: "bg-blue-600 text-white",
    viewer: "bg-stone-600 text-stone-200",
  };
  const roleBadgeColor = roleBadgeColors[role] || "bg-stone-600 text-stone-200";

  return (
    <nav className="bg-stone-800 border-b border-stone-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-serif font-bold text-white tracking-tight">
                AMP
              </span>
              <span className="hidden sm:inline text-stone-400 text-xs tracking-widest uppercase">
                Acquisition Management
              </span>
            </Link>
          </div>

          {/* Center: Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                pathname === "/dashboard"
                  ? "bg-stone-700 text-amber-400"
                  : "text-stone-300 hover:text-white hover:bg-stone-700/50"
              }`}
            >
              Pipeline
            </Link>
            <Link
              href="/dashboard/persona"
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                pathname?.startsWith("/dashboard/persona")
                  ? "bg-stone-700 text-amber-400"
                  : "text-stone-300 hover:text-white hover:bg-stone-700/50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Persona
              </span>
            </Link>
            <Link
              href="/knowledge-base"
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                pathname?.startsWith("/knowledge-base")
                  ? "bg-stone-700 text-amber-400"
                  : "text-stone-300 hover:text-white hover:bg-stone-700/50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Knowledge Base
              </span>
            </Link>
            {canAccessAdmin && (
              <Link
                href="/dashboard/admin"
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  pathname?.startsWith("/dashboard/admin")
                    ? "bg-stone-700 text-amber-400"
                    : "text-stone-300 hover:text-white hover:bg-stone-700/50"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </span>
              </Link>
            )}
          </div>

          {/* Right: User menu */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-stone-700 transition-colors outline-none">
                <div className="w-7 h-7 rounded-full bg-stone-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-stone-300" />
                </div>
                <span className="hidden sm:inline text-sm text-stone-300">
                  {session?.user?.name}
                </span>
                <Badge className={`text-[10px] px-1.5 py-0 ${roleBadgeColor}`}>
                  {role}
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-stone-800 border-stone-700">
                <DropdownMenuItem className="text-stone-300 focus:bg-stone-700 focus:text-white">
                  <User className="w-4 h-4 mr-2" />
                  {session?.user?.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-stone-700" />
                {canAccessAdmin && (
                  <DropdownMenuItem className="text-stone-300 focus:bg-stone-700 focus:text-white cursor-pointer" onClick={() => window.location.href = "/dashboard/admin"}>
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-red-400 focus:bg-stone-700 focus:text-red-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 rounded hover:bg-stone-700"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5 text-stone-300" /> : <Menu className="w-5 h-5 text-stone-300" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-stone-700 py-2 space-y-1">
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded text-sm text-stone-300 hover:bg-stone-700"
              onClick={() => setMobileOpen(false)}
            >
              Pipeline
            </Link>
            <Link
              href="/dashboard/persona"
              className="block px-3 py-2 rounded text-sm text-stone-300 hover:bg-stone-700"
              onClick={() => setMobileOpen(false)}
            >
              Persona
            </Link>
            <Link
              href="/knowledge-base"
              className="block px-3 py-2 rounded text-sm text-stone-300 hover:bg-stone-700"
              onClick={() => setMobileOpen(false)}
            >
              Knowledge Base
            </Link>
            {canAccessAdmin && (
              <Link
                href="/dashboard/admin"
                className="block px-3 py-2 rounded text-sm text-stone-300 hover:bg-stone-700"
                onClick={() => setMobileOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

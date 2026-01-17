"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Shield,
  BarChart3,
  Building2,
  FileCheck,
  TrendingUp,
  Settings,
  Home,
  Hexagon,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Verify", href: "/dashboard/verify", icon: Shield },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Operators", href: "/dashboard/operators", icon: Building2 },
  { name: "RNG Analysis", href: "/dashboard/rng-analysis", icon: TrendingUp },
  { name: "Evidence", href: "/dashboard/evidence", icon: FileCheck },
];

const secondaryNavigation = [
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-[rgba(0,240,255,0.1)] bg-[#0A0E17] px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <Hexagon className="h-9 w-9 text-[#00F0FF] transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
              <span className="absolute inset-0 flex items-center justify-center text-[#00F0FF] font-bold text-sm">P</span>
            </div>
            <span className="font-display text-xl font-bold text-[#F8FAFC]">PIVP</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? "bg-[rgba(0,240,255,0.1)] text-[#00F0FF] shadow-[inset_0_0_20px_rgba(0,240,255,0.1)]"
                            : "text-[#94A3B8] hover:text-[#00F0FF] hover:bg-[rgba(0,240,255,0.05)]",
                          "group flex gap-x-3 rounded-[12px] p-3 text-sm leading-6 font-medium transition-all duration-200"
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? "text-[#00F0FF] drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                              : "text-[#64748B] group-hover:text-[#00F0FF]",
                            "h-5 w-5 shrink-0 transition-all duration-200"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            <li className="mt-auto">
              <ul role="list" className="-mx-2 space-y-1">
                {secondaryNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? "bg-[rgba(0,240,255,0.1)] text-[#00F0FF]"
                            : "text-[#94A3B8] hover:text-[#00F0FF] hover:bg-[rgba(0,240,255,0.05)]",
                          "group flex gap-x-3 rounded-[12px] p-3 text-sm leading-6 font-medium transition-all duration-200"
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? "text-[#00F0FF]"
                              : "text-[#64748B] group-hover:text-[#00F0FF]",
                            "h-5 w-5 shrink-0 transition-all duration-200"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

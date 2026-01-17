"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
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
  X,
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

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#0A0E17]/80 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex">
          <TransitionChild
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel className="relative mr-16 flex w-full max-w-xs flex-1">
              <TransitionChild
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    className="-m-2.5 p-2.5"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-6 w-6 text-[#F8FAFC]" aria-hidden="true" />
                  </button>
                </div>
              </TransitionChild>

              <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-[rgba(0,240,255,0.1)] bg-[#0A0E17] px-6 pb-4">
                {/* Logo */}
                <div className="flex h-16 shrink-0 items-center">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 group"
                    onClick={onClose}
                  >
                    <div className="relative">
                      <Hexagon className="h-9 w-9 text-[#00F0FF] transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
                      <span className="absolute inset-0 flex items-center justify-center text-[#00F0FF] font-bold text-sm">
                        P
                      </span>
                    </div>
                    <span className="font-display text-xl font-bold text-[#F8FAFC]">
                      PIVP
                    </span>
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
                                onClick={onClose}
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
                                onClick={onClose}
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
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Menu, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-[rgba(0,240,255,0.1)] bg-[#0A0E17]/80 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6 text-[#94A3B8]" />
        <span className="sr-only">Open sidebar</span>
      </Button>

      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="relative">
          <Hexagon className="h-7 w-7 text-[#00F0FF]" />
          <span className="absolute inset-0 flex items-center justify-center text-[#00F0FF] font-bold text-xs">P</span>
        </div>
        <span className="font-display text-lg font-bold text-[#F8FAFC]">PIVP</span>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-[rgba(0,240,255,0.1)] lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search placeholder */}
        <div className="flex flex-1 items-center">
          {/* Add search here if needed */}
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative group">
            <Bell className="h-5 w-5 text-[#64748B] group-hover:text-[#00F0FF] transition-colors" />
            <span className="sr-only">View notifications</span>
            {/* Notification dot */}
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
          </Button>

          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-[rgba(0,240,255,0.1)]"
            aria-hidden="true"
          />

          {/* User menu */}
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 ring-2 ring-[rgba(0,240,255,0.2)] ring-offset-2 ring-offset-[#0A0E17]",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}

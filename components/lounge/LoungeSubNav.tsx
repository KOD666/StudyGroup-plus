"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { LayoutDashboard, FolderArchive, HelpCircle } from "lucide-react";

export const MIN_MEMBERS_FOR_FILES = 2;

export interface LoungeSubNavProps {
  groupId: string;
  memberCount: number;
}

interface NavTab {
  key: "overview" | "files" | "quizzes";
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function LoungeSubNav({ groupId, memberCount }: LoungeSubNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const navRef = useRef<HTMLDivElement>(null);

  const tabs: NavTab[] = [
    {
      key: "overview",
      label: "Overview",
      href: `/lounges/${groupId}`,
      icon: LayoutDashboard,
    },
    ...(memberCount >= MIN_MEMBERS_FOR_FILES
      ? [
          {
            key: "files" as const,
            label: "Files",
            href: `/lounges/${groupId}/files`,
            icon: FolderArchive,
          },
        ]
      : []),
    {
      key: "quizzes",
      label: "Quizzes",
      href: `/lounges/${groupId}/quizzes`,
      icon: HelpCircle,
    },
  ];

  // Determine active tab based on pathname
  const isFilesActive = pathname.startsWith(`/lounges/${groupId}/files`);
  const isQuizzesActive = pathname.startsWith(`/lounges/${groupId}/quizzes`);
  const isOverviewActive = !isFilesActive && !isQuizzesActive;

  const getIsActive = (key: NavTab["key"]) => {
    if (key === "files") return isFilesActive;
    if (key === "quizzes") return isQuizzesActive;
    return isOverviewActive;
  };

  const activeIndex = tabs.findIndex((t) => getIsActive(t.key));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (activeIndex + 1) % tabs.length;
      if (tabs[nextIndex]?.href) {
        router.push(tabs[nextIndex].href);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (activeIndex - 1 + tabs.length) % tabs.length;
      if (tabs[prevIndex]?.href) {
        router.push(tabs[prevIndex].href);
      }
    }
  };

  return (
    <nav
      ref={navRef}
      role="navigation"
      aria-label="Lounge Sections"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="w-full border-b border-[var(--border-hairline)] mb-8 overflow-x-auto no-scrollbar outline-none focus-visible:ring-1 focus-visible:ring-[#d97706]/40"
    >
      <div className="flex items-center gap-1 sm:gap-2 min-w-max px-1">
        {tabs.map((tab) => {
          const active = getIsActive(tab.key);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`relative flex items-center gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-sans font-medium transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97706] rounded-t-[var(--radius-button)] ${
                active
                  ? "text-[var(--text-primary)] font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  active ? "text-[#d97706]" : "text-[var(--text-secondary)]"
                }`}
              />
              <span>{tab.label}</span>

              {active && (
                <motion.div
                  layoutId="loungeNavUnderline"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 38,
                    duration: shouldReduceMotion ? 0.05 : 0.25,
                  }}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d97706]"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

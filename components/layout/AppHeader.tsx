"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Bell,
  User,
  LogOut,
  Loader2,
  FileText,
  Users,
  Calendar,
  X,
  Video,
  CheckCheck,
} from "lucide-react";
import { UserButton, useUser, SignOutButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { StudyGroupLogo } from "@/components/icons/StudyGroupLogo";

interface AppHeaderProps {
  activeLoungesCount?: number;
}

interface SearchResultItem {
  id: string;
  type: "lounge" | "asset" | "session";
  title: string;
  subtitle: string;
  link: string;
}

interface NotificationItem {
  id: string;
  type: "session_started" | "session_scheduled" | "asset_uploaded";
  groupId: string;
  referenceId: string | null;
  title: string;
  message: string;
  link: string;
  readAt: string | null;
  createdAt: string;
}

interface ToastItem {
  id: string;
  title: string;
  message: string;
  link: string;
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AppHeader({}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notification state
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());

  // Debounced search effect
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      setIsSearchOpen(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setIsSearchOpen(true);
          setSelectedSearchIndex(-1);
        }
      } catch (err) {
        console.error("Search fetch failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Notifications polling (Item 9: ~20s, paused when tab hidden)
  const fetchNotifications = useCallback(async () => {
    if (!user || (typeof document !== "undefined" && document.hidden)) return;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const items: NotificationItem[] = data.notifications || [];
      const count: number = data.unreadCount ?? 0;

      if (!isInitialLoadRef.current) {
        // Trigger toast for new unread notifications
        const newUnread = items.filter(
          (n) => !n.readAt && !knownNotificationIdsRef.current.has(n.id)
        );
        if (newUnread.length > 0) {
          setToasts((prev) => [
            ...prev,
            ...newUnread.map((n) => ({
              id: n.id,
              title: n.title,
              message: n.message,
              link: n.link,
            })),
          ]);
        }
      } else {
        isInitialLoadRef.current = false;
      }

      items.forEach((n) => knownNotificationIdsRef.current.add(n.id));
      setNotifications(items);
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to poll notifications:", err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 20000); // 20-second polling

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, fetchNotifications]);

  // Auto-dismiss toasts after 6s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Mark notifications read
  const markAsRead = async (notificationId?: string) => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          notificationId ? { notificationId } : { markAll: true }
        ),
      });

      if (notificationId) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.readAt) {
      markAsRead(item.id);
    }
    setIsNotificationOpen(false);
    router.push(item.link);
  };

  // Close search and notification dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen && searchResults.length > 0 && e.key === "ArrowDown") {
      setIsSearchOpen(true);
      setSelectedSearchIndex(0);
      e.preventDefault();
      return;
    }

    if (!isSearchOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSearchIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSearchIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const targetIndex = selectedSearchIndex >= 0 ? selectedSearchIndex : 0;
      if (searchResults[targetIndex]) {
        const item = searchResults[targetIndex];
        setIsSearchOpen(false);
        setSearchQuery("");
        router.push(item.link);
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const handleSelectResult = (item: SearchResultItem) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    router.push(item.link);
  };

  const navItems = [
    { label: "Study Groups", href: "/lounges" },
    { label: "Profile & Settings", href: "/profile" },
  ];

  const getResultIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "lounge":
        return <Users className="w-4 h-4 text-[#d97706] shrink-0" />;
      case "asset":
        return <FileText className="w-4 h-4 text-[#3b82f6] shrink-0" />;
      case "session":
        return <Calendar className="w-4 h-4 text-[#10b981] shrink-0" />;
    }
  };

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "session_started":
        return <Video className="w-4 h-4 text-emerald-500 shrink-0" />;
      case "session_scheduled":
        return <Calendar className="w-4 h-4 text-amber-500 shrink-0" />;
      case "asset_uploaded":
        return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <>
      <header className="w-full sticky top-0 z-40 bg-[var(--bg-elevated)]/95 backdrop-blur-md border-b border-[var(--border-hairline)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-4">
            <Link href="/lounges" className="flex items-center gap-2 group">
              <StudyGroupLogo size={24} className="text-[var(--text-primary)] group-hover:opacity-80 transition-opacity" />
              <span className="font-serif text-2xl font-normal tracking-tight text-[var(--text-primary)] group-hover:opacity-80 transition-opacity">
                StudyGroup<span className="italic font-normal">+</span>
              </span>
            </Link>
          </div>

          {/* Center: Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-sans">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/lounges" && pathname === "/lounges");
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`py-1.5 font-medium transition-colors duration-[var(--dur-fast)] relative ${
                    isActive
                      ? "text-[var(--text-primary)] border-b-2 border-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Search, Notifications, User Profile, Log Out */}
          <div className="flex items-center gap-3">
            {/* Debounced, Server-Scoped Search Bar */}
            <div className="relative hidden md:block w-64 lg:w-80" ref={searchContainerRef}>
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0 || searchQuery.trim().length > 0) {
                      setIsSearchOpen(true);
                    }
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search lounges, notes, sessions..."
                  className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs py-1.5 pl-9 pr-8 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] transition-colors duration-[var(--dur-fast)] font-sans"
                />
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] animate-spin" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setIsSearchOpen(false);
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-0.5"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Search Dropdown */}
              {isSearchOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-[var(--bg-overlay)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto">
                  {isSearching && searchResults.length === 0 ? (
                    <div className="p-4 text-center text-[var(--text-secondary)] font-sans text-xs flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Searching...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-[var(--text-secondary)] font-sans text-xs">
                      <p>No results found for &ldquo;{searchQuery}&rdquo;</p>
                      <p className="font-mono text-[0.625rem] text-[var(--text-disabled)] mt-1">
                        Try searching by lounge name, code, note title, or session
                      </p>
                    </div>
                  ) : (
                    <div className="py-1">
                      <div className="px-3 py-1.5 border-b border-[var(--border-hairline)] font-mono text-[0.625rem] text-[var(--text-secondary)] uppercase tracking-wider">
                        Results ({searchResults.length})
                      </div>
                      {searchResults.map((item, index) => {
                        const isSelected = index === selectedSearchIndex;
                        return (
                          <div
                            key={`${item.type}-${item.id}`}
                            onClick={() => handleSelectResult(item)}
                            onMouseEnter={() => setSelectedSearchIndex(index)}
                            className={`px-3 py-2 cursor-pointer transition-colors duration-[var(--dur-fast)] flex items-start gap-2.5 ${
                              isSelected
                                ? "bg-[var(--bg-inset)]"
                                : "hover:bg-[var(--bg-inset)]"
                            }`}
                          >
                            <div className="mt-0.5">{getResultIcon(item.type)}</div>
                            <div className="min-w-0 flex-1">
                              <div className="font-sans text-xs font-medium text-[var(--text-primary)] truncate">
                                {item.title}
                              </div>
                              <div className="font-mono text-[0.6875rem] text-[var(--text-secondary)] truncate">
                                {item.subtitle}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stateful Notification Menu (Item 9) */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] rounded-[var(--radius-button)] transition-colors duration-[var(--dur-fast)] relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {/* Unread count badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#e5484d] text-white font-mono text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--bg-overlay)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] shadow-xl z-50 font-sans text-xs overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)] uppercase font-semibold">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#e5484d]/10 text-[#e5484d] font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAsRead()}
                        className="text-[0.6875rem] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-hairline)]">
                    {notifications.length === 0 ? (
                      <div className="py-8 px-4 text-center text-[var(--text-secondary)]">
                        <p className="font-sans text-xs">No notifications yet</p>
                        <p className="font-mono text-[0.625rem] text-[var(--text-disabled)] mt-1">
                          Updates on meetings and uploaded material will appear here
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isUnread = !n.readAt;
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 cursor-pointer transition-colors flex items-start gap-3 ${
                              isUnread
                                ? "bg-[var(--bg-inset)]/60 hover:bg-[var(--bg-inset)]"
                                : "hover:bg-[var(--bg-inset)]/40 opacity-80 hover:opacity-100"
                            }`}
                          >
                            <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p
                                  className={`text-xs truncate ${
                                    isUnread
                                      ? "font-semibold text-[var(--text-primary)]"
                                      : "font-normal text-[var(--text-primary)]"
                                  }`}
                                >
                                  {n.title}
                                </p>
                                <span className="font-mono text-[0.625rem] text-[var(--text-disabled)] shrink-0">
                                  {formatRelativeTime(n.createdAt)}
                                </span>
                              </div>
                              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                            </div>
                            {isUnread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#e5484d] mt-1.5 shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle size="sm" />

            {/* Profile Shortcut & User Button */}
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-hairline)]">
              <Link
                href="/profile"
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] rounded-[var(--radius-button)] transition-colors duration-[var(--dur-fast)] cursor-pointer"
                title="Account & Profile Settings"
              >
                <User className="w-4 h-4" />
              </Link>

              <UserButton
                appearance={{
                  elements: {
                    avatarBox:
                      "w-8 h-8 rounded-[var(--radius-button)] border border-[var(--border-hairline)]",
                  },
                }}
              />
              {user && (
                <span className="hidden xl:inline-block font-mono text-xs text-[var(--text-secondary)]">
                  {user.firstName || user.username || "Member"}
                </span>
              )}

              {/* Log Out Button */}
              <SignOutButton redirectUrl="/">
                <button
                  type="button"
                  className="whitespace-nowrap shrink-0 px-3 py-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] transition-colors duration-[var(--dur-fast)] flex items-center gap-1.5 cursor-pointer shadow-none"
                  title="Log Out of StudyGroup+"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Log Out</span>
                </button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Real-Time Toast Notifications (Item 9) */}
      {toasts.length > 0 && (
        <aside
          aria-label="Notification alerts"
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-auto"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              onClick={() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                markAsRead(toast.id);
                router.push(toast.link);
              }}
              className="bg-[var(--bg-overlay)] border border-[var(--border-strong)] rounded-[var(--radius-card)] p-3 shadow-2xl cursor-pointer hover:border-[#d97706] transition-all flex items-start justify-between gap-3 animate-slide-up"
            >
              <div className="min-w-0">
                <p className="font-sans text-xs font-semibold text-[var(--text-primary)]">
                  {toast.title}
                </p>
                <p className="font-sans text-[0.6875rem] text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }}
                className="text-[var(--text-disabled)] hover:text-[var(--text-primary)] p-0.5 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </aside>
      )}
    </>
  );
}

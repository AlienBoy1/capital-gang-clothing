"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Images,
  LayoutDashboard,
  Settings,
  Shirt,
  Sparkles,
  Syringe,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface DashboardNavLinkProps {
  href: string;
  icon: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Sparkles,
  Shirt,
  Syringe,
  Images,
  ClipboardList,
  Users,
  Settings,
};

export function DashboardNavLink({ href, icon, children, onNavigate }: DashboardNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  const Icon = iconMap[icon] ?? LayoutDashboard;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
        isActive ? "bg-brand-soft text-brand" : "text-muted hover:bg-elevated hover:text-fg"
      )}
    >
      <Icon size={18} strokeWidth={1.75} />
      {children}
    </Link>
  );
}

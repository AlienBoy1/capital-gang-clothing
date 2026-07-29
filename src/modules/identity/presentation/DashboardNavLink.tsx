"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Images,
  LayoutDashboard,
  Settings,
  Shirt,
  Syringe,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface DashboardNavLinkProps {
  href: string;
  icon: string;
  children: React.ReactNode;
}

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Shirt,
  Syringe,
  Images,
  ClipboardList,
  Users,
  Settings,
};

export function DashboardNavLink({ href, icon, children }: DashboardNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  const Icon = iconMap[icon] ?? LayoutDashboard;

  return (
    <Link
      href={href}
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

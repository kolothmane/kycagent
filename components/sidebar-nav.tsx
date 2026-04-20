import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  ClipboardList,
  House,
  Scale,
  Settings2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navigationItems: Array<{
  label: string;
  icon: LucideIcon;
  active?: boolean;
}> = [
  { label: "Home", icon: House },
  { label: "Accounts", icon: Building2 },
  { label: "Contacts", icon: UsersRound },
  { label: "KYC Cases", icon: ShieldCheck, active: true },
  { label: "Verification Queue", icon: ClipboardList },
  { label: "Compliance Review", icon: Scale },
  { label: "Reports", icon: BarChart3 },
  { label: "Settings", icon: Settings2 },
];

export function SidebarNav() {
  return (
    <aside className="hidden xl:block xl:w-[260px]">
      <div className="sticky top-[88px] overflow-hidden rounded-2xl bg-sidebar text-sidebar-foreground shadow-console">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
            Workspace
          </div>
          <div className="mt-2 text-lg font-semibold">Lightning Service Shell</div>
          <div className="mt-1 text-sm text-white/65">
            Case operations, onboarding, and compliance routing
          </div>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all",
                  item.active
                    ? "bg-white text-sidebar shadow-sm"
                    : "text-white/75 hover:bg-sidebar-muted hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
              Operations Stream
            </div>
            <div className="mt-2 text-sm font-medium text-white">
              Paris Retail Onboarding
            </div>
            <div className="mt-1 text-sm text-white/65">
              Active queue focused on digital identity verification and compliance clearance.
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

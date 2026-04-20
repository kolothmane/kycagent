import {
  Bell,
  CircleHelp,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TopHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              Financial Services Console
            </div>
            <div className="truncate text-xs text-muted-foreground">
              Service Operations Workspace
            </div>
          </div>
        </div>

        <div className="hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search"
              placeholder="Search accounts, contacts, cases, and activities"
              className="h-11 rounded-full border-white/60 bg-slate-50/90 pl-10 shadow-sm"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <CircleHelp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10 border border-white/70 shadow-sm">
            <AvatarFallback>OA</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDownIcon, BuildingIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu,
} from "@/components/ui/sidebar";

interface Business {
  id: string;
  name: string;
  slug: string;
}

interface BusinessSwitcherProps {
  businesses: Business[];
}

export function BusinessSwitcher({ businesses }: BusinessSwitcherProps) {
  const router = useRouter();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg gradient-primary text-white shadow-md shadow-primary/20">
              <BuildingIcon className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none text-left">
              <span className="font-semibold tracking-tight">Apotho</span>
              <span className="text-xs text-sidebar-foreground/60">
                Improvements
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom">
            <DropdownMenuLabel>Businesses</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {businesses.map((business) => (
              <DropdownMenuItem
                key={business.id}
                onClick={() => router.push(`/${business.slug}`)}
              >
                {business.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

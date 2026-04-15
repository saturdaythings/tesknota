import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { StatsGrid, StatBox } from "@/components/ui/stat-box";
import { SectionHeader } from "@/components/ui/section-header";
import { FilterBar, FilterChip } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";

const navSections = [
  {
    label: "My Space",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/collection", label: "My Collection", count: 42 },
      { href: "/wishlist", label: "Wishlist", count: 8 },
    ],
  },
  {
    label: "Experiences",
    items: [
      { href: "/compliments", label: "Compliments", count: 127 },
      { href: "/analytics", label: "Analytics" },
    ],
  },
  {
    label: "Social",
    items: [{ href: "/friend", label: "Sylvia" }],
  },
  {
    label: "Manage",
    items: [
      { href: "/import", label: "Import" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

export default function Home() {
  return (
    <AppShell
      sidebar={
        <Sidebar
          navSections={navSections}
          userName="Kiana"
        />
      }
    >
      <Topbar
        category="My Space"
        title="Dashboard"
        actions={<Button variant="blue">Add Fragrance</Button>}
      />
      <main className="flex-1 overflow-y-auto p-[26px]">
        <StatsGrid>
          <StatBox value={42} label="In Collection" />
          <StatBox value={8} label="Wishlist" />
          <StatBox value={127} label="Compliments" delta="+12 this month" />
          <StatBox value={3} label="Finished" />
        </StatsGrid>

        <SectionHeader
          title="Top Performers"
          right={
            <FilterBar>
              <FilterChip label="All Time" active />
              <FilterChip label="This Year" />
              <FilterChip label="6 Months" />
            </FilterBar>
          }
        />

        <div className="font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase">
          Phase 2 — Component library complete. Feature pages pending.
        </div>
      </main>
    </AppShell>
  );
}

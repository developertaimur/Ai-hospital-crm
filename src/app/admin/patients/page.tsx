"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Panel } from "@/components/layout/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { formatKarachi } from "@/lib/time";

const PAGE_SIZE = 6;

export default function AdminPatientsPage() {
  const { ready, state } = useDemoReady();
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    if (!state) return [];
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return state.patients
      .filter((p) => {
        if (!q) return true;
        const nameMatch = p.fullName.toLowerCase().includes(q);
        const phoneMatch =
          p.phoneNational.includes(q) ||
          (digits.length > 0 && p.phoneNational.replace(/\D/g, "").includes(digits));
        const emailMatch = (p.email ?? "").toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch;
      })
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state, query]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const remaining = Math.max(0, filtered.length - visibleCount);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading patients…</p>;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Records"
        title="Patients"
        description="Search by name or mobile number, then load more of the directory."
        badge={
          <Badge variant="secondary">
            {filtered.length} of {state.patients.length}
          </Badge>
        }
      />

      <Panel
        title="Patient directory"
        description={
          query.trim()
            ? `${filtered.length} match${filtered.length === 1 ? "" : "es"} for “${query.trim()}”`
            : `Showing ${visible.length} of ${filtered.length}`
        }
      >
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search name or mobile number…"
              className="rounded-xl pl-9"
              aria-label="Search patients by name or mobile number"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted">
                      No patients match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.fullName}</TableCell>
                      <TableCell className="tabular-nums">
                        {p.phoneNational}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {p.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        {formatKarachi(p.createdAt, "dd MMM yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="secondary"
                className="rounded-xl"
                onClick={() =>
                  setVisibleCount((count) =>
                    Math.min(count + PAGE_SIZE, filtered.length),
                  )
                }
              >
                Show more
                <span className="ml-1.5 text-muted">({remaining} left)</span>
              </Button>
            </div>
          ) : filtered.length > PAGE_SIZE ? (
            <p className="text-center text-sm text-muted">
              All matching patients are shown.
            </p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

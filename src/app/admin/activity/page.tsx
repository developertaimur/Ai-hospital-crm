"use client";

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
import { userDisplayName } from "@/lib/display/lookups";

export default function AdminActivityPage() {
  const { ready, state } = useDemoReady();
  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading activity…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Activity</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.activityEvents.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                {formatKarachi(e.createdAt, "dd MMM yyyy · hh:mm a")}
              </TableCell>
              <TableCell>{e.type.replace(/_/g, " ")}</TableCell>
              <TableCell>
                {e.actorUserId
                  ? userDisplayName(state, e.actorUserId)
                  : "System"}
              </TableCell>
              <TableCell>{e.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

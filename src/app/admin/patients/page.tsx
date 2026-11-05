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

export default function AdminPatientsPage() {
  const { ready, state } = useDemoReady();
  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading patients…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Patients</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Registered</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.patients.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.fullName}</TableCell>
              <TableCell>{p.phoneNational}</TableCell>
              <TableCell>{p.email ?? "—"}</TableCell>
              <TableCell>
                {formatKarachi(p.createdAt, "dd MMM yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

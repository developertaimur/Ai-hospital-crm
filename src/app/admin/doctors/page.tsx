"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { formatPkr } from "@/lib/money";
import { serviceName } from "@/lib/display/lookups";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminDoctorsPage() {
  const { ready, state } = useDemoReady();
  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading doctors…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Doctors</h1>
      <div className="grid gap-4">
        {state.doctors.map((doc) => {
          const services = state.doctorServices.filter(
            (ds) => ds.doctorId === doc.id,
          );
          const hours = state.workingHours.filter((h) => h.doctorId === doc.id);
          const dept = state.departments.find((d) => d.id === doc.departmentId);
          return (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {doc.title} {doc.displayName}
                </CardTitle>
                <p className="text-sm text-muted">{dept?.name}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {doc.bio ? (
                  <p className="text-sm text-muted">{doc.bio}</p>
                ) : null}
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Services</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Fee</TableHead>
                        <TableHead>Buffer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((ds) => (
                        <TableRow key={ds.id}>
                          <TableCell>
                            {serviceName(state, ds.serviceId)}
                          </TableCell>
                          <TableCell>{ds.durationMinutes} min</TableCell>
                          <TableCell>{formatPkr(ds.feePaisa)}</TableCell>
                          <TableCell>{ds.bufferMinutes} min</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Working hours</h3>
                  <ul className="text-sm">
                    {hours.map((h) => (
                      <li key={h.id}>
                        {DAY_NAMES[h.dayOfWeek]} · {h.startTime}–{h.endTime}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

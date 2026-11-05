import { Badge, type BadgeProps } from "@/components/ui/badge";
import type {
  AppointmentStatus,
  ArrivalStatus,
  CallbackStatus,
  PaymentStatus,
} from "@/lib/types";

type StatusKind =
  | AppointmentStatus
  | ArrivalStatus
  | PaymentStatus
  | CallbackStatus
  | "verified"
  | "outstanding";

const LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  expired: "Expired",
  completed: "Completed",
  no_show: "No show",
  scheduled: "Scheduled",
  arrived: "Arrived",
  in_consultation: "In consultation",
  unpaid: "Unpaid",
  partial: "Partial",
  cleared: "Cleared",
  review_required: "Review required",
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In progress",
  unable_to_reach: "Unable to reach",
  verified: "Verified",
  outstanding: "Outstanding",
};

const VARIANT: Record<string, BadgeProps["variant"]> = {
  awaiting_payment: "warning",
  confirmed: "success",
  cancelled: "secondary",
  expired: "destructive",
  completed: "success",
  no_show: "destructive",
  scheduled: "secondary",
  arrived: "default",
  in_consultation: "default",
  unpaid: "warning",
  partial: "warning",
  cleared: "success",
  review_required: "destructive",
  pending: "warning",
  assigned: "default",
  in_progress: "default",
  unable_to_reach: "destructive",
  verified: "success",
  outstanding: "warning",
};

export function StatusBadge({ status }: { status: StatusKind }) {
  const label = LABELS[status] ?? status;
  const variant = VARIANT[status] ?? "secondary";
  return (
    <Badge variant={variant}>
      <span className="sr-only">Status: </span>
      {label}
    </Badge>
  );
}

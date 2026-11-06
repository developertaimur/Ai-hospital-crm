export const SCHEMA_VERSION = 4 as const;

export type Role = "admin" | "doctor" | "reception";

export type Permission =
  | "view_dashboard"
  | "manage_appointments"
  | "manage_patients"
  | "manage_callbacks"
  | "view_calls"
  | "manage_settings"
  | "view_as"
  | "manage_staff"
  | "verify_payment"
  | "update_arrival"
  | "view_own_schedule"
  | "view_activity";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  doctorId?: string;
  permissions: Permission[];
  active: boolean;
  /** Demo-only plaintext password for local login (not production-safe). */
  password?: string;
}

export interface Doctor {
  id: string;
  userId: string;
  displayName: string;
  title: string;
  departmentId: string;
  bio?: string;
  /** Soft-delete / deactivate from Admin; historical bookings remain. */
  active: boolean;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
}

export interface Service {
  id: string;
  departmentId: string;
  name: string;
  description?: string;
}

export interface DoctorService {
  id: string;
  doctorId: string;
  serviceId: string;
  durationMinutes: number;
  feePaisa: number;
  bufferMinutes: number;
  workingPeriodIds: string[];
}

export interface WorkingHours {
  id: string;
  doctorId: string;
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface BreakPeriod {
  id: string;
  doctorId: string;
  /** Karachi date key YYYY-MM-DD or recurring weekday */
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  label?: string;
}

export interface LeavePeriod {
  id: string;
  doctorId: string;
  startDateKey: string;
  endDateKey: string;
  reason?: string;
}

export interface BlockedPeriod {
  id: string;
  doctorId: string;
  startIso: string;
  endIso: string;
  reason?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  phoneE164: string;
  phoneNational: string;
  email?: string;
  createdAt: string;
}

export type AppointmentStatus =
  | "awaiting_payment"
  | "confirmed"
  | "cancelled"
  | "expired"
  | "completed"
  | "no_show";

export type ArrivalStatus =
  | "scheduled"
  | "arrived"
  | "in_consultation"
  | "completed"
  | "no_show";

export type PaymentStatus = "unpaid" | "partial" | "cleared" | "review_required";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  status: AppointmentStatus;
  arrivalStatus: ArrivalStatus;
  paymentStatus: PaymentStatus;
  totalFeePaisa: number;
  verifiedAmountPaisa: number;
  expiresAt?: string;
  cancelledAt?: string;
  completedAt?: string;
  notes?: string;
  /** Human follow-up flags */
  requiresPaymentResolution?: boolean;
  requiresRefundReview?: boolean;
  feeDifferenceFlag?: boolean;
  rescheduleResolutionRequired?: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
}

export interface Payment {
  id: string;
  appointmentId: string;
  patientId: string;
  amountPaisa: number;
  verified: boolean;
  verifiedAt?: string;
  verifiedByUserId?: string;
  method: "cash" | "card" | "bank_transfer" | "other";
  reference?: string;
  createdAt: string;
}

export type PaymentClaimStatus = "pending_review" | "approved" | "rejected";

export interface PaymentClaim {
  id: string;
  appointmentId: string;
  patientId: string;
  claimedAmountPaisa: number;
  status: PaymentClaimStatus;
  submittedByUserId?: string;
  notes?: string;
  createdAt: string;
}

export type TransferOutcome =
  | "requested"
  | "connecting"
  | "connected"
  | "failed"
  | "human_unavailable";

export type DemoLocale = "en" | "ur";

export type BookingOutcome =
  | "none"
  | "provisional_reservation"
  | "confirmed"
  | "forwarded_to_admin"
  | "callback_requested"
  | "abandoned";

export interface CallRecord {
  id: string;
  /** Present when the caller is matched to a known patient */
  patientId?: string;
  appointmentId?: string;
  /** For calls without a matched patient/booking */
  callerName?: string;
  callerNumber?: string;
  direction: "inbound" | "outbound";
  startedAt: string;
  endedAt?: string;
  /** Wall-clock length when both start and end are known */
  durationSeconds?: number;
  language?: DemoLocale;
  transferOutcome?: TransferOutcome;
  summary?: string;
  /** Simulated Patient/AI conversation transcript (not a clinical record) */
  patientTranscript?: string;
  aiTranscript?: string;
  requestedDoctorId?: string;
  requestedServiceId?: string;
  bookingOutcome?: BookingOutcome;
  forwardedToAdmin?: boolean;
}

export type CallbackStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "completed"
  | "unable_to_reach";

export interface CallbackRequest {
  id: string;
  patientId: string;
  /** Prefer matching callbacks to bookings by this ID, not patient name alone */
  appointmentId?: string;
  phoneE164: string;
  preferredWindow?: string;
  reason: string;
  status: CallbackStatus;
  assignedToUserId?: string;
  requestedDoctorId?: string;
  language?: DemoLocale;
  summary?: string;
  notes: CallbackNote[];
  transcriptUnavailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CallbackNote {
  id: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export type NotificationKind =
  | "appointment_provisional"
  | "appointment_confirmed"
  | "appointment_rescheduled"
  | "appointment_cancelled"
  | "appointment_expired"
  | "payment_reminder";

export type NotificationDeliveryStatus =
  | "queued_demo"
  | "sent_simulated"
  | "failed_simulated";

export interface NotificationRecord {
  id: string;
  kind: NotificationKind;
  appointmentId?: string;
  patientId: string;
  channel: "sms" | "whatsapp" | "email";
  locale: "en" | "ur";
  body: string;
  status: NotificationDeliveryStatus;
  errorMessage?: string;
  createdAt: string;
  sentAt?: string;
}

export type ActivityEventType =
  | "appointment_created"
  | "appointment_confirmed"
  | "appointment_rescheduled"
  | "appointment_cancelled"
  | "appointment_expired"
  | "payment_verified"
  | "payment_claim_created"
  | "callback_updated"
  | "settings_updated"
  | "demo_reset"
  | "staff_change_simulated"
  | "doctor_created"
  | "doctor_updated"
  | "doctor_deactivated";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  actorUserId?: string;
  message: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export type AiChangePolicy =
  | "pending_configuration"
  | "require_approval"
  | "auto_apply";

export interface HospitalSettings {
  hospitalName: string;
  locationPlaceholder: string;
  timezone: string;
  transferPhoneNumber: string | null;
  clinicalEscalationContact: string | null;
  aiChangePolicy: AiChangePolicy;
  defaultReservationExpiryMinutes: number;
  /** When false, Reception should not auto-simulate AI inbound rings. */
  aiReceptionEnabled: boolean;
  aiDefaultLanguage: DemoLocale;
  aiGreetingNote?: string;
}

export interface DemoState {
  schemaVersion: typeof SCHEMA_VERSION;
  departments: Department[];
  services: Service[];
  doctors: Doctor[];
  doctorServices: DoctorService[];
  workingHours: WorkingHours[];
  breakPeriods: BreakPeriod[];
  leavePeriods: LeavePeriod[];
  blockedPeriods: BlockedPeriod[];
  patients: Patient[];
  users: User[];
  appointments: Appointment[];
  payments: Payment[];
  paymentClaims: PaymentClaim[];
  callbacks: CallbackRequest[];
  callRecords: CallRecord[];
  notifications: NotificationRecord[];
  activityEvents: ActivityEvent[];
  hospitalSettings: HospitalSettings;
  processedClientRequestIds: string[];
}

export interface SessionUser {
  userId: string;
  username: string;
  role: Role;
  doctorId?: string;
}

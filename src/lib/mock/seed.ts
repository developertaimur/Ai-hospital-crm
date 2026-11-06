import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import {
  SCHEMA_VERSION,
  type Appointment,
  type CallbackRequest,
  type DemoState,
  type User,
} from "@/lib/types";
import {
  addMinutesIso,
  getDemoNow,
  karachiTimeOnDateKey,
  toKarachiDateKey,
} from "@/lib/time";
import { id } from "@/lib/utils";

function staffUsersFromDemoAccounts(): User[] {
  return DEMO_ACCOUNTS.map((a) => ({
    id: a.userId,
    username: a.username,
    displayName: a.displayName,
    role: a.role,
    doctorId: a.doctorId,
    permissions: a.permissions,
    active: true,
    password: a.password,
  }));
}

export function createSeedState(now: Date = getDemoNow()): DemoState {
  const nowIso = now.toISOString();
  const todayKey = toKarachiDateKey(nowIso);

  const departments = [
    { id: "dept-cardio", name: "Cardiology", slug: "cardiology" },
    { id: "dept-ortho", name: "Orthopedics", slug: "orthopedics" },
    { id: "dept-gp", name: "General Medicine", slug: "general-medicine" },
    { id: "dept-peds", name: "Pediatrics", slug: "pediatrics" },
    { id: "dept-derm", name: "Dermatology", slug: "dermatology" },
  ];

  const services = [
    {
      id: "svc-consult-cardio",
      departmentId: "dept-cardio",
      name: "Cardiology Consultation",
    },
    {
      id: "svc-echo",
      departmentId: "dept-cardio",
      name: "Echocardiogram",
    },
    {
      id: "svc-consult-ortho",
      departmentId: "dept-ortho",
      name: "Orthopedic Consultation",
    },
    { id: "svc-xray-review", departmentId: "dept-ortho", name: "X-Ray Review" },
    {
      id: "svc-consult-gp",
      departmentId: "dept-gp",
      name: "General Check-up",
    },
    {
      id: "svc-consult-peds",
      departmentId: "dept-peds",
      name: "Pediatric Consultation",
    },
    {
      id: "svc-consult-derm",
      departmentId: "dept-derm",
      name: "Dermatology Consultation",
    },
    { id: "svc-skin-procedure", departmentId: "dept-derm", name: "Minor Skin Procedure" },
  ];

  const doctors = [
    {
      id: "doc-ahmed",
      userId: "user-doc-ahmed",
      displayName: "Dr. Muhammad Taimur",
      title: "Consultant Cardiologist",
      departmentId: "dept-cardio",
      active: true,
    },
    {
      id: "doc-khan",
      userId: "user-doc-khan",
      displayName: "Dr. Imran Khan",
      title: "Orthopedic Surgeon",
      departmentId: "dept-ortho",
      active: true,
    },
    {
      id: "doc-fatima",
      userId: "user-doc-fatima",
      displayName: "Dr. Fatima Noor",
      title: "General Physician",
      departmentId: "dept-gp",
      active: true,
    },
    {
      id: "doc-ali",
      userId: "user-doc-ali",
      displayName: "Dr. Sohaib",
      title: "Pediatrician",
      departmentId: "dept-peds",
      active: true,
    },
    {
      id: "doc-sana",
      userId: "user-doc-sana",
      displayName: "Dr. Sana Iqbal",
      title: "Dermatologist",
      departmentId: "dept-derm",
      active: true,
    },
    {
      id: "doc-hassan",
      userId: "user-doc-hassan",
      displayName: "Dr. Hassan Malik",
      title: "Cardiology Fellow",
      departmentId: "dept-cardio",
      active: true,
    },
    {
      id: "doc-bilal",
      userId: "user-doc-bilal",
      displayName: "Dr. Hamza",
      title: "Consultant Physician",
      departmentId: "dept-gp",
      active: true,
    },
  ];

  const wh = (doctorId: string, dayOfWeek: number, whId: string) => ({
    id: whId,
    doctorId,
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
  });

  const workingHours = doctors.flatMap((d) =>
    [1, 2, 3, 4, 5, 6].map((dow) =>
      wh(d.id, dow, `wh-${d.id}-${dow}`),
    ),
  );

  const breakPeriods = doctors.map((d) => ({
    id: `break-lunch-${d.id}`,
    doctorId: d.id,
    dayOfWeek: undefined as number | undefined,
    startTime: "13:00",
    endTime: "14:00",
    label: "Lunch",
  }));

  const doctorServices = [
    {
      id: "ds-ahmed-consult",
      doctorId: "doc-ahmed",
      serviceId: "svc-consult-cardio",
      durationMinutes: 30,
      feePaisa: 500000,
      bufferMinutes: 10,
      workingPeriodIds: [] as string[],
    },
    {
      id: "ds-ahmed-echo",
      doctorId: "doc-ahmed",
      serviceId: "svc-echo",
      durationMinutes: 45,
      feePaisa: 850000,
      bufferMinutes: 15,
      workingPeriodIds: [],
    },
    {
      id: "ds-khan-consult",
      doctorId: "doc-khan",
      serviceId: "svc-consult-ortho",
      durationMinutes: 30,
      feePaisa: 450000,
      bufferMinutes: 10,
      workingPeriodIds: [],
    },
    {
      id: "ds-khan-xray",
      doctorId: "doc-khan",
      serviceId: "svc-xray-review",
      durationMinutes: 20,
      feePaisa: 300000,
      bufferMinutes: 5,
      workingPeriodIds: [],
    },
    {
      id: "ds-fatima-gp",
      doctorId: "doc-fatima",
      serviceId: "svc-consult-gp",
      durationMinutes: 20,
      feePaisa: 250000,
      bufferMinutes: 5,
      workingPeriodIds: [],
    },
    {
      id: "ds-ali-peds",
      doctorId: "doc-ali",
      serviceId: "svc-consult-peds",
      durationMinutes: 25,
      feePaisa: 350000,
      bufferMinutes: 10,
      workingPeriodIds: [],
    },
    {
      id: "ds-sana-derm",
      doctorId: "doc-sana",
      serviceId: "svc-consult-derm",
      durationMinutes: 30,
      feePaisa: 400000,
      bufferMinutes: 10,
      workingPeriodIds: [],
    },
    {
      id: "ds-sana-proc",
      doctorId: "doc-sana",
      serviceId: "svc-skin-procedure",
      durationMinutes: 40,
      feePaisa: 600000,
      bufferMinutes: 15,
      workingPeriodIds: [],
    },
    {
      id: "ds-bilal-gp",
      doctorId: "doc-bilal",
      serviceId: "svc-consult-gp",
      durationMinutes: 25,
      feePaisa: 300000,
      bufferMinutes: 5,
      workingPeriodIds: [],
    },
    {
      id: "ds-hassan-consult",
      doctorId: "doc-hassan",
      serviceId: "svc-consult-cardio",
      durationMinutes: 30,
      feePaisa: 350000,
      bufferMinutes: 10,
      workingPeriodIds: [],
    },
  ];

  const patients = [
    {
      id: "pat-1",
      fullName: "Usman Sheikh",
      phoneE164: "+923001234567",
      phoneNational: "03001234567",
      createdAt: nowIso,
    },
    {
      id: "pat-2",
      fullName: "Ayesha Khan",
      phoneE164: "+923211234567",
      phoneNational: "03211234567",
      createdAt: nowIso,
    },
    {
      id: "pat-3",
      fullName: "Bilal Ahmed",
      phoneE164: "+923331234567",
      phoneNational: "03331234567",
      createdAt: nowIso,
    },
    {
      id: "pat-4",
      fullName: "Maria Joseph",
      phoneE164: "+923451234567",
      phoneNational: "03451234567",
      createdAt: nowIso,
    },
    {
      id: "pat-5",
      fullName: "Hamza Qureshi",
      phoneE164: "+923001112233",
      phoneNational: "03001112233",
      createdAt: nowIso,
    },
    {
      id: "pat-6",
      fullName: "Zainab Ali",
      phoneE164: "+923155667788",
      phoneNational: "03155667788",
      createdAt: nowIso,
    },
    {
      id: "pat-7",
      fullName: "Omar Farooq",
      phoneE164: "+923009998877",
      phoneNational: "03009998877",
      createdAt: nowIso,
    },
    {
      id: "pat-8",
      fullName: "Sadia Hussain",
      phoneE164: "+923221122334",
      phoneNational: "03221122334",
      createdAt: nowIso,
    },
  ];

  function aptStartToday(hour: number, minute: number): string {
    return karachiTimeOnDateKey(
      todayKey,
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    );
  }

  function aptStartOffsetDays(days: number, hour: number, minute: number): string {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    const key = toKarachiDateKey(d.toISOString());
    return karachiTimeOnDateKey(
      key,
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    );
  }

  const appointments: Appointment[] = [];
  const payments: DemoState["payments"] = [];
  const notifications: DemoState["notifications"] = [];

  function pushApt(
    partial: Omit<Appointment, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    },
  ): Appointment {
    const apt: Appointment = {
      ...partial,
      id: partial.id ?? id("apt"),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    appointments.push(apt);
    return apt;
  }

  // Confirmed today
  const confirmed1 = pushApt({
    patientId: "pat-1",
    doctorId: "doc-ahmed",
    serviceId: "svc-consult-cardio",
    scheduledStartIso: aptStartToday(10, 0),
    scheduledEndIso: addMinutesIso(aptStartToday(10, 0), 30),
    status: "confirmed",
    arrivalStatus: "scheduled",
    paymentStatus: "cleared",
    totalFeePaisa: 500000,
    verifiedAmountPaisa: 500000,
  });
  payments.push({
    id: id("pay"),
    appointmentId: confirmed1.id,
    patientId: "pat-1",
    amountPaisa: 500000,
    verified: true,
    verifiedAt: nowIso,
    verifiedByUserId: "user-admin",
    method: "bank_transfer",
    createdAt: nowIso,
  });

  const confirmed2 = pushApt({
    patientId: "pat-2",
    doctorId: "doc-khan",
    serviceId: "svc-consult-ortho",
    scheduledStartIso: aptStartToday(11, 0),
    scheduledEndIso: addMinutesIso(aptStartToday(11, 0), 30),
    status: "confirmed",
    arrivalStatus: "arrived",
    paymentStatus: "cleared",
    totalFeePaisa: 450000,
    verifiedAmountPaisa: 450000,
  });

  // Active awaiting_payment
  const awaiting = pushApt({
    patientId: "pat-3",
    doctorId: "doc-ahmed",
    serviceId: "svc-echo",
    scheduledStartIso: aptStartToday(15, 0),
    scheduledEndIso: addMinutesIso(aptStartToday(15, 0), 45),
    status: "awaiting_payment",
    arrivalStatus: "scheduled",
    paymentStatus: "unpaid",
    totalFeePaisa: 850000,
    verifiedAmountPaisa: 0,
    expiresAt: addMinutesIso(nowIso, 55),
  });
  notifications.push({
    id: id("notif"),
    kind: "appointment_provisional",
    appointmentId: awaiting.id,
    patientId: "pat-3",
    channel: "sms",
    locale: "en",
    body: "Provisional reservation — payment pending (demo)",
    status: "sent_simulated",
    createdAt: nowIso,
    sentAt: nowIso,
  });

  pushApt({
    patientId: "pat-4",
    doctorId: "doc-sana",
    serviceId: "svc-consult-derm",
    scheduledStartIso: aptStartToday(16, 0),
    scheduledEndIso: addMinutesIso(aptStartToday(16, 0), 30),
    status: "awaiting_payment",
    arrivalStatus: "scheduled",
    paymentStatus: "partial",
    totalFeePaisa: 400000,
    verifiedAmountPaisa: 100000,
    expiresAt: addMinutesIso(nowIso, 40),
  });

  // Expired with partial payment flagged
  const expiredPartial = pushApt({
    patientId: "pat-5",
    doctorId: "doc-khan",
    serviceId: "svc-xray-review",
    scheduledStartIso: aptStartToday(9, 30),
    scheduledEndIso: addMinutesIso(aptStartToday(9, 30), 20),
    status: "expired",
    arrivalStatus: "scheduled",
    paymentStatus: "review_required",
    totalFeePaisa: 300000,
    verifiedAmountPaisa: 150000,
    requiresPaymentResolution: true,
  });
  payments.push({
    id: id("pay"),
    appointmentId: expiredPartial.id,
    patientId: "pat-5",
    amountPaisa: 150000,
    verified: true,
    verifiedAt: addMinutesIso(nowIso, -120),
    verifiedByUserId: "user-admin",
    method: "cash",
    createdAt: addMinutesIso(nowIso, -120),
  });

  // More confirmed / completed / cancelled
  const slots = [
    { p: "pat-6", doc: "doc-fatima", svc: "svc-consult-gp", h: 9, m: 0, st: "confirmed" as const },
    { p: "pat-7", doc: "doc-ali", svc: "svc-consult-peds", h: 10, m: 30, st: "confirmed" as const },
    { p: "pat-8", doc: "doc-hassan", svc: "svc-consult-cardio", h: 14, m: 0, st: "confirmed" as const },
    { p: "pat-1", doc: "doc-sana", svc: "svc-skin-procedure", h: 15, m: 30, st: "awaiting_payment" as const },
    { p: "pat-2", doc: "doc-fatima", svc: "svc-consult-gp", h: 11, m: 30, st: "completed" as const },
    { p: "pat-3", doc: "doc-khan", svc: "svc-consult-ortho", h: 14, m: 30, st: "cancelled" as const },
    { p: "pat-4", doc: "doc-ahmed", svc: "svc-consult-cardio", h: 11, m: 0, st: "no_show" as const },
  ];

  for (const s of slots) {
    const ds = doctorServices.find(
      (d) => d.doctorId === s.doc && d.serviceId === s.svc,
    );
    const dur = ds?.durationMinutes ?? 30;
    const fee = ds?.feePaisa ?? 300000;
    const start = aptStartToday(s.h, s.m);
    pushApt({
      patientId: s.p,
      doctorId: s.doc,
      serviceId: s.svc,
      scheduledStartIso: start,
      scheduledEndIso: addMinutesIso(start, dur),
      status: s.st,
      arrivalStatus:
        s.st === "completed"
          ? "completed"
          : s.st === "no_show"
            ? "no_show"
            : s.st === "cancelled"
              ? "scheduled"
              : "scheduled",
      paymentStatus:
        s.st === "awaiting_payment"
          ? "unpaid"
          : s.st === "cancelled"
            ? "review_required"
            : "cleared",
      totalFeePaisa: fee,
      verifiedAmountPaisa: s.st === "awaiting_payment" ? 0 : fee,
      expiresAt:
        s.st === "awaiting_payment"
          ? addMinutesIso(nowIso, 50)
          : undefined,
      requiresRefundReview: s.st === "cancelled" ? true : undefined,
      cancelledAt: s.st === "cancelled" ? nowIso : undefined,
      completedAt: s.st === "completed" ? nowIso : undefined,
    });
  }

  // Tomorrow & yesterday appointments
  for (let i = 0; i < 8; i++) {
    const pat = patients[i % patients.length];
    const doc = doctors[i % doctors.length];
    const ds = doctorServices.find((d) => d.doctorId === doc.id)!;
    const start = aptStartOffsetDays(i % 2 === 0 ? 1 : -1, 10 + (i % 4), (i * 15) % 60);
    pushApt({
      patientId: pat.id,
      doctorId: doc.id,
      serviceId: ds.serviceId,
      scheduledStartIso: start,
      scheduledEndIso: addMinutesIso(start, ds.durationMinutes),
      status: i % 3 === 0 ? "confirmed" : "completed",
      arrivalStatus: "completed",
      paymentStatus: "cleared",
      totalFeePaisa: ds.feePaisa,
      verifiedAmountPaisa: ds.feePaisa,
    });
  }

  const paymentClaims: DemoState["paymentClaims"] = [
    {
      id: id("claim"),
      appointmentId: confirmed1.id,
      patientId: "pat-1",
      claimedAmountPaisa: 500000,
      status: "pending_review",
      submittedByUserId: "user-reception-sara",
      notes: "Patient sent screenshot; awaiting admin verification",
      createdAt: nowIso,
    },
  ];

  const callbacks: CallbackRequest[] = [
    {
      id: id("cb"),
      patientId: "pat-3",
      appointmentId: awaiting.id,
      phoneE164: "+923331234567",
      reason: "Payment not received — patient claims bank transfer sent",
      status: "pending",
      language: "ur",
      summary:
        "AI booked echo; patient asked how to confirm after transferring fees",
      notes: [],
      transcriptUnavailable: true,
      createdAt: addMinutesIso(nowIso, -180),
      updatedAt: addMinutesIso(nowIso, -180),
    },
    {
      id: id("cb"),
      patientId: "pat-5",
      phoneE164: "+923001112233",
      reason: "Orthopedic appointment reschedule",
      status: "assigned",
      assignedToUserId: "user-reception-sara",
      requestedDoctorId: "doc-khan",
      language: "en",
      summary: "Preferred afternoon slots next week",
      notes: [
        {
          id: id("cbn"),
          authorUserId: "user-reception-sara",
          body: "Will call back after checking Dr. Khan calendar",
          createdAt: addMinutesIso(nowIso, -60),
        },
      ],
      transcriptUnavailable: true,
      createdAt: addMinutesIso(nowIso, -240),
      updatedAt: addMinutesIso(nowIso, -60),
    },
    {
      id: id("cb"),
      patientId: "pat-2",
      appointmentId: confirmed2.id,
      phoneE164: "+923211234567",
      reason: "Insurance documentation for today's visit",
      status: "in_progress",
      assignedToUserId: "user-reception-sara",
      summary: "Needs stamped receipt for employer after checkup",
      notes: [
        {
          id: id("cbn"),
          authorUserId: "user-reception-sara",
          body: "Patient arrived; collecting employer form at reception desk",
          createdAt: addMinutesIso(nowIso, -30),
        },
      ],
      transcriptUnavailable: true,
      createdAt: addMinutesIso(nowIso, -90),
      updatedAt: addMinutesIso(nowIso, -30),
    },
    {
      id: id("cb"),
      patientId: "pat-7",
      phoneE164: "+923009998877",
      reason: "Pediatric vaccination query",
      status: "completed",
      assignedToUserId: "user-reception-sara",
      summary: "Directed to walk-in immunization desk",
      notes: [],
      transcriptUnavailable: true,
      createdAt: addMinutesIso(nowIso, -1440),
      updatedAt: addMinutesIso(nowIso, -1200),
    },
    {
      id: id("cb"),
      patientId: "pat-8",
      phoneE164: "+923221122334",
      reason: "Missed call return",
      status: "unable_to_reach",
      summary: "Three attempts — no answer",
      notes: [],
      transcriptUnavailable: true,
      createdAt: addMinutesIso(nowIso, -720),
      updatedAt: addMinutesIso(nowIso, -600),
    },
  ];

  const waBookedApt = pushApt({
    patientId: "pat-8",
    doctorId: "doc-ahmed",
    serviceId: "svc-consult-cardio",
    scheduledStartIso: aptStartOffsetDays(2, 11, 0),
    scheduledEndIso: addMinutesIso(aptStartOffsetDays(2, 11, 0), 30),
    status: "awaiting_payment",
    arrivalStatus: "scheduled",
    paymentStatus: "unpaid",
    totalFeePaisa: 500000,
    verifiedAmountPaisa: 0,
    expiresAt: addMinutesIso(nowIso, 55),
  });

  const whatsappConversations: DemoState["whatsappConversations"] = [
    {
      id: id("wa"),
      patientName: "Sadia Hussain",
      phoneE164: "+923221122334",
      phoneNational: "03221122334",
      language: "en",
      status: "handed_off",
      patientId: "pat-8",
      appointmentId: waBookedApt.id,
      requestedDoctorId: "doc-ahmed",
      requestedServiceId: "svc-consult-cardio",
      scheduledStartIso: waBookedApt.scheduledStartIso,
      bookingOutcome: "provisional_reservation",
      summary:
        "AI held a cardiology slot, then handed off to a human for payment details.",
      handedOffToAdmin: true,
      handoffReason: "payment_details",
      scriptProgress: 6,
      scriptTurns: [
        {
          role: "patient",
          body: "Hello, can I book Dr. Taimur for cardiology via WhatsApp?",
        },
        {
          role: "agent",
          body: "Yes — I can place a provisional hold. Checking availability…",
        },
        {
          role: "agent",
          body: "Provisional slot held. A staff member will share payment details.",
          createsBooking: true,
        },
        {
          role: "system",
          body: "Booking linked · awaiting payment (demo).",
        },
        {
          role: "agent",
          body: "Connecting you with staff for payment instructions.",
          handOff: true,
        },
        {
          role: "system",
          body: "AI handed off · waiting for human takeover (payment details).",
        },
      ],
      createdAt: addMinutesIso(nowIso, -90),
      updatedAt: addMinutesIso(nowIso, -70),
      messages: [
        {
          id: id("wam"),
          role: "patient",
          body: "Hello, can I book Dr. Taimur for cardiology via WhatsApp?",
          createdAt: addMinutesIso(nowIso, -90),
        },
        {
          id: id("wam"),
          role: "agent",
          body: "Yes — I can place a provisional hold. Checking availability…",
          createdAt: addMinutesIso(nowIso, -88),
        },
        {
          id: id("wam"),
          role: "agent",
          body: "Provisional slot held. A staff member will share payment details next — I can’t verify payments.",
          createdAt: addMinutesIso(nowIso, -75),
        },
        {
          id: id("wam"),
          role: "system",
          body: "Booking linked · awaiting payment (demo).",
          createdAt: addMinutesIso(nowIso, -72),
        },
        {
          id: id("wam"),
          role: "agent",
          body: "Connecting you with a hospital staff member for payment instructions now.",
          createdAt: addMinutesIso(nowIso, -71),
        },
        {
          id: id("wam"),
          role: "system",
          body: "AI handed off · waiting for human takeover (payment details).",
          createdAt: addMinutesIso(nowIso, -70),
        },
      ],
    },
    {
      id: id("wa"),
      patientName: "Omar Siddiqui",
      phoneE164: "+923451112233",
      phoneNational: "03451112233",
      language: "ur",
      status: "handed_off",
      requestedDoctorId: "doc-fatima",
      requestedServiceId: "svc-consult-gp",
      bookingOutcome: "callback_requested",
      summary:
        "Patient preferred a human callback from WhatsApp. AI handed off without booking.",
      handedOffToAdmin: true,
      handoffReason: "callback",
      scriptProgress: 3,
      scriptTurns: [
        {
          role: "patient",
          body: "GP slot chahiye — pehle koi staff call kare?",
        },
        {
          role: "agent",
          body: "Theek hai — booking hold nahi ki. Staff se connect kar raha hoon.",
          handOff: true,
        },
        {
          role: "system",
          body: "AI handed off · waiting for human takeover (callback).",
        },
      ],
      createdAt: addMinutesIso(nowIso, -180),
      updatedAt: addMinutesIso(nowIso, -160),
      messages: [
        {
          id: id("wam"),
          role: "patient",
          body: "GP slot chahiye — pehle koi staff call kare?",
          createdAt: addMinutesIso(nowIso, -180),
        },
        {
          id: id("wam"),
          role: "agent",
          body: "Theek hai — booking hold nahi ki. Ab staff member se connect kar raha hoon.",
          createdAt: addMinutesIso(nowIso, -165),
        },
        {
          id: id("wam"),
          role: "system",
          body: "AI handed off · waiting for human takeover (callback).",
          createdAt: addMinutesIso(nowIso, -160),
        },
      ],
    },
  ];

  const callRecords: DemoState["callRecords"] = [
    {
      id: id("call"),
      patientId: "pat-3",
      appointmentId: awaiting.id,
      callerName: "Ayesha Riaz",
      callerNumber: "0300-1112233",
      direction: "inbound",
      startedAt: addMinutesIso(nowIso, -200),
      endedAt: addMinutesIso(nowIso, -195),
      durationSeconds: 300,
      language: "ur",
      requestedDoctorId: "doc-hassan",
      requestedServiceId: "svc-echo",
      bookingOutcome: "provisional_reservation",
      forwardedToAdmin: false,
      patientTranscript:
        "Assalam o alaikum — mujhe echocardiography ke liye booking chahiye. Payment kaise confirm hogi?",
      aiTranscript:
        "Wa alaikum assalam. Maine Dr. Hassan Malik ke saath provisional echo slot hold ki hai. Confirmation Admin payment verify ke baad hogi (demo).",
      summary:
        "AI receptionist reserved echocardiography. Patient asked about payment channels and confirmation timing. Provisional hold explained; human payment verification required.",
    },
    {
      id: id("call"),
      patientId: "pat-1",
      appointmentId: confirmed1.id,
      callerName: "Bilal Ahmed",
      callerNumber: "0321-4455667",
      direction: "inbound",
      startedAt: addMinutesIso(nowIso, -100),
      endedAt: addMinutesIso(nowIso, -97),
      durationSeconds: 180,
      language: "en",
      transferOutcome: "failed",
      requestedDoctorId: "doc-ahmed",
      requestedServiceId: "svc-consult-cardio",
      bookingOutcome: "confirmed",
      forwardedToAdmin: true,
      patientTranscript:
        "My cardio consult is today at 10. Can you transfer me to ask about my ECG results?",
      aiTranscript:
        "Your booking is already confirmed. I’m attempting a human transfer for the clinical question — transfer destination is not configured in this demo.",
      summary:
        "Patient confirmed cardio consult for today 10:00. Requested human transfer for a clinical question — transfer failed (destination not configured). Booking remained confirmed. Forwarded clinical follow-up note to Admin.",
    },
    {
      id: id("call"),
      patientId: "pat-2",
      appointmentId: confirmed2.id,
      callerName: "Sana Khan",
      callerNumber: "0333-7788990",
      direction: "inbound",
      startedAt: addMinutesIso(nowIso, -150),
      endedAt: addMinutesIso(nowIso, -146),
      durationSeconds: 240,
      language: "en",
      requestedDoctorId: "doc-khan",
      requestedServiceId: "svc-consult-ortho",
      bookingOutcome: "confirmed",
      forwardedToAdmin: false,
      patientTranscript:
        "I already paid for ortho. Can I get an employer insurance receipt after today’s visit?",
      aiTranscript:
        "Yes — your appointment is confirmed. I’ve noted the insurance receipt request for front-desk Admin follow-up after the visit.",
      summary:
        "Orthopedic consult booked and paid. Patient asked for an employer insurance receipt after today's visit.",
    },
    {
      id: id("call"),
      callerName: "Omar Farooq",
      callerNumber: "0345-5566778",
      direction: "inbound",
      startedAt: addMinutesIso(nowIso, -45),
      endedAt: addMinutesIso(nowIso, -42),
      durationSeconds: 165,
      language: "en",
      requestedDoctorId: "doc-fatima",
      requestedServiceId: "svc-consult-gp",
      bookingOutcome: "callback_requested",
      forwardedToAdmin: true,
      patientTranscript:
        "I need a GP slot this week but I’m not sure which insurance panel I’m on. Can someone call me back?",
      aiTranscript:
        "I can’t confirm insurance panels in this demo. I’ve created a callback request and forwarded it to Admin for a human follow-up.",
      summary:
        "Caller requested GP availability but insurance panel was unclear. No booking created. Callback forwarded to Admin.",
    },
    {
      id: id("call"),
      callerName: "Unknown caller",
      callerNumber: "0312-9001122",
      direction: "inbound",
      startedAt: addMinutesIso(nowIso, -30),
      endedAt: addMinutesIso(nowIso, -29),
      durationSeconds: 48,
      language: "ur",
      bookingOutcome: "abandoned",
      forwardedToAdmin: false,
      patientTranscript: "Hello? … (silence)",
      aiTranscript:
        "Assalam o alaikum, Life Care International Hospital AI receptionist. Kya main aap ki madad kar sakti hoon?",
      summary:
        "Short abandoned inbound call — no patient match, no booking, no callback.",
    },
    {
      id: id("call"),
      patientId: "pat-8",
      callerName: "Hassan Ali",
      callerNumber: "0322-1122334",
      direction: "inbound",
      startedAt: addMinutesIso(nowIso, -720),
      endedAt: addMinutesIso(nowIso, -716),
      durationSeconds: 210,
      language: "en",
      requestedDoctorId: "doc-sana",
      requestedServiceId: "svc-consult-derm",
      bookingOutcome: "forwarded_to_admin",
      forwardedToAdmin: true,
      patientTranscript:
        "I missed a dermatology callback earlier. Please have Admin call me about evening slots.",
      aiTranscript:
        "Noted. No new provisional hold created. I’ve forwarded your callback preference to Admin.",
      summary:
        "Returning caller without a new booking. Request forwarded to Admin callback queue.",
    },
  ];

  notifications.push({
    id: id("notif"),
    kind: "appointment_confirmed",
    appointmentId: confirmed1.id,
    patientId: "pat-1",
    channel: "whatsapp",
    locale: "en",
    body: "Appointment confirmed (demo)",
    status: "failed_simulated",
    errorMessage: "Simulated gateway timeout",
    createdAt: addMinutesIso(nowIso, -50),
  });

  const activityEvents: DemoState["activityEvents"] = [
    {
      id: id("act"),
      type: "appointment_created",
      actorUserId: "user-admin",
      message: "Seed data initialized for demo",
      createdAt: nowIso,
    },
    {
      id: id("act"),
      type: "payment_verified",
      actorUserId: "user-admin",
      message: `Verified payment for appointment ${confirmed1.id}`,
      entityType: "appointment",
      entityId: confirmed1.id,
      createdAt: nowIso,
    },
  ];

  const extraUsers: User[] = [
    {
      id: "user-doc-fatima",
      username: "doctor.fatima",
      displayName: "Dr. Fatima Noor",
      role: "doctor",
      doctorId: "doc-fatima",
      permissions: ["view_dashboard", "view_own_schedule", "update_arrival", "view_activity"],
      active: true,
      password: "doctor123",
    },
    {
      id: "user-doc-ali",
      username: "doctor.sohaib",
      displayName: "Dr. Sohaib",
      role: "doctor",
      doctorId: "doc-ali",
      permissions: ["view_dashboard", "view_own_schedule", "update_arrival", "view_activity"],
      active: true,
      password: "doctor123",
    },
    {
      id: "user-doc-sana",
      username: "doctor.sana",
      displayName: "Dr. Sana Iqbal",
      role: "doctor",
      doctorId: "doc-sana",
      permissions: ["view_dashboard", "view_own_schedule", "update_arrival", "view_activity"],
      active: true,
      password: "doctor123",
    },
    {
      id: "user-doc-hassan",
      username: "doctor.hassan",
      displayName: "Dr. Hassan Malik",
      role: "doctor",
      doctorId: "doc-hassan",
      permissions: ["view_dashboard", "view_own_schedule", "update_arrival", "view_activity"],
      active: true,
      password: "doctor123",
    },
    {
      id: "user-doc-bilal",
      username: "doctor.hamza",
      displayName: "Dr. Hamza",
      role: "doctor",
      doctorId: "doc-bilal",
      permissions: ["view_dashboard", "view_own_schedule", "update_arrival", "view_activity"],
      active: true,
      password: "doctor123",
    },
  ];

  const users = [...staffUsersFromDemoAccounts(), ...extraUsers];

  return {
    schemaVersion: SCHEMA_VERSION,
    departments,
    services,
    doctors,
    doctorServices,
    workingHours,
    breakPeriods,
    leavePeriods: [],
    blockedPeriods: [],
    patients,
    users,
    appointments,
    payments,
    paymentClaims,
    callbacks,
    callRecords,
    whatsappConversations,
    notifications,
    activityEvents,
    hospitalSettings: {
      hospitalName: "Life Care International Hospital",
      locationPlaceholder: "Islamabad — address placeholder for demo",
      timezone: "Asia/Karachi",
      transferPhoneNumber: null,
      clinicalEscalationContact: null,
      aiChangePolicy: "pending_configuration",
      defaultReservationExpiryMinutes: 60,
      aiReceptionEnabled: true,
      aiDefaultLanguage: "en",
      aiGreetingNote:
        "Life Care International Hospital AI receptionist (demo).",
    },
    processedClientRequestIds: [],
  };
}

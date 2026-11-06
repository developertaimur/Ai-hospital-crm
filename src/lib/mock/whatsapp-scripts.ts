import type { BookingOutcome, DemoLocale, WhatsAppHandoffReason } from "@/lib/types";

export interface WhatsAppScriptTurn {
  role: "patient" | "agent" | "system";
  body: string;
  /** When true, this turn finalizes a provisional reservation. */
  createsBooking?: boolean;
  /** When true, AI stops and waits for a real human. */
  handOff?: boolean;
  handoffReason?: WhatsAppHandoffReason;
}

export interface WhatsAppBookingScript {
  patientName: string;
  phoneNational: string;
  language: DemoLocale;
  requestedDoctorId?: string;
  requestedServiceId?: string;
  bookingOutcome: BookingOutcome;
  summary: string;
  turns: WhatsAppScriptTurn[];
}

export const WHATSAPP_BOOKING_SCRIPTS: WhatsAppBookingScript[] = [
  {
    patientName: "Hina Raza",
    phoneNational: "03005551234",
    language: "en",
    requestedDoctorId: "doc-ahmed",
    requestedServiceId: "svc-consult-cardio",
    bookingOutcome: "provisional_reservation",
    summary:
      "AI held a cardiology slot, then handed off to a human for payment details.",
    turns: [
      {
        role: "patient",
        body: "Assalam o Alaikum — I need a cardiology appointment this week please.",
      },
      {
        role: "agent",
        body: "Wa Alaikum Assalam. I’m the Life Care AI assistant on WhatsApp. I can hold a slot. Which doctor do you prefer?",
      },
      {
        role: "patient",
        body: "Dr. Muhammad Taimur for a cardiology consultation.",
      },
      {
        role: "agent",
        body: "Checking Dr. Muhammad Taimur’s open demo slots…",
      },
      {
        role: "agent",
        body: "I found an available slot and placed a provisional hold. Next, a staff member will share payment details — I can’t verify payments myself.",
        createsBooking: true,
      },
      {
        role: "system",
        body: "Provisional reservation created · awaiting payment (demo).",
      },
      {
        role: "agent",
        body: "Connecting you with a hospital staff member for payment instructions now.",
        handOff: true,
        handoffReason: "payment_details",
      },
      {
        role: "system",
        body: "AI handed off · waiting for human takeover (payment details).",
      },
    ],
  },
  {
    patientName: "Bilal Qureshi",
    phoneNational: "03451239876",
    language: "ur",
    requestedDoctorId: "doc-fatima",
    requestedServiceId: "svc-consult-gp",
    bookingOutcome: "callback_requested",
    summary:
      "Urdu WhatsApp chat — patient asked for a human callback. AI handed off without booking.",
    turns: [
      {
        role: "patient",
        body: "Salam, mujhe GP appointment chahiye lekin pehle koi call kar de.",
      },
      {
        role: "agent",
        body: "Salam! Life Care AI WhatsApp assistant. Samajh gaya — booking hold nahi kar raha. Ab staff member se connect kar raha hoon.",
        handOff: true,
        handoffReason: "callback",
      },
      {
        role: "system",
        body: "AI handed off · waiting for human takeover (callback).",
      },
    ],
  },
  {
    patientName: "Maryam Aziz",
    phoneNational: "03117894561",
    language: "en",
    requestedDoctorId: "doc-sana",
    requestedServiceId: "svc-consult-derm",
    bookingOutcome: "provisional_reservation",
    summary:
      "Dermatology provisional hold via WhatsApp; AI handed off for human payment guidance.",
    turns: [
      {
        role: "patient",
        body: "Hi, I’d like a dermatology consult with Dr. Sana this week.",
      },
      {
        role: "agent",
        body: "Sure — checking Dr. Sana Iqbal’s dermatology slots…",
      },
      {
        role: "patient",
        body: "Afternoon would be better if possible.",
      },
      {
        role: "agent",
        body: "Holding an afternoon provisional slot now. A staff member will continue with payment details.",
        createsBooking: true,
      },
      {
        role: "system",
        body: "Provisional reservation created · awaiting payment (demo).",
      },
      {
        role: "agent",
        body: "Transferring you to a real staff member for bank/JazzCash payment instructions.",
        handOff: true,
        handoffReason: "payment_details",
      },
      {
        role: "system",
        body: "AI handed off · waiting for human takeover (payment details).",
      },
    ],
  },
];

export const PATIENT_FOLLOWUP_REPLIES = [
  "Okay, please share the payment details.",
  "I can pay via JazzCash — what’s the number?",
  "Received. I’ll transfer and send the screenshot.",
  "How much do I need to pay to confirm?",
];

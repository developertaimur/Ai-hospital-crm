/**
 * Notification message templates (English + Urdu).
 * Urdu messages should be rendered RTL in the UI (dir="rtl" on container).
 */

export type NotificationTemplateKey =
  | "provisional"
  | "confirmation"
  | "reschedule"
  | "cancel"
  | "expiry";

export interface TemplateVars {
  patientName: string;
  doctorName: string;
  serviceName: string;
  dateTimeFormatted: string;
  hospitalName: string;
  amountFormatted?: string;
}

const EN: Record<NotificationTemplateKey, (v: TemplateVars) => string> = {
  provisional: (v) =>
    `${v.hospitalName}: Hi ${v.patientName}, your ${v.serviceName} with ${v.doctorName} on ${v.dateTimeFormatted} is reserved pending payment${v.amountFormatted ? ` (${v.amountFormatted})` : ""}. Complete payment within 1 hour to confirm.`,
  confirmation: (v) =>
    `${v.hospitalName}: Confirmed — ${v.serviceName} with ${v.doctorName} on ${v.dateTimeFormatted}. Please arrive 10 minutes early.`,
  reschedule: (v) =>
    `${v.hospitalName}: Your appointment for ${v.serviceName} with ${v.doctorName} has been rescheduled to ${v.dateTimeFormatted}.`,
  cancel: (v) =>
    `${v.hospitalName}: Your appointment for ${v.serviceName} with ${v.doctorName} on ${v.dateTimeFormatted} has been cancelled. Contact reception if you have questions.`,
  expiry: (v) =>
    `${v.hospitalName}: Your reservation for ${v.serviceName} on ${v.dateTimeFormatted} expired due to unpaid balance. Contact us to rebook.`,
};

/** Urdu — display with dir="rtl" */
const UR: Record<NotificationTemplateKey, (v: TemplateVars) => string> = {
  provisional: (v) =>
    `${v.hospitalName}: السلام علیکم ${v.patientName}، ${v.doctorName} کے ساتھ ${v.serviceName} ${v.dateTimeFormatted} کو محفوظ ہے۔ ادائیگی 1 گھنٹے میں مکمل کریں۔`,
  confirmation: (v) =>
    `${v.hospitalName}: تصدیق — ${v.serviceName}، ${v.doctorName}، ${v.dateTimeFormatted}۔ براہ کرم 10 منٹ پہلے پہنچیں۔`,
  reschedule: (v) =>
    `${v.hospitalName}: آپ کی ${v.serviceName} کی اپائنٹمنٹ ${v.dateTimeFormatted} پر منتقل کر دی گئی ہے (${v.doctorName})۔`,
  cancel: (v) =>
    `${v.hospitalName}: ${v.serviceName} کی اپائنٹمنٹ ${v.dateTimeFormatted} منسوخ کر دی گئی۔`,
  expiry: (v) =>
    `${v.hospitalName}: ${v.serviceName} کی بکنگ ${v.dateTimeFormatted} غیر ادائیگی کی وجہ سے ختم ہو گئی۔ دوبارہ بکنگ کے لیے رابطہ کریں۔`,
};

export function renderNotificationTemplate(
  locale: "en" | "ur",
  key: NotificationTemplateKey,
  vars: TemplateVars,
): string {
  const map = locale === "ur" ? UR : EN;
  return map[key](vars);
}

export const URDU_RTL_NOTE =
  "Urdu notifications should use dir=\"rtl\" and an appropriate Urdu font in the UI.";

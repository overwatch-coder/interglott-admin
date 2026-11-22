
export type FormNotificationType =
  | "tutor_booking"
  | "learner_signup"
  | "contact_ticket"
  | "intake_lead"
  | "call_booking";

export interface AdminNotificationPayload {
  form_type: FormNotificationType;
  sender_name?: string;
  sender_email?: string;
  details: Record<string, unknown>;
  custom_subject?: string;
}

export interface AdminEmailLogItem {
  id: string;
  form_type: FormNotificationType;
  recipient_email: string;
  subject: string;
  details: Record<string, unknown>;
  status: "sent" | "logged" | "failed";
  created_at: string;
}

export interface NotificationResult {
  emailSent: boolean;
  recorded: boolean;
}

export async function notifyAdminOnFormSubmission(
  payload: AdminNotificationPayload
): Promise<NotificationResult> {
  try {
    return await sendAdminNotification(payload);
  } catch (e) {
    console.warn("Failed to dispatch admin notification:", e);
    return { emailSent: false, recorded: false };
  }
}
import { sendAdminNotification } from "@/app/actions/adminNotifications";

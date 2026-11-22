import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  notifyAdminOnFormSubmission,
  AdminEmailLogItem,
  FormNotificationType,
} from "@/services/adminNotificationService";
import {
  Mail,
  X,
  Send,
  RefreshCw,
  CheckCircle,
  Clock,
  Filter,
  Shield,
  Bell,
  Settings,
} from "lucide-react";

interface AdminEmailLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminEmailLogsModal({ isOpen, onClose }: AdminEmailLogsModalProps) {
  const [adminEmail, setAdminEmailInput] = useState<string>("");
  const [logs, setLogs] = useState<AdminEmailLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  const isMountedRef = React.useRef(true);

  const loadEmailLogs = async () => {
    if (isMountedRef.current) setLoading(true);
    try {
      const response = await fetch("/api/admin-notifications");
      if (!response.ok) throw new Error("Unable to load notification logs");
      const body: {
        adminEmail?: string;
        notifications?: Array<{
          id: string;
          form_type: FormNotificationType;
          recipient_email: string;
          subject: string;
          payload?: Record<string, unknown>;
          status?: AdminEmailLogItem["status"];
          created_at: string;
        }>;
      } = await response.json();
      if (isMountedRef.current && body.adminEmail) setAdminEmailInput(body.adminEmail);

      const dbLogs: AdminEmailLogItem[] = (body.notifications || []).map((row) => ({
        id: row.id,
        form_type: row.form_type,
        recipient_email: row.recipient_email,
        subject: row.subject,
        details: row.payload || {},
        status: row.status || "sent",
        created_at: row.created_at,
      }));

      if (isMountedRef.current) setLogs(dbLogs);
    } catch (e) {
      console.error("Failed to load email notification logs:", e);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      loadEmailLogs();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [isOpen]);

  const handleSendTestNotification = async () => {
    setIsSendingTest(true);
    try {
      const result = await notifyAdminOnFormSubmission({
        form_type: "tutor_booking",
        sender_name: "Test System",
        sender_email: "test@interglott.com",
        custom_subject: `[TEST ALERT] Device Notification Test - ${new Date().toLocaleTimeString()}`,
        details: {
          "Test Event": "Admin Email Device Alert Check",
          "Timestamp": new Date().toLocaleString(),
          "Recipient Email": adminEmail,
          "Status": "System Operational ✅",
        },
      });
      if (result.emailSent) {
        toast.success(`Test notification sent to ${adminEmail}.`);
      } else if (result.recorded) {
        toast.info("The test was logged, but email delivery is not configured on the server.");
      } else {
        toast.error("The test notification could not be sent or logged.");
      }
      await loadEmailLogs();
    } catch (e) {
      toast.error("Failed to send test email notification.");
    } finally {
      setIsSendingTest(false);
    }
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter(
    (l) => filterType === "all" || l.form_type === filterType
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in text-foreground">
      <div className="w-full max-w-2xl bg-card h-full overflow-y-auto border-l border-border p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl text-foreground">
                Admin Email Device Notifications
              </h2>
              <p className="text-xs text-muted-foreground">
                Real-time email alerts sent to the admin device on user form submissions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SETTINGS CARD */}
        <div className="p-5 rounded-2xl bg-secondary/40 border border-border/80 space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Settings className="h-4 w-4" />
            <span>Notification Recipient</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Admin Notification Email (Receives all form submissions):
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={adminEmail}
                readOnly
                placeholder="admin@thefrenchpathway.com"
                className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <p className="text-xs text-muted-foreground">Set with the server-only ADMIN_NOTIFICATION_EMAIL environment variable.</p>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Verify device email delivery:
            </span>
            <button
              type="button"
              onClick={handleSendTestNotification}
              disabled={isSendingTest}
              className="px-3.5 py-1.5 rounded-xl border border-primary/30 text-primary bg-primary/5 font-bold text-xs hover:bg-primary/10 transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className={`h-3.5 w-3.5 ${isSendingTest ? "animate-pulse" : ""}`} />
              <span>{isSendingTest ? "Sending Test..." : "Send Test Email Alert"}</span>
            </button>
          </div>
        </div>

        {/* LOGS HEADER & FILTER */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:outline-none"
            >
              <option value="all">All Form Notifications ({logs.length})</option>
              <option value="tutor_booking">Tutor Bookings</option>
              <option value="learner_signup">Learner Signups</option>
              <option value="contact_ticket">Contact Tickets</option>
              <option value="intake_lead">Intake Leads</option>
              <option value="call_booking">Clarity Calls</option>
            </select>
          </div>

          <button
            type="button"
            onClick={loadEmailLogs}
            className="p-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-all flex items-center gap-1 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* LOGS AUDIT TRAIL */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              <span>Loading notification logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-border rounded-2xl bg-secondary/20">
              No email notifications recorded for this category yet.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-card border border-border/80 space-y-2 text-xs shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase tracking-wider">
                    {log.form_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="font-bold text-foreground text-sm">{log.subject}</div>

                <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 space-y-1 font-mono text-[11px] text-muted-foreground">
                  <div><strong>To:</strong> {log.recipient_email}</div>
                  {Object.entries(log.details || {}).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-foreground font-semibold">{k}:</span>{" "}
                      {Array.isArray(v) ? v.join(", ") : String(v ?? "")}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  {log.status === "sent" ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle className="h-3.5 w-3.5" /> Email Sent
                    </span>
                  ) : log.status === "failed" ? (
                    <span className="inline-flex items-center gap-1 text-destructive font-bold">
                      <X className="h-3.5 w-3.5" /> Email Delivery Failed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                      <Clock className="h-3.5 w-3.5" /> Logged Only
                    </span>
                  )}
                  <span className="text-muted-foreground">Status: {log.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

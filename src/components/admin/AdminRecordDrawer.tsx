"use client";

import type { ReactNode } from "react";
import {
  Award,
  Building2,
  Calendar,
  Clock,
  Globe,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import type { ContactTicketItem, LeadItem } from "@/app/admin/AdminOverviewClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type InspectedRecord =
  | { type: "ticket"; data: ContactTicketItem }
  | { type: "lead"; data: LeadItem }
  | { type: "booking"; data: LeadItem }
  | { type: "diagnostic"; data: LeadItem };

export function formatLabel(value?: string | null, fallback = "General") {
  if (!value) return fallback;
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value?: ReactNode;
  icon?: ReactNode;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="break-words text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-border/80 bg-muted/25 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function AdminRecordDrawer({
  record,
  onClose,
  onDelete,
}: {
  record: InspectedRecord | null;
  onClose: () => void;
  onDelete?: (record: InspectedRecord) => void;
}) {
  const renderBody = () => {
    if (!record) return null;

    if (record.type === "ticket") {
      const t = record.data;
      const messages = [
        { label: "Message", text: t.general_message },
        { label: "Support description", text: t.support_description },
        { label: "Partnership details", text: t.partnership_details },
        { label: "Additional notes", text: t.something_else },
      ].filter((item): item is { label: string; text: string } => Boolean(item.text?.trim()));

      return (
        <div className="space-y-4">
          <Section title="Contact information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Email"
                icon={<Mail className="size-3.5" />}
                value={
                  <a href={`mailto:${t.email}`} className="text-primary hover:underline">
                    {t.email}
                  </a>
                }
              />
              <Field
                label="Phone"
                icon={<Phone className="size-3.5" />}
                value={t.phone || "Not provided"}
              />
              <Field
                label="Organization"
                icon={<Building2 className="size-3.5" />}
                value={t.org_name}
              />
              <Field
                label="Website"
                icon={<Globe className="size-3.5" />}
                value={t.org_website}
              />
              <Field label="Referral source" value={t.referral_source} />
              <Field
                label="Submitted"
                icon={<Clock className="size-3.5" />}
                value={formatDateTime(t.created_at)}
              />
            </div>
          </Section>

          <Section title="Inquiry details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Intent" value={formatLabel(t.path)} />
              <Field label="Category" value={t.support_category || "General"} />
              <Field label="Subject" value={t.subject || "No subject"} />
              {t.attachment_name && (
                <Field
                  label="Attachment"
                  icon={<Paperclip className="size-3.5" />}
                  value={t.attachment_name}
                />
              )}
            </div>
          </Section>

          {messages.length > 0 && (
            <Section title="Submission message">
              <div className="space-y-3">
                {messages.map((item) => (
                  <div key={item.label} className="space-y-1">
                    {messages.length > 1 && (
                      <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
                    )}
                    <p className="whitespace-pre-wrap rounded-lg border border-border/70 bg-card p-3.5 text-sm leading-relaxed text-foreground">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      );
    }

    if (record.type === "booking") {
      const b = record.data;
      const fd = b.form_data as Record<string, unknown>;
      const str = (key: string) => (typeof fd[key] === "string" && fd[key] ? (fd[key] as string) : undefined);
      const arr = (key: string) => (Array.isArray(fd[key]) ? (fd[key] as string[]).filter(Boolean) : []);
      const slot = str("selected_date")
        ? `${str("selected_date")}${str("selected_time") ? ` · ${str("selected_time")}` : ""}`
        : str("preferred_schedule") || str("preferred_time") || "Flexible";
      const focusAreas = arr("focus_areas");
      const preferredDays = arr("preferred_days");
      const notes = str("special_needs") || str("notes") || str("message");

      return (
        <div className="space-y-4">
          <Section title="Applicant details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Email"
                icon={<Mail className="size-3.5" />}
                value={
                  str("email") ? (
                    <a href={`mailto:${str("email")}`} className="text-primary hover:underline">
                      {str("email")}
                    </a>
                  ) : "Not provided"
                }
              />
              <Field
                label="Phone"
                icon={<Phone className="size-3.5" />}
                value={str("phone") || "Not provided"}
              />
              <Field
                label="Country"
                icon={<Globe className="size-3.5" />}
                value={str("country_of_residence") || str("country")}
              />
              <Field
                label="Timezone"
                icon={<Clock className="size-3.5" />}
                value={str("timezone")}
              />
            </div>
          </Section>

          <Section title="Booking request">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Program / Language"
                value={str("target_program") || str("language_to_learn") || b.course_selected || "General"}
              />
              <Field
                label="Goal"
                value={str("primary_goal") || str("goal")}
              />
              <Field
                label="Requested slot"
                icon={<Calendar className="size-3.5" />}
                value={slot}
              />
              <Field label="Specific tutor" value={str("specific_tutor")} />
              <Field label="Session format" value={str("session_format")} />
              <Field label="Current level" value={str("current_level")} />
              <Field label="Budget / hour" value={str("budget_per_hour")} />
              <Field label="Frequency" value={str("frequency")} />
              <Field label="Status" value={formatLabel(b.status, "New")} />
              <Field label="Submitted" value={formatDateTime(b.created_at)} />
            </div>
            {preferredDays.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-medium text-muted-foreground">Preferred days</div>
                <div className="flex flex-wrap gap-1.5">
                  {preferredDays.map((day) => (
                    <Badge key={day} variant="secondary">{day}</Badge>
                  ))}
                </div>
              </div>
            )}
            {focusAreas.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-medium text-muted-foreground">Focus areas</div>
                <div className="flex flex-wrap gap-1.5">
                  {focusAreas.map((area) => (
                    <Badge key={area} variant="outline">{area}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {notes && (
            <Section title="Additional notes">
              <p className="whitespace-pre-wrap rounded-lg border border-border/70 bg-card p-3.5 text-sm leading-relaxed text-foreground">
                {notes}
              </p>
            </Section>
          )}
        </div>
      );
    }

    if (record.type === "diagnostic") {
      const d = record.data;
      const fd = d.form_data as Record<string, unknown>;
      const str = (key: string) => (fd[key] !== undefined && fd[key] !== null && fd[key] !== "" ? String(fd[key]) : undefined);

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/80 bg-muted/25 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CEFR Level</div>
              <div className="mt-1 font-display text-xl font-bold text-primary">
                {str("estimated_cefr_level") || "N/A"}
              </div>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/25 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">NCLC</div>
              <div className="mt-1 font-display text-xl font-bold text-emerald-700">
                {str("canada_nclc_equivalent") || "N/A"}
              </div>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/25 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Score</div>
              <div className="mt-1 font-display text-xl font-bold tabular-nums text-foreground">
                {str("weighted_score") || (str("percentage_score") ? `${str("percentage_score")}%` : "N/A")}
              </div>
            </div>
          </div>

          <Section title="Candidate profile">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Email"
                icon={<Mail className="size-3.5" />}
                value={
                  str("email") ? (
                    <a href={`mailto:${str("email")}`} className="text-primary hover:underline">
                      {str("email")}
                    </a>
                  ) : "Not provided"
                }
              />
              <Field label="Phone" icon={<Phone className="size-3.5" />} value={str("phone") || "Not provided"} />
              <Field label="Destination goal" icon={<Award className="size-3.5" />} value={str("destination_goal") || "General"} />
              <Field label="Recommended track" value={d.course_selected ? formatLabel(d.course_selected) : str("recommended_course")} />
              <Field label="Status" value={formatLabel(d.status, "New")} />
              <Field label="Completed" icon={<Clock className="size-3.5" />} value={formatDateTime(d.created_at)} />
            </div>
          </Section>
        </div>
      );
    }

    // Intake survey lead
    const lead = record.data;
    const fd = lead.form_data as Record<string, unknown>;
    const demo = (fd.demographics ?? {}) as Record<string, unknown>;
    const bg = (fd.frenchBackground ?? {}) as Record<string, unknown>;
    const specific = (fd.courseSpecific ?? {}) as Record<string, unknown>;
    const success = (fd.successMetrics ?? {}) as Record<string, unknown>;
    const modality = (fd.modality ?? {}) as Record<string, unknown>;
    const s = (obj: Record<string, unknown>, key: string) =>
      typeof obj[key] === "string" && obj[key] ? (obj[key] as string) : undefined;
    const email = s(demo, "email") || s(fd, "email");
    const phone = s(demo, "phoneNumber") || s(fd, "phone");

    return (
      <div className="space-y-4">
        <Section title="Demographics & contact">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Email"
              icon={<Mail className="size-3.5" />}
              value={email ? <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a> : "Not provided"}
            />
            <Field label="Phone" icon={<Phone className="size-3.5" />} value={phone || "Not provided"} />
            <Field label="Country" icon={<Globe className="size-3.5" />} value={s(demo, "country")} />
            <Field label="Timezone" icon={<Clock className="size-3.5" />} value={s(demo, "timeZone")} />
            <Field label="Occupation" icon={<User className="size-3.5" />} value={s(demo, "occupation")} />
            <Field label="Submitted" value={formatDateTime(lead.created_at)} />
          </div>
        </Section>

        <Section title="Course & proficiency">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Course track" value={formatLabel(lead.course_selected)} />
            <Field label="Current level" value={s(bg, "currentLevel") || "Not set"} />
            <Field label="Target CLB" value={s(specific, "targetCLB")} />
            <Field label="Exam timeline" value={s(specific, "examTimeline")} />
            <Field label="Status" value={formatLabel(lead.status, "New")} />
          </div>
        </Section>

        {(s(success, "successDefinition") || s(modality, "instructorNotes") || lead.admin_notes) && (
          <Section title="Goals & notes">
            <div className="space-y-3">
              {s(success, "successDefinition") && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MessageSquare className="size-3.5" />
                    <span>Success goal</span>
                  </div>
                  <p className="whitespace-pre-wrap rounded-lg border border-border/70 bg-card p-3 text-sm text-foreground">
                    {s(success, "successDefinition")}
                  </p>
                </div>
              )}
              {s(modality, "instructorNotes") && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Notes for instructor</div>
                  <p className="whitespace-pre-wrap rounded-lg border border-border/70 bg-card p-3 text-sm text-foreground">
                    {s(modality, "instructorNotes")}
                  </p>
                </div>
              )}
              {lead.admin_notes && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Admin notes</div>
                  <p className="whitespace-pre-wrap rounded-lg border border-border/70 bg-card p-3 text-sm text-foreground">
                    {lead.admin_notes}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>
    );
  };

  const title = record
    ? record.type === "ticket"
      ? record.data.name
      : record.data.form_data?.demographics?.fullName || record.data.form_data?.full_name || "Submission details"
    : "";

  const badgeText = record
    ? record.type === "ticket"
      ? formatLabel(record.data.path, "Contact Ticket")
      : record.type === "booking"
        ? record.data.form_data?.type === "clarity_call_booking"
          ? "Clarity Call"
          : "Tutor Request"
        : record.type === "diagnostic"
          ? "Placement Diagnostic"
          : "Intake Survey"
    : "";

  const subtitle = record
    ? record.type === "ticket"
      ? `${record.data.email} · ${formatDateTime(record.data.created_at)}`
      : `${record.data.form_data?.demographics?.email || record.data.form_data?.email || "No email"} · ${formatDateTime(record.data.created_at)}`
    : "";

  return (
    <Sheet open={record !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {record && (
          <>
            <SheetHeader className="border-b border-border/80 px-6 py-5 text-left">
              <div className="mb-1.5 flex items-center gap-2">
                <Badge variant="secondary" className="font-medium">
                  {badgeText}
                </Badge>
              </div>
              <SheetTitle className="font-display text-xl font-bold tracking-tight">
                {title}
              </SheetTitle>
              <SheetDescription className="text-xs">{subtitle}</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {renderBody()}
            </div>

            <SheetFooter className="border-t border-border/80 bg-muted/20 px-6 py-4 sm:justify-between">
              {onDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(record)}
                  className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Delete record
                </Button>
              ) : <div />}
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

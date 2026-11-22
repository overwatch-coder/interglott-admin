import { redirect } from "next/navigation";

export default function LegacyAdminBookingsPage() {
  redirect("/admin/tutor-bookings");
}

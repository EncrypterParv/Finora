import type { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset your Finora account password.",
  alternates: { canonical: "/reset-password" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}

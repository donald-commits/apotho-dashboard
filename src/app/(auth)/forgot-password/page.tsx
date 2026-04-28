import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-3xl font-bold tracking-tight">Apotho</h1>
      <ForgotPasswordForm />
      <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground">
        Back to sign in
      </Link>
    </div>
  );
}

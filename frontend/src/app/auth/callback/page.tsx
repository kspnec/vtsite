"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserAdminView } from "@/lib/api";

const ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  missing_params: "Something went wrong with the Google sign-in. Please try again.",
  invalid_state: "Security check failed. Please try signing in again.",
  token_exchange_failed: "Could not complete Google sign-in. Please try again.",
  userinfo_failed: "Could not retrieve your Google account info. Please try again.",
  unverified_email: "Your Google email address is not verified.",
  account_disabled: "Your account has been disabled. Please contact the admin.",
  invalid_callback: "Invalid sign-in response. Please try again.",
};

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const userB64 = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      const msg = encodeURIComponent(ERROR_MESSAGES[error] ?? "Sign-in failed. Please try again.");
      router.push(`/auth/login?error=${msg}`);
      return;
    }

    if (token && userB64) {
      try {
        const user: UserAdminView = JSON.parse(atob(decodeURIComponent(userB64)));
        setSession(token, user);
        router.push(user.is_admin ? "/admin" : "/dashboard");
      } catch {
        router.push("/auth/login?error=" + encodeURIComponent("Invalid sign-in response. Please try again."));
      }
    } else {
      router.push("/auth/login");
    }
  }, [searchParams, setSession, router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="text-5xl mb-4">🌿</div>
        <p className="text-gray-500 text-lg">Signing you in…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <p className="text-gray-400">Loading…</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    } else {
      setReady(true); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [token, router, pathname]);

  if (!ready) return null;
  return <>{children}</>;
}

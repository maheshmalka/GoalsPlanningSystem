import { useEffect, useRef, useState } from "react";
import { Alert } from "@mui/material";
import { authApi } from "../api/authApi";
import { useAuth } from "./AuthContext";
import type { GoogleCredentialResponse } from "./google.d.ts";

export default function GoogleSignInButton({ onSuccess }: { onSuccess: () => void }) {
  const { signIn } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // signIn/onSuccess are recreated every render (not memoized by their callers), so they're read via
  // a ref rather than being effect dependencies - otherwise Google's SDK would be re-initialized on
  // nearly every render, which it warns about and wastes work on.
  const latest = useRef({ signIn, onSuccess });
  latest.current = { signIn, onSuccess };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google || !containerRef.current) return;

    const handleCredential = async (response: GoogleCredentialResponse) => {
      try {
        const result = await authApi.google(response.credential);
        latest.current.signIn(result);
        latest.current.onSuccess();
      } catch {
        setError("Google sign-in failed. Please try again.");
      }
    };

    window.google.accounts.id.initialize({ client_id: clientId, callback: handleCredential });
    window.google.accounts.id.renderButton(containerRef.current, { theme: "outline", size: "large", width: 320 });
  }, []);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <div ref={containerRef} />
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    </>
  );
}

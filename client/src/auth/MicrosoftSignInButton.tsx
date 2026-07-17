import { useState } from "react";
import { Alert, Button } from "@mui/material";
import { authApi } from "../api/authApi";
import { msalClient, msalReady } from "./msalClient";
import { useAuth } from "./AuthContext";

export default function MicrosoftSignInButton({ onSuccess }: { onSuccess: () => void }) {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
  if (!clientId) return null;

  const handleClick = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await msalReady;
      const login = await msalClient.loginPopup({ scopes: ["User.Read"] });
      const result = await authApi.microsoft(login.accessToken);
      signIn(result);
      onSuccess();
    } catch {
      setError("Microsoft sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="outlined" fullWidth onClick={handleClick} disabled={isLoading} sx={{ textTransform: "none" }}>
        Sign in with Microsoft
      </Button>
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    </>
  );
}

import { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, Card, CardContent, Divider, Link, Stack, Typography } from "@mui/material";
import SavingsIcon from "@mui/icons-material/Savings";
import { authApi } from "../api/authApi";
import { useAuth } from "../auth/AuthContext";
import GoogleSignInButton from "../auth/GoogleSignInButton";
import MicrosoftSignInButton from "../auth/MicrosoftSignInButton";
import { FormTextField } from "../components/FormTextField";
import { loginSchema, type LoginFormValues } from "../validation/schemas";
import { palette } from "../theme";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/plans";
  const onSuccess = () => navigate(redirectTo, { replace: true });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await authApi.login(values);
      signIn(result);
      onSuccess();
    } catch {
      setError("Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Box display="flex" minHeight="100vh" alignItems="center" justifyContent="center" bgcolor={palette.backgroundDefault} p={2}>
      <Card sx={{ maxWidth: 420, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={3}>
            <SavingsIcon sx={{ color: palette.gold }} />
            <Typography variant="h6" sx={{ fontFamily: '"Lora", serif', fontWeight: 700 }}>
              Goals Planning System
            </Typography>
          </Stack>

          <Typography variant="h5" gutterBottom>Sign in</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Welcome back. Sign in to access your clients' plans.
          </Typography>

          <Stack spacing={2}>
            <GoogleSignInButton onSuccess={onSuccess} />
            <MicrosoftSignInButton onSuccess={onSuccess} />
          </Stack>

          <Divider sx={{ my: 3 }}>or</Divider>

          <Stack spacing={2} component="form" onSubmit={onSubmit}>
            <FormTextField name="email" control={control} label="Email" type="email" autoComplete="email" autoFocus />
            <FormTextField name="password" control={control} label="Password" type="password" autoComplete="current-password" />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              Sign in
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" mt={3} textAlign="center">
            Don't have an account? <Link component={RouterLink} to="/register">Create one</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, Card, CardContent, Divider, Link, Stack, Typography } from "@mui/material";
import SavingsIcon from "@mui/icons-material/Savings";
import { authApi } from "../api/authApi";
import { useAuth } from "../auth/AuthContext";
import GoogleSignInButton from "../auth/GoogleSignInButton";
import MicrosoftSignInButton from "../auth/MicrosoftSignInButton";
import { FormTextField } from "../components/FormTextField";
import { registerSchema, type RegisterFormValues } from "../validation/schemas";
import { palette } from "../theme";

export default function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  const onSuccess = () => navigate("/plans", { replace: true });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await authApi.register(values);
      signIn(result);
      onSuccess();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 409 ? "An account with this email already exists." : "Could not create your account. Please try again.");
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

          <Typography variant="h5" gutterBottom>Create an account</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Set up your advisor workspace to start planning client goals.
          </Typography>

          <Stack spacing={2}>
            <GoogleSignInButton onSuccess={onSuccess} />
            <MicrosoftSignInButton onSuccess={onSuccess} />
          </Stack>

          <Divider sx={{ my: 3 }}>or</Divider>

          <Stack spacing={2} component="form" onSubmit={onSubmit}>
            <FormTextField name="displayName" control={control} label="Full Name" autoComplete="name" autoFocus />
            <FormTextField name="email" control={control} label="Email" type="email" autoComplete="email" />
            <FormTextField
              name="password"
              control={control}
              label="Password"
              type="password"
              autoComplete="new-password"
              helperText="At least 8 characters"
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              Create account
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" mt={3} textAlign="center">
            Already have an account? <Link component={RouterLink} to="/login">Sign in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

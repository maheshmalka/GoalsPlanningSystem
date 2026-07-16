import { useState } from "react";
import { Alert, Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useUpdateClient } from "../../api/queries";
import type { ClientDetail, ClientUpsert, RiskProfile, TaxRegime } from "../../api/types";

const riskProfiles: RiskProfile[] = ["Conservative", "ModeratelyConservative", "Moderate", "ModeratelyAggressive", "Aggressive"];

export default function DemographicsTaxTab({ client }: { client: ClientDetail }) {
  const [form, setForm] = useState<ClientUpsert>({
    name: client.name,
    dateOfBirth: client.dateOfBirth,
    retirementAge: client.retirementAge,
    lifeExpectancyAge: client.lifeExpectancyAge,
    taxRegime: client.taxRegime,
    totalDeductionsAmount: client.totalDeductionsAmount,
    riskProfileOverride: client.riskProfileOverride,
    notes: client.notes,
  });
  const update = useUpdateClient(client.id);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Demographics
            </Typography>
            <Stack spacing={2}>
              <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
              <TextField
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Retirement Age"
                  type="number"
                  value={form.retirementAge}
                  onChange={(e) => setForm({ ...form, retirementAge: Number(e.target.value) })}
                  fullWidth
                />
                <TextField
                  label="Life Expectancy Age"
                  type="number"
                  value={form.lifeExpectancyAge}
                  onChange={(e) => setForm({ ...form, lifeExpectancyAge: Number(e.target.value) })}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Notes"
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                multiline
                minRows={3}
                fullWidth
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Stack spacing={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tax Details
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Income Tax Regime"
                  select
                  value={form.taxRegime}
                  onChange={(e) => setForm({ ...form, taxRegime: e.target.value as TaxRegime })}
                  fullWidth
                >
                  <MenuItem value="New">New Regime</MenuItem>
                  <MenuItem value="Old">Old Regime</MenuItem>
                </TextField>
                {form.taxRegime === "Old" && (
                  <TextField
                    label="Total Deductions (80C/80D/HRA etc.)"
                    type="number"
                    value={form.totalDeductionsAmount}
                    onChange={(e) => setForm({ ...form, totalDeductionsAmount: Number(e.target.value) })}
                    fullWidth
                  />
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk Profile
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Computed profile: {client.riskProfile ?? "Not assessed yet — complete the Risk Questionnaire tab"}
              </Typography>
              <TextField
                label="Advisor Override (optional)"
                select
                value={form.riskProfileOverride ?? ""}
                onChange={(e) => setForm({ ...form, riskProfileOverride: (e.target.value || null) as RiskProfile | null })}
                fullWidth
              >
                <MenuItem value="">No override</MenuItem>
                {riskProfiles.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <Grid size={12}>
        {update.isSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => update.reset()}>
            Saved.
          </Alert>
        )}
        <Button variant="contained" disabled={update.isPending} onClick={() => update.mutate(form)}>
          Save Changes
        </Button>
      </Grid>
    </Grid>
  );
}

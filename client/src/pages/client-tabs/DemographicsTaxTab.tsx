import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Alert, Button, Card, CardContent, Grid, MenuItem, Stack, Typography } from "@mui/material";
import { useUpdateClient } from "../../api/queries";
import { FormTextField } from "../../components/FormTextField";
import { clientSchema, type ClientFormValues } from "../../validation/schemas";
import type { ClientDetail, RiskProfile } from "../../api/types";

const riskProfiles: RiskProfile[] = ["Conservative", "ModeratelyConservative", "Moderate", "ModeratelyAggressive", "Aggressive"];

export default function DemographicsTaxTab({ client }: { client: ClientDetail }) {
  const update = useUpdateClient(client.id);
  const { control, handleSubmit, watch } = useForm<z.input<typeof clientSchema>, any, ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      dateOfBirth: client.dateOfBirth,
      retirementAge: client.retirementAge,
      lifeExpectancyAge: client.lifeExpectancyAge,
      taxRegime: client.taxRegime,
      totalDeductionsAmount: client.totalDeductionsAmount,
      riskProfileOverride: client.riskProfileOverride,
      notes: client.notes,
    },
  });

  const taxRegime = watch("taxRegime");
  const onSubmit = handleSubmit((values) => update.mutate(values));

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Demographics
            </Typography>
            <Stack spacing={2}>
              <FormTextField name="name" control={control} label="Full Name" />
              <FormTextField
                name="dateOfBirth"
                control={control}
                label="Date of Birth"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
              <Stack direction="row" spacing={2}>
                <FormTextField name="retirementAge" control={control} label="Retirement Age" type="number" />
                <FormTextField name="lifeExpectancyAge" control={control} label="Life Expectancy Age" type="number" />
              </Stack>
              <FormTextField name="notes" control={control} label="Notes" multiline minRows={3} nullable />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tax Details
              </Typography>
              <Stack spacing={2}>
                <FormTextField name="taxRegime" control={control} label="Income Tax Regime" select>
                  <MenuItem value="New">New Regime</MenuItem>
                  <MenuItem value="Old">Old Regime</MenuItem>
                </FormTextField>
                {taxRegime === "Old" && (
                  <FormTextField
                    name="totalDeductionsAmount"
                    control={control}
                    label="Total Deductions (80C/80D/HRA etc.)"
                    type="number"
                  />
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk Profile
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Computed profile: {client.riskProfile ?? "Not assessed yet — complete the Risk Questionnaire tab"}
              </Typography>
              <FormTextField name="riskProfileOverride" control={control} label="Advisor Override (optional)" select nullable>
                <MenuItem value="">No override</MenuItem>
                {riskProfiles.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </FormTextField>
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
        <Button variant="contained" disabled={update.isPending} onClick={onSubmit}>
          Save Changes
        </Button>
      </Grid>
    </Grid>
  );
}

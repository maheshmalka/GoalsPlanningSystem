import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Box, Button, Card, CardActionArea, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, InputAdornment, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import GroupsIcon from "@mui/icons-material/Groups";
import { addClientToPlan, useCreatePlan, usePlans } from "../api/queries";
import { FormTextField } from "../components/FormTextField";
import { clientSchema, type ClientFormValues } from "../validation/schemas";
import type { RiskProfile } from "../api/types";

const riskColor: Record<string, "success" | "info" | "warning" | "error" | "default"> = {
  Conservative: "info",
  ModeratelyConservative: "info",
  Moderate: "warning",
  ModeratelyAggressive: "warning",
  Aggressive: "error",
};

const defaultValues: ClientFormValues = {
  name: "",
  dateOfBirth: "1990-01-01",
  retirementAge: 60,
  lifeExpectancyAge: 85,
  taxRegime: "New",
  totalDeductionsAmount: 0,
  riskProfileOverride: null,
  notes: "",
};

export default function PlansListPage() {
  const [search, setSearch] = useState("");
  const { data: plans, isLoading } = usePlans(search || undefined);
  const createPlan = useCreatePlan();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { control, handleSubmit, reset } = useForm<z.input<typeof clientSchema>, any, ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues,
  });

  const openDialog = () => {
    reset(defaultValues);
    setOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    const plan = await createPlan.mutateAsync({ name: `${values.name} Household`, inflationRatePct: 7, simulationCount: 2000, primaryClientId: null });
    await addClientToPlan(plan.id, values);
    setOpen(false);
    navigate(`/plans/${plan.id}`);
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4">Plans</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog}>
          New Plan
        </Button>
      </Stack>

      <TextField
        placeholder="Search by client name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 3, maxWidth: 480 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />

      {isLoading && <Typography color="text.secondary">Loading plans…</Typography>}

      {!isLoading && plans?.length === 0 && (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            {search ? "No plans match that search." : "No plans yet. Create your first plan to get started."}
          </Typography>
        </Card>
      )}

      <Grid container spacing={2}>
        {plans?.map((plan) => (
          <Grid key={plan.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardActionArea onClick={() => navigate(`/plans/${plan.id}`)}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                    <GroupsIcon color="primary" />
                    <Typography variant="h6">{plan.name}</Typography>
                  </Stack>
                  <Typography color="text.secondary" gutterBottom>
                    {plan.clients.length === 0
                      ? "No clients yet"
                      : plan.clients.map((c) => `${c.name} (${c.age})`).join(" & ")}
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {plan.clients.map((c) => (
                      <Chip
                        key={c.id}
                        size="small"
                        label={c.effectiveRiskProfile ?? "Risk not set"}
                        color={c.effectiveRiskProfile ? riskColor[c.effectiveRiskProfile as RiskProfile] : "default"}
                        variant={c.effectiveRiskProfile ? "filled" : "outlined"}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Plan</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter the first client's details. You can add a second client (e.g. a spouse) after creating the plan.
          </Typography>
          <Stack spacing={2} mt={1}>
            <FormTextField name="name" control={control} label="Full Name" autoFocus />
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
            <FormTextField name="taxRegime" control={control} label="Tax Regime" select>
              <MenuItem value="New">New Regime</MenuItem>
              <MenuItem value="Old">Old Regime</MenuItem>
            </FormTextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={createPlan.isPending} onClick={onSubmit}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

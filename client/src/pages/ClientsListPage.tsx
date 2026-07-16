import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Box, Button, Card, CardActionArea, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, MenuItem, Stack, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import { useClients, useCreateClient } from "../api/queries";
import { FormTextField } from "../components/FormTextField";
import { clientSchema, type ClientFormValues } from "../validation/schemas";

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

export default function ClientsListPage() {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
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
    const created = await createClient.mutateAsync(values);
    setOpen(false);
    navigate(`/clients/${created.id}`);
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Clients</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog}>
          New Client
        </Button>
      </Stack>

      {isLoading && <Typography color="text.secondary">Loading clients…</Typography>}

      {!isLoading && clients?.length === 0 && (
        <Card variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No clients yet. Create your first client to get started.</Typography>
        </Card>
      )}

      <Grid container spacing={2}>
        {clients?.map((client) => (
          <Grid key={client.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardActionArea onClick={() => navigate(`/clients/${client.id}`)}>
                <CardContent>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6">{client.name}</Typography>
                  </Stack>
                  <Typography color="text.secondary" gutterBottom>
                    Age {client.age}
                  </Typography>
                  {client.effectiveRiskProfile ? (
                    <Chip
                      size="small"
                      label={client.effectiveRiskProfile}
                      color={riskColor[client.effectiveRiskProfile] ?? "default"}
                    />
                  ) : (
                    <Chip size="small" label="Risk profile not set" variant="outlined" />
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Client</DialogTitle>
        <DialogContent>
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
          <Button variant="contained" disabled={createClient.isPending} onClick={onSubmit}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

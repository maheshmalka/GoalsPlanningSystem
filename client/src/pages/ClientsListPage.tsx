import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Card, CardActionArea, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import { useClients, useCreateClient } from "../api/queries";
import type { ClientUpsert, TaxRegime } from "../api/types";

const riskColor: Record<string, "success" | "info" | "warning" | "error" | "default"> = {
  Conservative: "info",
  ModeratelyConservative: "info",
  Moderate: "warning",
  ModeratelyAggressive: "warning",
  Aggressive: "error",
};

function emptyForm(): ClientUpsert {
  return {
    name: "",
    dateOfBirth: "1990-01-01",
    retirementAge: 60,
    lifeExpectancyAge: 85,
    taxRegime: "New",
    totalDeductionsAmount: 0,
    riskProfileOverride: null,
    notes: "",
  };
}

export default function ClientsListPage() {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClientUpsert>(emptyForm());

  const handleCreate = async () => {
    const created = await createClient.mutateAsync(form);
    setOpen(false);
    setForm(emptyForm());
    navigate(`/clients/${created.id}`);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Clients</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
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
            <Card variant="outlined">
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
            <TextField
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              autoFocus
            />
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
              label="Tax Regime"
              select
              value={form.taxRegime}
              onChange={(e) => setForm({ ...form, taxRegime: e.target.value as TaxRegime })}
              fullWidth
            >
              <MenuItem value="New">New Regime</MenuItem>
              <MenuItem value="Old">Old Regime</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.name || createClient.isPending} onClick={handleCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

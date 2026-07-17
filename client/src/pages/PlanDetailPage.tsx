import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Alert, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, MenuItem, Stack, Tab, Tabs, Tooltip, Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  useAccounts, useAddClientToPlan, useClient, useDeleteClient, useDeletePlan, usePlan, useUpdatePlan,
} from "../api/queries";
import { FormTextField } from "../components/FormTextField";
import { clientSchema, planSchema, type ClientFormValues, type PlanFormValues } from "../validation/schemas";
import DemographicsTaxTab from "./client-tabs/DemographicsTaxTab";
import AccountsTab from "./client-tabs/AccountsTab";
import IncomeTab from "./client-tabs/IncomeTab";
import RiskQuestionnaireTab from "./client-tabs/RiskQuestionnaireTab";
import ExpensesTab from "./client-tabs/ExpensesTab";
import GoalsTab, { type LinkableAccount } from "./client-tabs/GoalsTab";
import type { ClientListItem } from "../api/types";

const clientDefaultValues: ClientFormValues = {
  name: "",
  dateOfBirth: "1990-01-01",
  retirementAge: 60,
  lifeExpectancyAge: 85,
  taxRegime: "New",
  totalDeductionsAmount: 0,
  riskProfileOverride: null,
  notes: "",
};

const clientSubTabs = ["Demographics & Tax", "Accounts", "Income", "Risk Questionnaire"];

function ClientPanel({ clientId, planId }: { clientId: number; planId: number }) {
  const { data: client, isLoading } = useClient(clientId);
  const [subTab, setSubTab] = useState(0);

  if (isLoading || !client) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box>
      <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        {clientSubTabs.map((t) => (
          <Tab key={t} label={t} />
        ))}
      </Tabs>
      {subTab === 0 && <DemographicsTaxTab client={client} />}
      {subTab === 1 && <AccountsTab clientId={clientId} />}
      {subTab === 2 && <IncomeTab clientId={clientId} />}
      {subTab === 3 && <RiskQuestionnaireTab clientId={clientId} />}
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 4 }}>
        Belongs to this plan · client ID {clientId} · plan ID {planId}
      </Typography>
    </Box>
  );
}

function PlanSettingsPanel({ planId, clients }: { planId: number; clients: ClientListItem[] }) {
  const { data: plan } = usePlan(planId);
  const updatePlan = useUpdatePlan(planId);
  const deletePlan = useDeletePlan();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { control, handleSubmit } = useForm<z.input<typeof planSchema>, any, PlanFormValues>({
    resolver: zodResolver(planSchema),
    values: plan ? { name: plan.name, inflationRatePct: plan.inflationRatePct, simulationCount: plan.simulationCount, primaryClientId: plan.primaryClientId } : undefined,
  });

  const onSubmit = handleSubmit((values) => updatePlan.mutate(values));

  const handleDelete = async () => {
    await deletePlan.mutateAsync(planId);
    navigate("/plans");
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Plan Settings</Typography>
        <Stack spacing={2} maxWidth={480}>
          <FormTextField name="name" control={control} label="Plan Name" />
          <FormTextField name="inflationRatePct" control={control} label="Inflation Rate (%)" type="number" />
          <FormTextField name="simulationCount" control={control} label="Monte Carlo Simulation Count" type="number" />
          {clients.length > 1 && (
            <FormTextField
              name="primaryClientId"
              control={control}
              label="Primary Client (drives retirement age & tax timeline)"
              select
              helperText="Used to run the household simulation timeline when there are two clients"
            >
              {clients.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </FormTextField>
          )}
          <Box>
            <Button variant="contained" onClick={onSubmit} disabled={updatePlan.isPending}>
              Save Changes
            </Button>
          </Box>
          {updatePlan.isSuccess && <Alert severity="success">Saved.</Alert>}
        </Stack>

        <Box mt={4} pt={3} borderTop={1} borderColor="divider">
          <Typography variant="subtitle2" color="error" gutterBottom>Danger Zone</Typography>
          {!confirmDelete ? (
            <Button color="error" variant="outlined" onClick={() => setConfirmDelete(true)}>
              Delete Plan
            </Button>
          ) : (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2">Delete this plan and all its clients, accounts, and data?</Typography>
              <Button color="error" variant="contained" onClick={handleDelete} disabled={deletePlan.isPending}>
                Confirm Delete
              </Button>
              <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </Stack>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function PlanDetailPage() {
  const { id } = useParams();
  const planId = Number(id);
  const navigate = useNavigate();
  const { data: plan, isLoading } = usePlan(planId);
  const [tab, setTab] = useState(0);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const deleteClient = useDeleteClient(planId);

  const clientA = plan?.clients[0];
  const clientB = plan?.clients[1];
  const { list: accountsA } = useAccounts(clientA?.id ?? 0);
  const { list: accountsB } = useAccounts(clientB?.id ?? 0);
  const addClient = useAddClientToPlan(planId);

  const { control, handleSubmit, reset } = useForm<z.input<typeof clientSchema>, any, ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: clientDefaultValues,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!plan) {
    return <Typography color="error">Plan not found.</Typography>;
  }

  const linkableAccounts: LinkableAccount[] = [
    ...(accountsA.data ?? []).map((a) => ({ id: a.id, label: plan.clients.length > 1 ? `${a.name} (${clientA!.name})` : a.name })),
    ...(accountsB.data ?? []).map((a) => ({ id: a.id, label: `${a.name} (${clientB!.name})` })),
  ];

  const openAddClient = () => {
    reset(clientDefaultValues);
    setAddClientOpen(true);
  };

  const onAddClient = handleSubmit(async (values) => {
    await addClient.mutateAsync(values);
    setAddClientOpen(false);
  });

  const clientTabCount = plan.clients.length;
  const tabLabels = [...plan.clients.map((c) => c.name), "Expenses", "Goals", "Settings"];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/plans")}>
            Back
          </Button>
          <Typography variant="h4">{plan.name}</Typography>
        </Stack>
        <Stack direction="row" spacing={1.5}>
          {clientTabCount < 2 && (
            <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={openAddClient}>
              Add Second Client
            </Button>
          )}
          <Button variant="contained" startIcon={<ShowChartIcon />} onClick={() => navigate(`/plans/${planId}/projections`)}>
            View Projections
          </Button>
        </Stack>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        {tabLabels.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      {tab < clientTabCount && plan.clients[tab] && (
        <>
          <Stack direction="row" justifyContent="flex-end" mb={1}>
            <Tooltip title="Remove this client from the plan">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  if (confirm(`Remove ${plan.clients[tab].name} from this plan? This deletes their accounts, income, and risk profile.`)) {
                    deleteClient.mutate(plan.clients[tab].id);
                    setTab(0);
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <ClientPanel clientId={plan.clients[tab].id} planId={planId} />
        </>
      )}
      {tab === clientTabCount && <ExpensesTab planId={planId} />}
      {tab === clientTabCount + 1 && <GoalsTab planId={planId} accounts={linkableAccounts} />}
      {tab === clientTabCount + 2 && <PlanSettingsPanel planId={planId} clients={plan.clients} />}

      <Dialog open={addClientOpen} onClose={() => setAddClientOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Second Client</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={0}>
            <Grid size={12}>
              <FormTextField name="name" control={control} label="Full Name" autoFocus />
            </Grid>
            <Grid size={12}>
              <FormTextField
                name="dateOfBirth"
                control={control}
                label="Date of Birth"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={6}>
              <FormTextField name="retirementAge" control={control} label="Retirement Age" type="number" />
            </Grid>
            <Grid size={6}>
              <FormTextField name="lifeExpectancyAge" control={control} label="Life Expectancy Age" type="number" />
            </Grid>
            <Grid size={12}>
              <FormTextField name="taxRegime" control={control} label="Tax Regime" select>
                <MenuItem value="New">New Regime</MenuItem>
                <MenuItem value="Old">Old Regime</MenuItem>
              </FormTextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddClientOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onAddClient}>
            Add Client
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

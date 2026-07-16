import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Stack, Tab, Tabs, Typography, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { useClient } from "../api/queries";
import DemographicsTaxTab from "./client-tabs/DemographicsTaxTab";
import AccountsTab from "./client-tabs/AccountsTab";
import IncomeTab from "./client-tabs/IncomeTab";
import ExpensesTab from "./client-tabs/ExpensesTab";
import RiskQuestionnaireTab from "./client-tabs/RiskQuestionnaireTab";
import GoalsTab from "./client-tabs/GoalsTab";

const tabs = ["Demographics & Tax", "Accounts", "Income", "Expenses", "Risk Questionnaire", "Goals"];

export default function ClientDetailPage() {
  const { id } = useParams();
  const clientId = Number(id);
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(clientId);
  const [tab, setTab] = useState(0);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!client) {
    return <Typography color="error">Client not found.</Typography>;
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/clients")}>
            Back
          </Button>
          <Typography variant="h4">{client.name}</Typography>
        </Stack>
        <Button variant="contained" startIcon={<ShowChartIcon />} onClick={() => navigate(`/clients/${clientId}/projections`)}>
          View Projections
        </Button>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        {tabs.map((t) => (
          <Tab key={t} label={t} />
        ))}
      </Tabs>

      {tab === 0 && <DemographicsTaxTab client={client} />}
      {tab === 1 && <AccountsTab clientId={clientId} />}
      {tab === 2 && <IncomeTab clientId={clientId} />}
      {tab === 3 && <ExpensesTab clientId={clientId} />}
      {tab === 4 && <RiskQuestionnaireTab clientId={clientId} />}
      {tab === 5 && <GoalsTab clientId={clientId} accountsClientId={clientId} />}
    </Box>
  );
}

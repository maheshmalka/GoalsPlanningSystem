import { useState } from "react";
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAccounts, useAssetClasses } from "../../api/queries";
import { formatInr } from "../../utils/currency";
import type { Account, AccountType, AccountUpsert, ContributionFrequency } from "../../api/types";

const accountTypes: AccountType[] = [
  "EquityMutualFund", "DebtMutualFund", "DirectEquity", "Epf", "Ppf", "Nps", "FixedDeposit", "RecurringDeposit",
  "SavingsAccount", "RealEstate", "GoldSgb", "Elss", "SukanyaSamriddhiYojana", "SeniorCitizenSavingsScheme",
  "PostOfficeScheme", "Ulip", "EndowmentInsurance", "CorporateBondNcd", "Other",
];

function emptyForm(): AccountUpsert {
  return {
    name: "", accountType: "EquityMutualFund", currentBalance: 0, contributionAmount: 0,
    contributionFrequency: "Monthly", employerMatchPct: null, npsAnnuitizationPct: null,
    assumedAnnuityRatePct: null, allocations: [],
  };
}

export default function AccountsTab({ clientId }: { clientId: number }) {
  const { list, create, update, remove } = useAccounts(clientId);
  const { data: assetClasses } = useAssetClasses();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AccountUpsert>(emptyForm());

  const totalAllocation = form.allocations.reduce((sum, a) => sum + (a.percentage || 0), 0);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditingId(a.id);
    setForm({
      name: a.name, accountType: a.accountType, currentBalance: a.currentBalance,
      contributionAmount: a.contributionAmount, contributionFrequency: a.contributionFrequency,
      employerMatchPct: a.employerMatchPct, npsAnnuitizationPct: a.npsAnnuitizationPct,
      assumedAnnuityRatePct: a.assumedAnnuityRatePct,
      allocations: a.allocations.map((al) => ({ assetClassId: al.assetClassId, percentage: al.percentage })),
    });
    setOpen(true);
  };

  const save = async () => {
    if (editingId) {
      await update.mutateAsync({ id: editingId, dto: form });
    } else {
      await create.mutateAsync(form);
    }
    setOpen(false);
  };

  const isNps = form.accountType === "Nps";

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Assets / Accounts</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Account
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Balance</TableCell>
            <TableCell>Contribution</TableCell>
            <TableCell>Allocation</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {list.data?.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.name}</TableCell>
              <TableCell>{a.accountType}</TableCell>
              <TableCell align="right">{formatInr(a.currentBalance)}</TableCell>
              <TableCell>
                {a.contributionAmount > 0 ? `${formatInr(a.contributionAmount)} / ${a.contributionFrequency}` : "—"}
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {a.allocations.map((al) => (
                    <Chip key={al.assetClassId} size="small" label={`${al.assetClassName} ${al.percentage}%`} />
                  ))}
                </Stack>
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => openEdit(a)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => remove.mutate(a.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {list.data?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography color="text.secondary" align="center" py={2}>
                  No accounts yet.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Account" : "Add Account"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField
              label="Account Type"
              select
              value={form.accountType}
              onChange={(e) => setForm({ ...form, accountType: e.target.value as AccountType })}
              fullWidth
            >
              {accountTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Current Balance (₹)"
              type="number"
              value={form.currentBalance}
              onChange={(e) => setForm({ ...form, currentBalance: Number(e.target.value) })}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Contribution Amount (₹)"
                type="number"
                value={form.contributionAmount}
                onChange={(e) => setForm({ ...form, contributionAmount: Number(e.target.value) })}
                fullWidth
              />
              <TextField
                label="Frequency"
                select
                value={form.contributionFrequency}
                onChange={(e) => setForm({ ...form, contributionFrequency: e.target.value as ContributionFrequency })}
                fullWidth
              >
                <MenuItem value="None">None</MenuItem>
                <MenuItem value="Monthly">Monthly</MenuItem>
                <MenuItem value="Annual">Annual</MenuItem>
              </TextField>
            </Stack>

            {(form.accountType === "Epf" || isNps) && (
              <TextField
                label="Employer Match (%)"
                type="number"
                value={form.employerMatchPct ?? ""}
                onChange={(e) => setForm({ ...form, employerMatchPct: e.target.value === "" ? null : Number(e.target.value) })}
                fullWidth
              />
            )}

            {isNps && (
              <Stack direction="row" spacing={2}>
                <TextField
                  label="NPS Annuitization (%)"
                  type="number"
                  helperText="Portion mandatorily annuitized at retirement (default 40%)"
                  value={form.npsAnnuitizationPct ?? ""}
                  onChange={(e) => setForm({ ...form, npsAnnuitizationPct: e.target.value === "" ? null : Number(e.target.value) })}
                  fullWidth
                />
                <TextField
                  label="Assumed Annuity Rate (%)"
                  type="number"
                  value={form.assumedAnnuityRatePct ?? ""}
                  onChange={(e) => setForm({ ...form, assumedAnnuityRatePct: e.target.value === "" ? null : Number(e.target.value) })}
                  fullWidth
                />
              </Stack>
            )}

            <Typography variant="subtitle2" mt={1}>
              Asset Allocation (must total 100%)
            </Typography>
            {assetClasses?.map((ac) => {
              const current = form.allocations.find((a) => a.assetClassId === ac.id);
              return (
                <TextField
                  key={ac.id}
                  label={`${ac.name} (%)`}
                  type="number"
                  size="small"
                  value={current?.percentage ?? ""}
                  onChange={(e) => {
                    const pct = e.target.value === "" ? undefined : Number(e.target.value);
                    const rest = form.allocations.filter((a) => a.assetClassId !== ac.id);
                    setForm({
                      ...form,
                      allocations: pct === undefined || pct === 0 ? rest : [...rest, { assetClassId: ac.id, percentage: pct }],
                    });
                  }}
                  fullWidth
                />
              );
            })}
            {totalAllocation !== 100 && form.allocations.length > 0 && (
              <Alert severity="warning">Allocation totals {totalAllocation}%, not 100%.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!form.name} onClick={save}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

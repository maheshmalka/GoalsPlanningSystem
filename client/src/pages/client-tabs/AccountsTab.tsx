import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAccounts, useAssetClasses } from "../../api/queries";
import { formatInr } from "../../utils/currency";
import { FormTextField } from "../../components/FormTextField";
import { accountSchema, type AccountFormValues } from "../../validation/schemas";
import type { Account } from "../../api/types";

const accountTypes = [
  "EquityMutualFund", "DebtMutualFund", "DirectEquity", "Epf", "Ppf", "Nps", "FixedDeposit", "RecurringDeposit",
  "SavingsAccount", "RealEstate", "GoldSgb", "Elss", "SukanyaSamriddhiYojana", "SeniorCitizenSavingsScheme",
  "PostOfficeScheme", "Ulip", "EndowmentInsurance", "CorporateBondNcd", "Other",
];

const defaultValues: AccountFormValues = {
  name: "", accountType: "EquityMutualFund", currentBalance: 0, contributionAmount: 0,
  contributionFrequency: "Monthly", employerMatchPct: null, npsAnnuitizationPct: null,
  assumedAnnuityRatePct: null, allocations: [],
};

export default function AccountsTab({ clientId }: { clientId: number }) {
  const { list, create, update, remove } = useAccounts(clientId);
  const { data: assetClasses } = useAssetClasses();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<
    z.input<typeof accountSchema>, any, AccountFormValues
  >({
    resolver: zodResolver(accountSchema),
    defaultValues,
  });

  const accountType = watch("accountType");
  const allocations = watch("allocations");
  const totalAllocation = allocations.reduce((sum, a) => sum + (a.percentage || 0), 0);
  const isNps = accountType === "Nps";

  const openCreate = () => {
    setEditingId(null);
    reset(defaultValues);
    setOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditingId(a.id);
    reset({
      name: a.name, accountType: a.accountType, currentBalance: a.currentBalance,
      contributionAmount: a.contributionAmount, contributionFrequency: a.contributionFrequency,
      employerMatchPct: a.employerMatchPct, npsAnnuitizationPct: a.npsAnnuitizationPct,
      assumedAnnuityRatePct: a.assumedAnnuityRatePct,
      allocations: a.allocations.map((al) => ({ assetClassId: al.assetClassId, percentage: al.percentage })),
    });
    setOpen(true);
  };

  const setAllocation = (assetClassId: number, rawValue: string) => {
    const pct = rawValue === "" ? undefined : Number(rawValue);
    const rest = allocations.filter((a) => a.assetClassId !== assetClassId);
    setValue("allocations", pct === undefined || pct === 0 ? rest : [...rest, { assetClassId, percentage: pct }]);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (editingId) await update.mutateAsync({ id: editingId, dto: values });
    else await create.mutateAsync(values);
    setOpen(false);
  });

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
            <FormTextField name="name" control={control} label="Name" autoFocus />
            <FormTextField name="accountType" control={control} label="Account Type" select>
              {accountTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </FormTextField>
            <FormTextField name="currentBalance" control={control} label="Current Balance (₹)" type="number" />
            <Stack direction="row" spacing={2}>
              <FormTextField name="contributionAmount" control={control} label="Contribution Amount (₹)" type="number" />
              <FormTextField name="contributionFrequency" control={control} label="Frequency" select>
                <MenuItem value="None">None</MenuItem>
                <MenuItem value="Monthly">Monthly</MenuItem>
                <MenuItem value="Annual">Annual</MenuItem>
              </FormTextField>
            </Stack>

            {(accountType === "Epf" || isNps) && (
              <FormTextField name="employerMatchPct" control={control} label="Employer Match (%)" type="number" nullable />
            )}

            {isNps && (
              <Stack direction="row" spacing={2}>
                <FormTextField
                  name="npsAnnuitizationPct"
                  control={control}
                  label="NPS Annuitization (%)"
                  type="number"
                  nullable
                  helperText="Default 40%"
                />
                <FormTextField name="assumedAnnuityRatePct" control={control} label="Assumed Annuity Rate (%)" type="number" nullable />
              </Stack>
            )}

            <Typography variant="subtitle2" mt={1}>
              Asset Allocation (must total 100%)
            </Typography>
            {assetClasses?.map((ac) => {
              const current = allocations.find((a) => a.assetClassId === ac.id);
              return (
                <TextField
                  key={ac.id}
                  label={`${ac.name} (%)`}
                  type="number"
                  size="small"
                  value={current?.percentage ?? ""}
                  onChange={(e) => setAllocation(ac.id, e.target.value)}
                  fullWidth
                />
              );
            })}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color={totalAllocation === 100 ? "success.main" : "text.secondary"}>
                Total: {totalAllocation.toFixed(2)}%
              </Typography>
            </Stack>
            {errors.allocations && (
              <Alert severity="error">{errors.allocations.message ?? errors.allocations.root?.message}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useState } from "react";
import {
  Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  IconButton, MenuItem, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAccounts, useGoals } from "../../api/queries";
import { formatInr } from "../../utils/currency";
import type { Goal, GoalPriority, GoalType, GoalUpsert } from "../../api/types";

const goalTypes: GoalType[] = [
  "Retirement", "ChildEducation", "ChildMarriage", "HomePurchase", "VehiclePurchase", "EmergencyFund", "MajorPurchase", "Legacy", "Other",
];
const priorities: GoalPriority[] = ["Essential", "Important", "Aspirational"];

function emptyForm(): GoalUpsert {
  const year = new Date().getFullYear();
  return { name: "", goalType: "Retirement", targetAmount: 0, priority: "Important", startYear: year + 1, endYear: year + 1, isRecurring: false, growthRateOverridePct: null, linkedAccountIds: [] };
}

export default function GoalsTab({ clientId, accountsClientId }: { clientId: number; accountsClientId: number }) {
  const { list, create, update, remove } = useGoals(clientId);
  const { list: accountsList } = useAccounts(accountsClientId);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<GoalUpsert>(emptyForm());

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditingId(g.id);
    setForm({
      name: g.name, goalType: g.goalType, targetAmount: g.targetAmount, priority: g.priority,
      startYear: g.startYear, endYear: g.endYear, isRecurring: g.isRecurring,
      growthRateOverridePct: g.growthRateOverridePct, linkedAccountIds: g.linkedAccountIds,
    });
    setOpen(true);
  };

  const save = async () => {
    const dto = { ...form, endYear: form.isRecurring ? form.endYear : form.startYear };
    if (editingId) await update.mutateAsync({ id: editingId, dto });
    else await create.mutateAsync(dto);
    setOpen(false);
  };

  const toggleAccount = (accountId: number) => {
    setForm((f) => ({
      ...f,
      linkedAccountIds: f.linkedAccountIds.includes(accountId)
        ? f.linkedAccountIds.filter((id) => id !== accountId)
        : [...f.linkedAccountIds, accountId],
    }));
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Goals</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Goal
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Years</TableCell>
            <TableCell>Linked Accounts</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {list.data?.map((g) => (
            <TableRow key={g.id}>
              <TableCell>{g.name}</TableCell>
              <TableCell>{g.goalType}</TableCell>
              <TableCell align="right">{formatInr(g.targetAmount)}{g.isRecurring ? "/yr" : ""}</TableCell>
              <TableCell>{g.priority}</TableCell>
              <TableCell>{g.isRecurring ? `${g.startYear} – ${g.endYear}` : g.startYear}</TableCell>
              <TableCell>
                {g.linkedAccountIds.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">General pool</Typography>
                ) : (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {g.linkedAccountIds.map((id) => (
                      <Chip key={id} size="small" label={accountsList.data?.find((a) => a.id === id)?.name ?? id} />
                    ))}
                  </Stack>
                )}
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => openEdit(g)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => remove.mutate(g.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {list.data?.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>
                <Typography color="text.secondary" align="center" py={2}>
                  No goals yet.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Goal" : "Add Goal"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="Goal Type" select value={form.goalType} onChange={(e) => setForm({ ...form, goalType: e.target.value as GoalType })} fullWidth>
              {goalTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                label={form.isRecurring ? "Amount per Year (₹)" : "Target Amount (₹, today's value)"}
                type="number"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: Number(e.target.value) })}
                fullWidth
              />
              <TextField label="Priority" select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as GoalPriority })} fullWidth>
                {priorities.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <FormControlLabel
              control={<Switch checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />}
              label="Recurring (e.g. ongoing retirement spending)"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Start Year"
                type="number"
                value={form.startYear}
                onChange={(e) => setForm({ ...form, startYear: Number(e.target.value) })}
                fullWidth
              />
              {form.isRecurring && (
                <TextField
                  label="End Year"
                  type="number"
                  value={form.endYear}
                  onChange={(e) => setForm({ ...form, endYear: Number(e.target.value) })}
                  fullWidth
                />
              )}
            </Stack>
            <TextField
              label="Growth Rate Override % (blank = use global inflation)"
              type="number"
              value={form.growthRateOverridePct ?? ""}
              onChange={(e) => setForm({ ...form, growthRateOverridePct: e.target.value === "" ? null : Number(e.target.value) })}
              fullWidth
            />

            <Typography variant="subtitle2">Earmark specific accounts (optional — otherwise funded from the general pool)</Typography>
            <Stack>
              {accountsList.data?.map((a) => (
                <FormControlLabel
                  key={a.id}
                  control={<Checkbox checked={form.linkedAccountIds.includes(a.id)} onChange={() => toggleAccount(a.id)} />}
                  label={a.name}
                />
              ))}
              {accountsList.data?.length === 0 && (
                <Typography variant="body2" color="text.secondary">No accounts yet.</Typography>
              )}
            </Stack>
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

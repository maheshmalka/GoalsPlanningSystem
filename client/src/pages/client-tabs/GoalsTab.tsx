import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel,
  IconButton, MenuItem, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useGoals } from "../../api/queries";
import { formatInr } from "../../utils/currency";
import { FormTextField } from "../../components/FormTextField";
import { goalSchema, type GoalFormValues } from "../../validation/schemas";
import type { Goal } from "../../api/types";

const goalTypes = [
  "Retirement", "ChildEducation", "ChildMarriage", "HomePurchase", "VehiclePurchase", "EmergencyFund", "MajorPurchase", "Legacy", "Other",
];
const priorities = ["Essential", "Important", "Aspirational"];

export interface LinkableAccount {
  id: number;
  label: string;
}

function defaultValues(): GoalFormValues {
  const year = new Date().getFullYear();
  return { name: "", goalType: "Retirement", targetAmount: 0, priority: "Important", startYear: year + 1, endYear: year + 1, isRecurring: false, growthRateOverridePct: null, linkedAccountIds: [] };
}

export default function GoalsTab({ planId, accounts }: { planId: number; accounts: LinkableAccount[] }) {
  const { list, create, update, remove } = useGoals(planId);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { control, handleSubmit, reset, watch, setValue } = useForm<z.input<typeof goalSchema>, any, GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: defaultValues(),
  });

  const isRecurring = watch("isRecurring");
  const linkedAccountIds = watch("linkedAccountIds");

  const openCreate = () => {
    setEditingId(null);
    reset(defaultValues());
    setOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditingId(g.id);
    reset({
      name: g.name, goalType: g.goalType, targetAmount: g.targetAmount, priority: g.priority,
      startYear: g.startYear, endYear: g.endYear, isRecurring: g.isRecurring,
      growthRateOverridePct: g.growthRateOverridePct, linkedAccountIds: g.linkedAccountIds,
    });
    setOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    const dto = { ...values, endYear: values.isRecurring ? values.endYear : values.startYear };
    if (editingId) await update.mutateAsync({ id: editingId, dto });
    else await create.mutateAsync(dto);
    setOpen(false);
  });

  const toggleAccount = (accountId: number) => {
    setValue(
      "linkedAccountIds",
      linkedAccountIds.includes(accountId) ? linkedAccountIds.filter((id) => id !== accountId) : [...linkedAccountIds, accountId],
    );
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
                      <Chip key={id} size="small" label={accounts.find((a) => a.id === id)?.label ?? id} />
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
            <FormTextField name="name" control={control} label="Name" autoFocus />
            <FormTextField name="goalType" control={control} label="Goal Type" select>
              {goalTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </FormTextField>
            <Stack direction="row" spacing={2}>
              <FormTextField
                name="targetAmount"
                control={control}
                label={isRecurring ? "Amount per Year (₹)" : "Target Amount (₹, today's value)"}
                type="number"
              />
              <FormTextField name="priority" control={control} label="Priority" select>
                {priorities.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </FormTextField>
            </Stack>
            <FormControlLabel
              control={
                <Switch checked={isRecurring} onChange={(e) => setValue("isRecurring", e.target.checked)} />
              }
              label="Recurring (e.g. ongoing retirement spending)"
            />
            <Stack direction="row" spacing={2}>
              <FormTextField name="startYear" control={control} label="Start Year" type="number" />
              {isRecurring && <FormTextField name="endYear" control={control} label="End Year" type="number" />}
            </Stack>
            <FormTextField
              name="growthRateOverridePct"
              control={control}
              label="Growth Rate Override % (blank = use global inflation)"
              type="number"
              nullable
            />

            <Typography variant="subtitle2">Earmark specific accounts (optional — otherwise funded from the general pool)</Typography>
            <Stack>
              {accounts.map((a) => (
                <FormControlLabel
                  key={a.id}
                  control={<Checkbox checked={linkedAccountIds.includes(a.id)} onChange={() => toggleAccount(a.id)} />}
                  label={a.label}
                />
              ))}
              {accounts.length === 0 && (
                <Typography variant="body2" color="text.secondary">No accounts yet.</Typography>
              )}
            </Stack>
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

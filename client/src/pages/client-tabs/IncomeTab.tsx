import { useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, Table,
  TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useIncomes } from "../../api/queries";
import { formatInr } from "../../utils/currency";
import type { Income, IncomeType, IncomeUpsert } from "../../api/types";

const incomeTypes: IncomeType[] = ["Salary", "Bonus", "Rental", "Pension", "Business", "Other"];

function emptyForm(): IncomeUpsert {
  return { name: "", incomeType: "Salary", annualAmount: 0, startYear: new Date().getFullYear(), endYear: null, annualGrowthRatePct: 6 };
}

export default function IncomeTab({ clientId }: { clientId: number }) {
  const { list, create, update, remove } = useIncomes(clientId);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<IncomeUpsert>(emptyForm());

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (i: Income) => {
    setEditingId(i.id);
    setForm({ name: i.name, incomeType: i.incomeType, annualAmount: i.annualAmount, startYear: i.startYear, endYear: i.endYear, annualGrowthRatePct: i.annualGrowthRatePct });
    setOpen(true);
  };

  const save = async () => {
    if (editingId) await update.mutateAsync({ id: editingId, dto: form });
    else await create.mutateAsync(form);
    setOpen(false);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Income Sources</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Income
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align="right">Annual Amount</TableCell>
            <TableCell>Years</TableCell>
            <TableCell align="right">Growth</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {list.data?.map((i) => (
            <TableRow key={i.id}>
              <TableCell>{i.name}</TableCell>
              <TableCell>{i.incomeType}</TableCell>
              <TableCell align="right">{formatInr(i.annualAmount)}</TableCell>
              <TableCell>{i.startYear} – {i.endYear ?? "ongoing"}</TableCell>
              <TableCell align="right">{i.annualGrowthRatePct}%</TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => openEdit(i)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => remove.mutate(i.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {list.data?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography color="text.secondary" align="center" py={2}>
                  No income sources yet.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Income" : "Add Income"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="Type" select value={form.incomeType} onChange={(e) => setForm({ ...form, incomeType: e.target.value as IncomeType })} fullWidth>
              {incomeTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Annual Amount (₹)"
              type="number"
              value={form.annualAmount}
              onChange={(e) => setForm({ ...form, annualAmount: Number(e.target.value) })}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Start Year"
                type="number"
                value={form.startYear}
                onChange={(e) => setForm({ ...form, startYear: Number(e.target.value) })}
                fullWidth
              />
              <TextField
                label="End Year (blank = ongoing)"
                type="number"
                value={form.endYear ?? ""}
                onChange={(e) => setForm({ ...form, endYear: e.target.value === "" ? null : Number(e.target.value) })}
                fullWidth
              />
            </Stack>
            <TextField
              label="Annual Growth Rate (%)"
              type="number"
              value={form.annualGrowthRatePct}
              onChange={(e) => setForm({ ...form, annualGrowthRatePct: Number(e.target.value) })}
              fullWidth
            />
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

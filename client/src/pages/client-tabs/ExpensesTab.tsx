import { useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, Table,
  TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useExpenses } from "../../api/queries";
import { formatInr } from "../../utils/currency";
import type { Expense, ExpenseCategory, ExpenseUpsert } from "../../api/types";

const categories: ExpenseCategory[] = ["Essential", "Discretionary", "Healthcare", "Housing", "Other"];

function emptyForm(): ExpenseUpsert {
  return { name: "", category: "Essential", annualAmount: 0, startYear: new Date().getFullYear(), endYear: null, growthRateOverridePct: null };
}

export default function ExpensesTab({ clientId }: { clientId: number }) {
  const { list, create, update, remove } = useExpenses(clientId);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ExpenseUpsert>(emptyForm());

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditingId(e.id);
    setForm({ name: e.name, category: e.category, annualAmount: e.annualAmount, startYear: e.startYear, endYear: e.endYear, growthRateOverridePct: e.growthRateOverridePct });
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
        <Typography variant="h6">Expenses</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Expense
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Category</TableCell>
            <TableCell align="right">Annual Amount</TableCell>
            <TableCell>Years</TableCell>
            <TableCell align="right">Growth</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {list.data?.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{e.name}</TableCell>
              <TableCell>{e.category}</TableCell>
              <TableCell align="right">{formatInr(e.annualAmount)}</TableCell>
              <TableCell>{e.startYear} – {e.endYear ?? "ongoing"}</TableCell>
              <TableCell align="right">{e.growthRateOverridePct != null ? `${e.growthRateOverridePct}%` : "inflation"}</TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => openEdit(e)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => remove.mutate(e.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {list.data?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography color="text.secondary" align="center" py={2}>
                  No expenses yet.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Expense" : "Add Expense"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="Category" select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })} fullWidth>
              {categories.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
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
              label="Growth Rate Override % (blank = use global inflation)"
              type="number"
              value={form.growthRateOverridePct ?? ""}
              onChange={(e) => setForm({ ...form, growthRateOverridePct: e.target.value === "" ? null : Number(e.target.value) })}
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

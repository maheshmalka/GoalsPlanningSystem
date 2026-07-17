import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, Table,
  TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useExpenses } from "../../api/queries";
import { formatInr } from "../../utils/currency";
import { FormTextField } from "../../components/FormTextField";
import { expenseSchema, type ExpenseFormValues } from "../../validation/schemas";
import type { Expense } from "../../api/types";

const categories = ["Essential", "Discretionary", "Healthcare", "Housing", "Other"];

const defaultValues: ExpenseFormValues = {
  name: "", category: "Essential", annualAmount: 0, startYear: new Date().getFullYear(), endYear: null, growthRateOverridePct: null,
};

export default function ExpensesTab({ planId }: { planId: number }) {
  const { list, create, update, remove } = useExpenses(planId);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { control, handleSubmit, reset } = useForm<z.input<typeof expenseSchema>, any, ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues,
  });

  const openCreate = () => {
    setEditingId(null);
    reset(defaultValues);
    setOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditingId(e.id);
    reset({ name: e.name, category: e.category, annualAmount: e.annualAmount, startYear: e.startYear, endYear: e.endYear, growthRateOverridePct: e.growthRateOverridePct });
    setOpen(true);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (editingId) await update.mutateAsync({ id: editingId, dto: values });
    else await create.mutateAsync(values);
    setOpen(false);
  });

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
            <FormTextField name="name" control={control} label="Name" autoFocus />
            <FormTextField name="category" control={control} label="Category" select>
              {categories.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </FormTextField>
            <FormTextField name="annualAmount" control={control} label="Annual Amount (₹)" type="number" />
            <Stack direction="row" spacing={2}>
              <FormTextField name="startYear" control={control} label="Start Year" type="number" />
              <FormTextField name="endYear" control={control} label="End Year (blank = ongoing)" type="number" nullable />
            </Stack>
            <FormTextField
              name="growthRateOverridePct"
              control={control}
              label="Growth Rate Override % (blank = use global inflation)"
              type="number"
              nullable
            />
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

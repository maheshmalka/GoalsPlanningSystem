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
import { useIncomes } from "../../api/queries";
import { formatInr } from "../../utils/currency";
import { FormTextField } from "../../components/FormTextField";
import { incomeSchema, type IncomeFormValues } from "../../validation/schemas";
import type { Income } from "../../api/types";

const incomeTypes = ["Salary", "Bonus", "Rental", "Pension", "Business", "Other"];

const defaultValues: IncomeFormValues = {
  name: "", incomeType: "Salary", annualAmount: 0, startYear: new Date().getFullYear(), endYear: null, annualGrowthRatePct: 6,
};

export default function IncomeTab({ clientId }: { clientId: number }) {
  const { list, create, update, remove } = useIncomes(clientId);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { control, handleSubmit, reset } = useForm<z.input<typeof incomeSchema>, any, IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues,
  });

  const openCreate = () => {
    setEditingId(null);
    reset(defaultValues);
    setOpen(true);
  };

  const openEdit = (i: Income) => {
    setEditingId(i.id);
    reset({ name: i.name, incomeType: i.incomeType, annualAmount: i.annualAmount, startYear: i.startYear, endYear: i.endYear, annualGrowthRatePct: i.annualGrowthRatePct });
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
            <FormTextField name="name" control={control} label="Name" autoFocus />
            <FormTextField name="incomeType" control={control} label="Type" select>
              {incomeTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </FormTextField>
            <FormTextField name="annualAmount" control={control} label="Annual Amount (₹)" type="number" />
            <Stack direction="row" spacing={2}>
              <FormTextField name="startYear" control={control} label="Start Year" type="number" />
              <FormTextField name="endYear" control={control} label="End Year (blank = ongoing)" type="number" nullable />
            </Stack>
            <FormTextField name="annualGrowthRatePct" control={control} label="Annual Growth Rate (%)" type="number" />
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

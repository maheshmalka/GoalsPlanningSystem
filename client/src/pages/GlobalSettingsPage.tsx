import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Alert, Box, Button, Card, CardContent, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import {
  useAssetClasses, useCapitalGainsRules, useCorrelations, useGlobalSettings, useTaxSettingsList, useTaxSlabs,
  useUpdateAssetClass, useUpdateCapitalGainsRule, useUpdateCorrelation, useUpdateGlobalSettings, useUpdateTaxSettings,
  useUpdateTaxSlab,
} from "../api/queries";
import { FormTextField } from "../components/FormTextField";
import {
  assetClassSchema, capitalGainsRuleSchema, correlationSchema, globalSettingsSchema, taxSettingsSchema, taxSlabSchema,
  type AssetClassFormValues, type CapitalGainsRuleFormValues, type CorrelationFormValues, type GlobalSettingsFormValues,
  type TaxSettingsFormValues, type TaxSlabFormValues,
} from "../validation/schemas";
import type { AssetClass, CapitalGainsRule, Correlation, TaxSettingsEntry, TaxSlab } from "../api/types";

function AssetClassRow({ ac }: { ac: AssetClass }) {
  const update = useUpdateAssetClass();
  const { control, handleSubmit, formState: { isDirty } } = useForm<z.input<typeof assetClassSchema>, any, AssetClassFormValues>({
    resolver: zodResolver(assetClassSchema),
    defaultValues: { expectedAnnualReturnPct: ac.expectedAnnualReturnPct, annualVolatilityPct: ac.annualVolatilityPct },
  });
  const onSubmit = handleSubmit((values) => update.mutate({ id: ac.id, dto: values }));

  return (
    <TableRow>
      <TableCell>{ac.name}</TableCell>
      <TableCell>
        <FormTextField name="expectedAnnualReturnPct" control={control} type="number" sx={{ width: 110 }} />
      </TableCell>
      <TableCell>
        <FormTextField name="annualVolatilityPct" control={control} type="number" sx={{ width: 110 }} />
      </TableCell>
      <TableCell align="right">
        <Button size="small" disabled={!isDirty} onClick={onSubmit}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

function CorrelationRow({ c, nameA, nameB }: { c: Correlation; nameA: string; nameB: string }) {
  const update = useUpdateCorrelation();
  const { control, handleSubmit, formState: { isDirty } } = useForm<z.input<typeof correlationSchema>, any, CorrelationFormValues>({
    resolver: zodResolver(correlationSchema),
    defaultValues: { correlation: c.correlation },
  });
  const onSubmit = handleSubmit((values) => update.mutate({ ...c, ...values }));

  return (
    <TableRow>
      <TableCell>{nameA} × {nameB}</TableCell>
      <TableCell>
        <FormTextField name="correlation" control={control} type="number" sx={{ width: 110 }} inputProps={{ step: 0.05, min: -1, max: 1 }} />
      </TableCell>
      <TableCell align="right">
        <Button size="small" disabled={!isDirty} onClick={onSubmit}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

function TaxSlabRow({ slab }: { slab: TaxSlab }) {
  const update = useUpdateTaxSlab();
  const { control, handleSubmit, formState: { isDirty } } = useForm<z.input<typeof taxSlabSchema>, any, TaxSlabFormValues>({
    resolver: zodResolver(taxSlabSchema),
    defaultValues: { lowerBound: slab.lowerBound, upperBound: slab.upperBound, ratePct: slab.ratePct },
  });
  const onSubmit = handleSubmit((values) => update.mutate({ ...slab, ...values }));

  return (
    <TableRow>
      <TableCell>₹{slab.lowerBound.toLocaleString("en-IN")}</TableCell>
      <TableCell>
        <FormTextField name="upperBound" control={control} type="number" placeholder="No cap" nullable sx={{ width: 140 }} />
      </TableCell>
      <TableCell>
        <FormTextField name="ratePct" control={control} type="number" sx={{ width: 100 }} />
      </TableCell>
      <TableCell align="right">
        <Button size="small" disabled={!isDirty} onClick={onSubmit}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

function TaxSettingsCard({ settings }: { settings: TaxSettingsEntry }) {
  const update = useUpdateTaxSettings();
  const { control, handleSubmit, formState: { isDirty } } = useForm<z.input<typeof taxSettingsSchema>, any, TaxSettingsFormValues>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues: {
      standardDeduction: settings.standardDeduction, rebateIncomeThreshold: settings.rebateIncomeThreshold,
      rebateMaxAmount: settings.rebateMaxAmount, cessPct: settings.cessPct,
    },
  });
  const onSubmit = handleSubmit((values) => update.mutate({ ...settings, ...values }));

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>{settings.regime} Regime</Typography>
        <Stack spacing={2}>
          <FormTextField name="standardDeduction" control={control} label="Standard Deduction (₹)" type="number" />
          <FormTextField name="rebateIncomeThreshold" control={control} label="Rebate Income Threshold (₹)" type="number" />
          <FormTextField name="rebateMaxAmount" control={control} label="Rebate Max Amount (₹)" type="number" />
          <FormTextField name="cessPct" control={control} label="Cess (%)" type="number" />
          <Button variant="outlined" disabled={!isDirty} onClick={onSubmit}>Save</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function CapitalGainsRuleRow({ rule }: { rule: CapitalGainsRule }) {
  const update = useUpdateCapitalGainsRule();
  const { control, handleSubmit, formState: { isDirty } } = useForm<z.input<typeof capitalGainsRuleSchema>, any, CapitalGainsRuleFormValues>({
    resolver: zodResolver(capitalGainsRuleSchema),
    defaultValues: { longTermRatePct: rule.longTermRatePct, longTermExemptionAmount: rule.longTermExemptionAmount },
  });
  const onSubmit = handleSubmit((values) => update.mutate({ ...rule, ...values }));

  return (
    <TableRow>
      <TableCell>{rule.assetCategory}</TableCell>
      <TableCell>{rule.shortTermTaxedAtSlabRate ? "Always slab rate" : `${rule.holdingPeriodMonthsThreshold}mo`}</TableCell>
      <TableCell>
        <FormTextField name="longTermRatePct" control={control} type="number" sx={{ width: 100 }} />
      </TableCell>
      <TableCell>
        <FormTextField name="longTermExemptionAmount" control={control} type="number" sx={{ width: 130 }} />
      </TableCell>
      <TableCell align="right">
        <Button size="small" disabled={!isDirty} onClick={onSubmit}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function GlobalSettingsPage() {
  const { data: settings } = useGlobalSettings();
  const updateSettings = useUpdateGlobalSettings();
  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<z.input<typeof globalSettingsSchema>, any, GlobalSettingsFormValues>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: { inflationRatePct: 7, simulationCount: 2000 },
  });

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  const { data: assetClasses } = useAssetClasses();
  const { data: correlations } = useCorrelations();
  const { data: taxSlabs } = useTaxSlabs();
  const { data: taxSettings } = useTaxSettingsList();
  const { data: cgtRules } = useCapitalGainsRules();

  const nameFor = (id: number) => assetClasses?.find((a) => a.id === id)?.name ?? String(id);
  const onSubmitGeneral = handleSubmit((values) => updateSettings.mutate(values));

  return (
    <Box>
      <Typography variant="h4" mb={3}>Global Settings</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>General</Typography>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <FormTextField name="inflationRatePct" control={control} label="Inflation Rate (%)" type="number" sx={{ width: 200 }} />
            <FormTextField name="simulationCount" control={control} label="Monte Carlo Simulation Count" type="number" sx={{ width: 260 }} />
            <Button variant="contained" disabled={!isDirty} onClick={onSubmitGeneral}>
              Save
            </Button>
          </Stack>
          {updateSettings.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Saved.</Alert>}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Asset Class Assumptions</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Asset Class</TableCell>
                <TableCell>Expected Return (%)</TableCell>
                <TableCell>Volatility (%)</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {assetClasses?.map((ac) => <AssetClassRow key={ac.id} ac={ac} />)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Correlation Matrix</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Pair</TableCell>
                <TableCell>Correlation (-1 to 1)</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {correlations?.map((c) => (
                <CorrelationRow key={`${c.assetClassAId}-${c.assetClassBId}`} c={c} nameA={nameFor(c.assetClassAId)} nameB={nameFor(c.assetClassBId)} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Grid container spacing={3} mb={3}>
        {taxSettings?.map((s) => (
          <Grid key={s.regime} size={{ xs: 12, md: 6 }}>
            <TaxSettingsCard settings={s} />
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Income Tax Slabs</Typography>
          {(["New", "Old"] as const).map((regime) => (
            <Box key={regime} mb={2}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>{regime} Regime</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>From (₹)</TableCell>
                    <TableCell>To (₹)</TableCell>
                    <TableCell>Rate (%)</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taxSlabs?.filter((s) => s.regime === regime).sort((a, b) => a.slabOrder - b.slabOrder).map((s) => (
                    <TaxSlabRow key={s.id} slab={s} />
                  ))}
                </TableBody>
              </Table>
            </Box>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Capital Gains Rules</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Asset Category</TableCell>
                <TableCell>Long-Term Holding Period</TableCell>
                <TableCell>Long-Term Rate (%)</TableCell>
                <TableCell>Annual Exemption (₹)</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {cgtRules?.map((r) => <CapitalGainsRuleRow key={r.assetCategory} rule={r} />)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}

import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from "@mui/material";
import {
  useAssetClasses, useCapitalGainsRules, useCorrelations, useGlobalSettings, useTaxSettingsList, useTaxSlabs,
  useUpdateAssetClass, useUpdateCapitalGainsRule, useUpdateCorrelation, useUpdateGlobalSettings, useUpdateTaxSettings,
  useUpdateTaxSlab,
} from "../api/queries";
import type { AssetClass, CapitalGainsRule, Correlation, TaxSettingsEntry, TaxSlab } from "../api/types";

function AssetClassRow({ ac }: { ac: AssetClass }) {
  const [expReturn, setExpReturn] = useState(ac.expectedAnnualReturnPct);
  const [vol, setVol] = useState(ac.annualVolatilityPct);
  const update = useUpdateAssetClass();
  const dirty = expReturn !== ac.expectedAnnualReturnPct || vol !== ac.annualVolatilityPct;

  return (
    <TableRow>
      <TableCell>{ac.name}</TableCell>
      <TableCell>
        <TextField size="small" type="number" value={expReturn} onChange={(e) => setExpReturn(Number(e.target.value))} sx={{ width: 100 }} />
      </TableCell>
      <TableCell>
        <TextField size="small" type="number" value={vol} onChange={(e) => setVol(Number(e.target.value))} sx={{ width: 100 }} />
      </TableCell>
      <TableCell align="right">
        <Button size="small" disabled={!dirty} onClick={() => update.mutate({ id: ac.id, dto: { expectedAnnualReturnPct: expReturn, annualVolatilityPct: vol } })}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

function CorrelationRow({ c, nameA, nameB }: { c: Correlation; nameA: string; nameB: string }) {
  const [value, setValue] = useState(c.correlation);
  const update = useUpdateCorrelation();
  const dirty = value !== c.correlation;

  return (
    <TableRow>
      <TableCell>{nameA} × {nameB}</TableCell>
      <TableCell>
        <TextField size="small" type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} sx={{ width: 100 }} inputProps={{ step: 0.05, min: -1, max: 1 }} />
      </TableCell>
      <TableCell align="right">
        <Button size="small" disabled={!dirty} onClick={() => update.mutate({ ...c, correlation: value })}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

function TaxSlabRow({ slab }: { slab: TaxSlab }) {
  const [upper, setUpper] = useState(slab.upperBound);
  const [rate, setRate] = useState(slab.ratePct);
  const update = useUpdateTaxSlab();
  const dirty = upper !== slab.upperBound || rate !== slab.ratePct;

  return (
    <TableRow>
      <TableCell>₹{slab.lowerBound.toLocaleString("en-IN")}</TableCell>
      <TableCell>
        <TextField size="small" type="number" placeholder="No cap" value={upper ?? ""} onChange={(e) => setUpper(e.target.value === "" ? null : Number(e.target.value))} sx={{ width: 130 }} />
      </TableCell>
      <TableCell>
        <TextField size="small" type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} sx={{ width: 90 }} />
      </TableCell>
      <TableCell align="right">
        <Button size="small" disabled={!dirty} onClick={() => update.mutate({ ...slab, upperBound: upper, ratePct: rate })}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

function TaxSettingsCard({ settings }: { settings: TaxSettingsEntry }) {
  const [form, setForm] = useState(settings);
  const update = useUpdateTaxSettings();
  const dirty = JSON.stringify(form) !== JSON.stringify(settings);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>{settings.regime} Regime</Typography>
        <Stack spacing={2}>
          <TextField label="Standard Deduction (₹)" type="number" size="small" value={form.standardDeduction} onChange={(e) => setForm({ ...form, standardDeduction: Number(e.target.value) })} />
          <TextField label="Rebate Income Threshold (₹)" type="number" size="small" value={form.rebateIncomeThreshold} onChange={(e) => setForm({ ...form, rebateIncomeThreshold: Number(e.target.value) })} />
          <TextField label="Rebate Max Amount (₹)" type="number" size="small" value={form.rebateMaxAmount} onChange={(e) => setForm({ ...form, rebateMaxAmount: Number(e.target.value) })} />
          <TextField label="Cess (%)" type="number" size="small" value={form.cessPct} onChange={(e) => setForm({ ...form, cessPct: Number(e.target.value) })} />
          <Button variant="outlined" disabled={!dirty} onClick={() => update.mutate(form)}>Save</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function CapitalGainsRuleRow({ rule }: { rule: CapitalGainsRule }) {
  const [longTermRate, setLongTermRate] = useState(rule.longTermRatePct);
  const [exemption, setExemption] = useState(rule.longTermExemptionAmount);
  const update = useUpdateCapitalGainsRule();
  const dirty = longTermRate !== rule.longTermRatePct || exemption !== rule.longTermExemptionAmount;

  return (
    <TableRow>
      <TableCell>{rule.assetCategory}</TableCell>
      <TableCell>{rule.shortTermTaxedAtSlabRate ? "Always slab rate" : `${rule.holdingPeriodMonthsThreshold}mo`}</TableCell>
      <TableCell>
        <TextField size="small" type="number" value={longTermRate} onChange={(e) => setLongTermRate(Number(e.target.value))} sx={{ width: 90 }} />
      </TableCell>
      <TableCell>
        <TextField size="small" type="number" value={exemption} onChange={(e) => setExemption(Number(e.target.value))} sx={{ width: 120 }} />
      </TableCell>
      <TableCell align="right">
        <Button size="small" disabled={!dirty} onClick={() => update.mutate({ ...rule, longTermRatePct: longTermRate, longTermExemptionAmount: exemption })}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function GlobalSettingsPage() {
  const { data: settings } = useGlobalSettings();
  const updateSettings = useUpdateGlobalSettings();
  const [inflation, setInflation] = useState<number | null>(null);
  const [simCount, setSimCount] = useState<number | null>(null);

  useEffect(() => {
    if (settings) {
      setInflation(settings.inflationRatePct);
      setSimCount(settings.simulationCount);
    }
  }, [settings]);

  const { data: assetClasses } = useAssetClasses();
  const { data: correlations } = useCorrelations();
  const { data: taxSlabs } = useTaxSlabs();
  const { data: taxSettings } = useTaxSettingsList();
  const { data: cgtRules } = useCapitalGainsRules();

  const nameFor = (id: number) => assetClasses?.find((a) => a.id === id)?.name ?? String(id);
  const dirty = settings && (inflation !== settings.inflationRatePct || simCount !== settings.simulationCount);

  return (
    <Box>
      <Typography variant="h4" mb={3}>Global Settings</Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>General</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField label="Inflation Rate (%)" type="number" value={inflation ?? ""} onChange={(e) => setInflation(Number(e.target.value))} sx={{ width: 200 }} />
            <TextField label="Monte Carlo Simulation Count" type="number" value={simCount ?? ""} onChange={(e) => setSimCount(Number(e.target.value))} sx={{ width: 260 }} />
            <Button
              variant="contained"
              disabled={!dirty}
              onClick={() => inflation != null && simCount != null && updateSettings.mutate({ inflationRatePct: inflation, simulationCount: simCount })}
            >
              Save
            </Button>
          </Stack>
          {updateSettings.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Saved.</Alert>}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
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

      <Card variant="outlined" sx={{ mb: 3 }}>
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

      <Card variant="outlined" sx={{ mb: 3 }}>
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

      <Card variant="outlined">
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

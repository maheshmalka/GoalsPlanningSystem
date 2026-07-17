import { useNavigate, useParams } from "react-router-dom";
import {
  Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Grid, Stack, Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useProjection, usePlan } from "../api/queries";
import type { GoalOutcome, YearlyProjectionBand } from "../api/types";
import { formatInr, formatInrCompact, formatPercent } from "../utils/currency";
import { palette } from "../theme";

const colors = {
  band: "#C7D3DE",
  worst: palette.error,
  average: palette.navy,
  best: palette.success,
  income: palette.success,
  expense: palette.error,
  net: palette.gold,
  grid: palette.border,
  axis: palette.textSecondary,
};

function StatTile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "warning" | "critical" }) {
  const toneColor = tone === "good" ? "#0ca30c" : tone === "critical" ? "#d03b3b" : tone === "warning" ? "#c98500" : undefined;
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ color: toneColor }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProjectionsPage() {
  const { id } = useParams();
  const planId = Number(id);
  const navigate = useNavigate();
  const { data: plan } = usePlan(planId);
  const projection = useProjection(planId);

  const result = projection.data;
  const bandData = result?.projectionBands.map((b: YearlyProjectionBand) => ({
    year: b.year,
    base: b.worstCase,
    band: b.bestCase - b.worstCase,
    averageCase: b.averageCase,
    bestCase: b.bestCase,
    worstCase: b.worstCase,
  }));

  const successTone = (pct: number) => (pct >= 75 ? "good" : pct >= 50 ? "warning" : "critical");

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/plans/${planId}`)}>
            Back
          </Button>
          <Typography variant="h4">Projections{plan ? ` — ${plan.name}` : ""}</Typography>
        </Stack>
        <Button variant="outlined" startIcon={<RefreshIcon />} disabled={projection.isFetching} onClick={() => projection.refetch()}>
          Re-run
        </Button>
      </Stack>

      {projection.isFetching && (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} mt={8}>
          <CircularProgress />
          <Typography color="text.secondary">Running Monte Carlo simulation…</Typography>
        </Box>
      )}

      {projection.isError && (
        <Alert severity="error">
          Could not run the projection. Make sure the client has at least one account with an asset allocation.
        </Alert>
      )}

      {result && (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatTile
                label="Probability of Plan Success"
                value={formatPercent(result.probabilityOfPlanSuccessPct, 0)}
                sub="Living expenses fully funded"
                tone={successTone(result.probabilityOfPlanSuccessPct)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatTile
                label="Funding Ratio"
                value={result.fundingRatio != null ? result.fundingRatio.toFixed(2) + "x" : "N/A"}
                sub="Assets + future savings ÷ goal cost"
                tone={result.fundingRatio == null ? undefined : result.fundingRatio >= 1 ? "good" : "critical"}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatTile
                label="Worst 3-Month Loss"
                value={formatPercent(result.worst3MonthLossPct, 1)}
                sub="10th percentile rolling drawdown"
                tone="critical"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatTile
                label="Simulated Years"
                value={String(result.projectionBands.length)}
                sub={`${result.projectionBands[0]?.year} – ${result.projectionBands[result.projectionBands.length - 1]?.year}`}
              />
            </Grid>
          </Grid>

          {result.goalOutcomes.length > 0 && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Probability of Achieving Each Goal
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {result.goalOutcomes.map((g: GoalOutcome) => (
                    <Chip
                      key={g.goalId}
                      label={`${g.name}: ${formatPercent(g.probabilityOfSuccessPct, 0)}`}
                      color={g.probabilityOfSuccessPct >= 75 ? "success" : g.probabilityOfSuccessPct >= 50 ? "warning" : "error"}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portfolio Projection — Best / Average / Worst Case
              </Typography>
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={bandData}>
                  <CartesianGrid stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="year" stroke={colors.axis} tickLine={false} />
                  <YAxis stroke={colors.axis} tickLine={false} tickFormatter={(v) => formatInrCompact(v)} width={100} />
                  <Tooltip
                    formatter={(value, name) => [formatInr(Number(value)), String(name)]}
                    labelFormatter={(year) => `Year ${year}`}
                  />
                  <Legend />
                  <Area dataKey="base" stackId="band" stroke="none" fill="transparent" legendType="none" />
                  <Area dataKey="band" stackId="band" stroke="none" fill={colors.band} fillOpacity={0.5} name="Best–Worst Range" legendType="none" />
                  <Line dataKey="worstCase" stroke={colors.worst} strokeWidth={2} strokeDasharray="5 3" dot={false} name="Worst Case" />
                  <Line dataKey="averageCase" stroke={colors.average} strokeWidth={2.5} dot={false} name="Average Case" />
                  <Line dataKey="bestCase" stroke={colors.best} strokeWidth={2} strokeDasharray="5 3" dot={false} name="Best Case" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cashflow Projection (Deterministic)
              </Typography>
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={result.deterministicCashflow}>
                  <CartesianGrid stroke={colors.grid} vertical={false} />
                  <XAxis dataKey="year" stroke={colors.axis} tickLine={false} />
                  <YAxis stroke={colors.axis} tickLine={false} tickFormatter={(v) => formatInrCompact(v)} width={100} />
                  <Tooltip formatter={(value, name) => [formatInr(Number(value)), String(name)]} labelFormatter={(year) => `Year ${year}`} />
                  <Legend />
                  <ReferenceLine y={0} stroke={colors.axis} />
                  <Bar dataKey="income" fill={colors.income} name="Income" />
                  <Bar dataKey="expense" fill={colors.expense} name="Expense" />
                  <Line dataKey="netCashflow" stroke={colors.net} strokeWidth={2} dot={false} name="Net Cashflow" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {result.probabilityOfPlanSuccessPct < 50 && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              This plan has a low probability of fully funding living expenses through the end of the projection
              horizon. Consider increasing contributions, reducing planned expenses, or adjusting the retirement age.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}

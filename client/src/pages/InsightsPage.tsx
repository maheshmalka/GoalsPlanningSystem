import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { usePlan, useRunInsights } from "../api/queries";
import { formatPercent } from "../utils/currency";
import { palette } from "../theme";

export default function InsightsPage() {
  const { id } = useParams();
  const planId = Number(id);
  const navigate = useNavigate();
  const { data: plan } = usePlan(planId);
  const insights = useRunInsights();

  useEffect(() => {
    if (planId) insights.mutate(planId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const result = insights.data;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/plans/${planId}`)}>
            Back
          </Button>
          <Typography variant="h4">AI Insights{plan ? ` — ${plan.name}` : ""}</Typography>
        </Stack>
        <Button variant="outlined" startIcon={<RefreshIcon />} disabled={insights.isPending} onClick={() => insights.mutate(planId)}>
          Re-run
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Each suggestion below re-runs the actual Monte Carlo simulation with one change applied, so the
        numbers are real simulation results — not a guess. Treat them as directional; re-check the exact
        figures on the Projections page after actually applying a change.
      </Typography>

      {insights.isPending && (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} mt={8}>
          <CircularProgress />
          <Typography color="text.secondary">Evaluating scenarios…</Typography>
        </Box>
      )}

      {insights.isError && (
        <Alert severity="error">
          Could not generate insights. Make sure the client has at least one account with an asset allocation.
        </Alert>
      )}

      {result && (
        <>
          <Card variant="outlined" sx={{ mb: 3, borderColor: palette.gold }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <TipsAndUpdatesIcon sx={{ color: palette.gold, fontSize: 32 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Current baseline
                </Typography>
                <Typography variant="h6">
                  {formatPercent(result.baselineProbabilityOfSuccessPct, 0)} probability of success
                  {result.baselineFundingRatio != null && ` · ${result.baselineFundingRatio.toFixed(2)}x funding ratio`}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {result.insights.length === 0 && (
            <Alert severity="info">
              No applicable actions were found for this plan — it likely needs at least one account, income,
              expense, or goal for these scenarios to apply.
            </Alert>
          )}

          <Stack spacing={2}>
            {result.insights.map((insight) => {
              const improved = insight.probabilityDeltaPct > 0.05;
              const noChange = Math.abs(insight.probabilityDeltaPct) <= 0.05;
              return (
                <Card key={insight.id} variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
                      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, minWidth: 240 }}>
                        <TrendingUpIcon sx={{ color: improved ? palette.success : palette.textSecondary, mt: 0.3 }} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {insight.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mt={0.5}>
                            {insight.description}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack alignItems="flex-end" spacing={0.5}>
                        <Chip
                          label={
                            noChange
                              ? "No meaningful change"
                              : `${formatPercent(insight.baselineProbabilityOfSuccessPct, 0)} → ${formatPercent(insight.projectedProbabilityOfSuccessPct, 0)}`
                          }
                          color={noChange ? "default" : improved ? "success" : "error"}
                          sx={{ fontWeight: 700 }}
                        />
                        {insight.baselineFundingRatio != null && insight.projectedFundingRatio != null && (
                          <Typography variant="caption" color="text.secondary">
                            Funding ratio: {insight.baselineFundingRatio.toFixed(2)}x → {insight.projectedFundingRatio.toFixed(2)}x
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </>
      )}
    </Box>
  );
}

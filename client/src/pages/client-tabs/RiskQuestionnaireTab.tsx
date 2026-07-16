import { useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, FormControl, FormControlLabel, FormLabel, LinearProgress,
  Radio, RadioGroup, Stack, Typography,
} from "@mui/material";
import { useRiskQuestions, useRiskResult, useSubmitRiskQuestionnaire } from "../../api/queries";

const riskColor: Record<string, "success" | "info" | "warning" | "error" | "default"> = {
  Conservative: "info",
  ModeratelyConservative: "info",
  Moderate: "warning",
  ModeratelyAggressive: "warning",
  Aggressive: "error",
};

export default function RiskQuestionnaireTab({ clientId }: { clientId: number }) {
  const { data: questions } = useRiskQuestions();
  const { data: result } = useRiskResult(clientId);
  const submit = useSubmitRiskQuestionnaire(clientId);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const allAnswered = questions ? questions.every((q) => answers[q.id] != null) : false;

  const handleSubmit = () => {
    submit.mutate(Object.entries(answers).map(([questionId, optionId]) => ({ questionId: Number(questionId), optionId })));
  };

  return (
    <Box>
      {result && result.rawScore > 0 && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Risk Profile
                </Typography>
                <Chip label={result.override ?? result.computedProfile} color={riskColor[result.override ?? result.computedProfile]} sx={{ mt: 0.5 }} />
                {result.override && (
                  <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                    Computed: {result.computedProfile} (overridden by advisor in Demographics tab)
                  </Typography>
                )}
              </Box>
              <Box width={200}>
                <Typography variant="caption" color="text.secondary">
                  Score: {result.scorePercentage.toFixed(0)}%
                </Typography>
                <LinearProgress variant="determinate" value={result.scorePercentage} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Stack spacing={3}>
        {questions?.map((q, idx) => (
          <Card key={q.id} variant="outlined">
            <CardContent>
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontWeight: 600, color: "text.primary" }}>
                  {idx + 1}. {q.text}
                </FormLabel>
                <RadioGroup
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: Number(e.target.value) })}
                >
                  {q.options.map((o) => (
                    <FormControlLabel key={o.id} value={o.id} control={<Radio />} label={o.text} />
                  ))}
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {submit.isSuccess && <Alert severity="success" sx={{ mt: 2 }}>Risk profile updated.</Alert>}

      <Button variant="contained" sx={{ mt: 3 }} disabled={!allAnswered || submit.isPending} onClick={handleSubmit}>
        Submit Questionnaire
      </Button>
    </Box>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  Account, AccountUpsert, AssetClass, CapitalGainsRule, ClientDetail, ClientListItem, ClientUpsert,
  Correlation, Expense, ExpenseUpsert, Goal, GoalUpsert, Income, IncomeUpsert, Plan, PlanDetail, PlanUpsert,
  RiskQuestion, RiskResult, SimulationResult, TaxSettingsEntry, TaxSlab,
} from "./types";

// --- Plans ---
export const usePlans = (search?: string) =>
  useQuery({
    queryKey: ["plans", search ?? ""],
    queryFn: async () => (await apiClient.get<Plan[]>("/plans", { params: search ? { search } : undefined })).data,
  });

export const usePlan = (id: number) =>
  useQuery({
    queryKey: ["plans", id],
    queryFn: async () => (await apiClient.get<PlanDetail>(`/plans/${id}`)).data,
    enabled: !!id,
  });

export const useCreatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: PlanUpsert) => (await apiClient.post<PlanDetail>("/plans", dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
};

export const useUpdatePlan = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: PlanUpsert) => (await apiClient.put<PlanDetail>(`/plans/${id}`, dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["plans", id] });
    },
  });
};

export const useDeletePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
};

/** Plain (non-hook) call for use outside component render, e.g. sequencing "create plan, then add its first client." */
export const addClientToPlan = async (planId: number, dto: ClientUpsert) =>
  (await apiClient.post<ClientListItem>(`/plans/${planId}/clients`, dto)).data;

export const useAddClientToPlan = (planId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: ClientUpsert) => addClientToPlan(planId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["plans", planId] });
    },
  });
};

// --- Clients (individual read/update/delete; creation happens via useAddClientToPlan) ---
export const useClient = (id: number) =>
  useQuery({
    queryKey: ["clients", id],
    queryFn: async () => (await apiClient.get<ClientDetail>(`/clients/${id}`)).data,
    enabled: !!id,
  });

export const useUpdateClient = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: ClientUpsert) => (await apiClient.put<ClientDetail>(`/clients/${id}`, dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["clients", id] });
    },
  });
};

export const useDeleteClient = (planId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/clients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plans"] });
      qc.invalidateQueries({ queryKey: ["plans", planId] });
    },
  });
};

// --- Generic factory for nested sub-resources, keyed off an arbitrary base path ---
function useSubResource<TItem, TUpsert>(basePath: string, key: string, enabled = true) {
  const qc = useQueryClient();
  const listKey = [key, basePath];

  const list = useQuery({
    queryKey: listKey,
    queryFn: async () => (await apiClient.get<TItem[]>(basePath)).data,
    enabled,
  });

  const create = useMutation({
    mutationFn: async (dto: TUpsert) => (await apiClient.post<TItem>(basePath, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
  });

  const update = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: TUpsert }) =>
      (await apiClient.put<TItem>(`${basePath}/${id}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`${basePath}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
  });

  return { list, create, update, remove };
}

// Accounts and Income are individually owned by a client.
export const useAccounts = (clientId: number) =>
  useSubResource<Account, AccountUpsert>(`/clients/${clientId}/accounts`, "accounts", !!clientId);
export const useIncomes = (clientId: number) =>
  useSubResource<Income, IncomeUpsert>(`/clients/${clientId}/incomes`, "incomes", !!clientId);

// Expenses and Goals are shared at the plan (household) level.
export const useExpenses = (planId: number) =>
  useSubResource<Expense, ExpenseUpsert>(`/plans/${planId}/expenses`, "expenses", !!planId);
export const useGoals = (planId: number) =>
  useSubResource<Goal, GoalUpsert>(`/plans/${planId}/goals`, "goals", !!planId);

// --- Risk questionnaire ---
export const useRiskQuestions = () =>
  useQuery({ queryKey: ["risk-questions"], queryFn: async () => (await apiClient.get<RiskQuestion[]>("/risk-questionnaire/questions")).data });

export const useRiskResult = (clientId: number) =>
  useQuery({
    queryKey: ["risk-result", clientId],
    queryFn: async () => (await apiClient.get<RiskResult>(`/clients/${clientId}/risk-questionnaire`)).data,
    enabled: !!clientId,
  });

export const useSubmitRiskQuestionnaire = (clientId: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (answers: { questionId: number; optionId: number }[]) =>
      (await apiClient.put<RiskResult>(`/clients/${clientId}/risk-questionnaire`, { answers })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["risk-result", clientId] });
      qc.invalidateQueries({ queryKey: ["clients", clientId] });
      qc.invalidateQueries({ queryKey: ["plans"] });
    },
  });
};

// --- Global settings (reference data shared across all plans) ---
export const useAssetClasses = () =>
  useQuery({ queryKey: ["asset-classes"], queryFn: async () => (await apiClient.get<AssetClass[]>("/global-settings/asset-classes")).data });

export const useUpdateAssetClass = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: { expectedAnnualReturnPct: number; annualVolatilityPct: number } }) =>
      (await apiClient.put<AssetClass>(`/global-settings/asset-classes/${id}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["asset-classes"] }),
  });
};

export const useCorrelations = () =>
  useQuery({ queryKey: ["correlations"], queryFn: async () => (await apiClient.get<Correlation[]>("/global-settings/correlations")).data });

export const useUpdateCorrelation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Correlation) => (await apiClient.put<Correlation>("/global-settings/correlations", dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["correlations"] }),
  });
};

export const useTaxSlabs = () =>
  useQuery({ queryKey: ["tax-slabs"], queryFn: async () => (await apiClient.get<TaxSlab[]>("/global-settings/tax-slabs")).data });

export const useUpdateTaxSlab = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: TaxSlab) => (await apiClient.put<TaxSlab>(`/global-settings/tax-slabs/${dto.id}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tax-slabs"] }),
  });
};

export const useTaxSettingsList = () =>
  useQuery({ queryKey: ["tax-settings"], queryFn: async () => (await apiClient.get<TaxSettingsEntry[]>("/global-settings/tax-settings")).data });

export const useUpdateTaxSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: TaxSettingsEntry) => (await apiClient.put<TaxSettingsEntry>(`/global-settings/tax-settings/${dto.regime}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tax-settings"] }),
  });
};

export const useCapitalGainsRules = () =>
  useQuery({ queryKey: ["cgt-rules"], queryFn: async () => (await apiClient.get<CapitalGainsRule[]>("/global-settings/capital-gains-rules")).data });

export const useUpdateCapitalGainsRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CapitalGainsRule) =>
      (await apiClient.put<CapitalGainsRule>(`/global-settings/capital-gains-rules/${dto.assetCategory}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cgt-rules"] }),
  });
};

// --- Projections ---
export const useRunProjection = () =>
  useMutation({
    mutationFn: async (planId: number) => (await apiClient.post<SimulationResult>(`/plans/${planId}/projections`)).data,
  });

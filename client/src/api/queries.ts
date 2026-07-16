import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type {
  Account, AccountUpsert, AssetClass, CapitalGainsRule, ClientDetail, ClientListItem, ClientUpsert,
  Correlation, Expense, ExpenseUpsert, GlobalSettings, Goal, GoalUpsert, Income, IncomeUpsert,
  RiskQuestion, RiskResult, SimulationResult, TaxSettingsEntry, TaxSlab,
} from "./types";

// --- Clients ---
export const useClients = () =>
  useQuery({ queryKey: ["clients"], queryFn: async () => (await apiClient.get<ClientListItem[]>("/clients")).data });

export const useClient = (id: number) =>
  useQuery({
    queryKey: ["clients", id],
    queryFn: async () => (await apiClient.get<ClientDetail>(`/clients/${id}`)).data,
    enabled: !!id,
  });

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: ClientUpsert) => (await apiClient.post<ClientDetail>("/clients", dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
};

export const useUpdateClient = (id: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: ClientUpsert) => (await apiClient.put<ClientDetail>(`/clients/${id}`, dto)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["clients", id] });
    },
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
};

// --- Generic factory for client sub-resources (Accounts/Incomes/Expenses/Goals) ---
function useSubResource<TItem, TUpsert>(clientId: number, resource: string, key: string) {
  const qc = useQueryClient();
  const listKey = [key, clientId];

  const list = useQuery({
    queryKey: listKey,
    queryFn: async () => (await apiClient.get<TItem[]>(`/clients/${clientId}/${resource}`)).data,
    enabled: !!clientId,
  });

  const create = useMutation({
    mutationFn: async (dto: TUpsert) => (await apiClient.post<TItem>(`/clients/${clientId}/${resource}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
  });

  const update = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: TUpsert }) =>
      (await apiClient.put<TItem>(`/clients/${clientId}/${resource}/${id}`, dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => apiClient.delete(`/clients/${clientId}/${resource}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
  });

  return { list, create, update, remove };
}

export const useAccounts = (clientId: number) => useSubResource<Account, AccountUpsert>(clientId, "accounts", "accounts");
export const useIncomes = (clientId: number) => useSubResource<Income, IncomeUpsert>(clientId, "incomes", "incomes");
export const useExpenses = (clientId: number) => useSubResource<Expense, ExpenseUpsert>(clientId, "expenses", "expenses");
export const useGoals = (clientId: number) => useSubResource<Goal, GoalUpsert>(clientId, "goals", "goals");

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
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
};

// --- Global settings ---
export const useGlobalSettings = () =>
  useQuery({ queryKey: ["global-settings"], queryFn: async () => (await apiClient.get<GlobalSettings>("/global-settings")).data });

export const useUpdateGlobalSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: GlobalSettings) => (await apiClient.put<GlobalSettings>("/global-settings", dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["global-settings"] }),
  });
};

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
    mutationFn: async (clientId: number) => (await apiClient.post<SimulationResult>(`/clients/${clientId}/projections`)).data,
  });

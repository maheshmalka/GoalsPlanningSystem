# Deploying to Azure

These steps are **not run automatically** — the plan was to scaffold and verify everything locally first, then run this only once you've reviewed it and are ready to provision real (billed) Azure resources.

## 1. One-time setup

```bash
az login
az group create --name rg-goalsplanningsystem --location centralindia

# Copy the example params and fill in a real SQL admin password
cp infra/main.parameters.example.json infra/main.parameters.json
# edit infra/main.parameters.json — do not commit the real file (it's gitignored)

az deployment group create \
  --resource-group rg-goalsplanningsystem \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```

This provisions:
- **Azure SQL** (serverless Gen5, auto-pauses after 1 hour idle — minimal cost for a low-traffic solo-advisor app)
- **App Service** (Linux, .NET 10, B1 tier) for the API
- **Static Web App** (Free tier) for the React client

Note the `apiUrl` and `clientUrl` values from the deployment output.

## 2. Configure GitHub Actions

In the GitHub repo's Settings → Secrets and variables → Actions, add:

| Name | Value |
|---|---|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Download from the API App Service → "Get publish profile" in the Azure Portal |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | From the Static Web App resource → "Manage deployment token" |

And as a repo/environment **variable** (not secret):

| Name | Value |
|---|---|
| `VITE_API_BASE_URL` | `<apiUrl>/api` from step 1's output |

Update `AZURE_WEBAPP_NAME` and `AZURE_STATIC_WEB_APP_NAME` in `.github/workflows/deploy.yml` to match the actual generated names (visible in the deployment output as `apiAppName` / `staticWebAppName`).

## 3. First deploy

The API applies EF Core migrations and seeds reference data automatically on startup (see `Program.cs`) — no manual migration step needed. Push to `main` (or merge a PR) to trigger `.github/workflows/deploy.yml`.

## Known simplification

Running migrations on app startup is convenient for a single-instance, low-traffic deployment like this one, but isn't safe if you ever scale the API to multiple instances (concurrent migration runs). Revisit this — e.g. move migration to a separate release step — before scaling out.

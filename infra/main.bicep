// Deploys the Goals Planning System: Azure SQL (serverless), an App Service for the API,
// and a Static Web App for the React client. Deploy into an existing resource group:
//   az group create -n rg-goalsplanningsystem -l centralindia
//   az deployment group create -g rg-goalsplanningsystem -f infra/main.bicep -p infra/main.parameters.json

@description('Short name used to prefix all resources, e.g. "gps"')
param namePrefix string = 'gps'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('SQL admin login name')
param sqlAdminLogin string

@secure()
@description('SQL admin password - pass via parameter file or --parameters at deploy time, never commit it')
param sqlAdminPassword string

@description('App Service Plan SKU. B1 is the cheapest tier that supports always-on; F1 (free) does not.')
param appServicePlanSku string = 'B1'

@description('Azure Static Web Apps is only available in a limited set of regions; eastasia is the closest to India. Does not affect end-user latency since SWA serves via a global CDN.')
param staticWebAppLocation string = 'eastasia'

var uniqueSuffix = uniqueString(resourceGroup().id)
var sqlServerName = '${namePrefix}-sql-${uniqueSuffix}'
var sqlDatabaseName = '${namePrefix}db'
var appServicePlanName = '${namePrefix}-plan'
var apiAppName = '${namePrefix}-api-${uniqueSuffix}'
var staticWebAppName = '${namePrefix}-client-${uniqueSuffix}'

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    minimalTlsVersion: '1.2'
  }
}

resource sqlAllowAzureServices 'Microsoft.Sql/servers/firewallRules@2023-08-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Serverless Gen5, auto-pauses after 1 hour idle to minimize cost for a low-traffic solo-advisor app.
resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: sqlDatabaseName
  location: location
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 1
  }
  properties: {
    autoPauseDelay: 60
    minCapacity: json('0.5')
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: appServicePlanSku
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: staticWebAppLocation
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

resource apiApp 'Microsoft.Web/sites@2023-12-01' = {
  name: apiAppName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|10.0'
      alwaysOn: true
      cors: {
        allowedOrigins: [
          'https://${staticWebApp.properties.defaultHostname}'
        ]
      }
      appSettings: [
        { name: 'DatabaseProvider', value: 'SqlServer' }
        { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
        // Platform-level `cors` above covers browser preflight, but the app's own CORS middleware
        // (Program.cs) reads this setting independently and falls back to localhost without it.
        { name: 'Cors__AllowedOrigins__0', value: 'https://${staticWebApp.properties.defaultHostname}' }
      ]
      connectionStrings: [
        {
          name: 'DefaultConnection'
          connectionString: 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Database=${sqlDatabaseName};User ID=${sqlAdminLogin};Password=${sqlAdminPassword};Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;'
          type: 'SQLAzure'
        }
      ]
    }
  }
}

output apiUrl string = 'https://${apiApp.properties.defaultHostName}'
output clientUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output apiAppName string = apiApp.name
output staticWebAppName string = staticWebApp.name

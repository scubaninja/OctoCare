data "azurerm_client_config" "current" {}

locals {
  prefix                       = lower("${var.project_name}-${var.environment}")
  compact_prefix               = replace(replace(lower("${var.project_name}${var.environment}"), "-", ""), "_", "")
  resource_group_name          = "${local.prefix}-rg"
  acr_name                     = substr("${local.compact_prefix}acr", 0, 50)
  service_plan_name            = "${local.prefix}-plan"
  api_app_name                 = "${local.prefix}-api"
  web_app_name                 = "${local.prefix}-web"
  postgres_server_name         = substr("${local.prefix}-psql", 0, 63)
  postgres_admin_username      = "octocareadmin"
  postgres_database_name       = "octocare"
  container_app_environment    = "${local.prefix}-cae"
  ai_triage_worker_name        = "${local.prefix}-ai-triage"
  sla_worker_name              = "${local.prefix}-sla"
  openai_account_name          = substr("${local.prefix}-openai", 0, 64)
  openai_custom_subdomain      = substr("${local.compact_prefix}openai", 0, 24)
  key_vault_name               = substr("${local.compact_prefix}kv", 0, 24)
  storage_account_name         = substr("${local.compact_prefix}sa", 0, 24)
  attachments_container_name   = "attachments"
  log_analytics_workspace_name = "${local.prefix}-log"
  api_image_name               = "octocare-api:latest"
  web_image_name               = "octocare-web:latest"
  ai_triage_image_name         = "ai-triage-worker:latest"
  sla_worker_image_name        = "sla-worker:latest"
  postgresql_connection_string = "Host=${azurerm_postgresql_flexible_server.main.fqdn};Port=5432;Database=${azurerm_postgresql_flexible_server_database.main.name};Username=${local.postgres_admin_username};Password=${var.database_admin_password};Ssl Mode=Require;Trust Server Certificate=true"
}

resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name
  location = var.location
}

resource "azurerm_log_analytics_workspace" "main" {
  name                = local.log_analytics_workspace_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_container_registry" "main" {
  name                = local.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = false
}

resource "azurerm_service_plan" "main" {
  name                = local.service_plan_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "B2"
}

resource "azurerm_storage_account" "main" {
  name                            = local.storage_account_name
  resource_group_name             = azurerm_resource_group.main.name
  location                        = azurerm_resource_group.main.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
}

resource "azurerm_storage_container" "attachments" {
  name                  = local.attachments_container_name
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_key_vault" "main" {
  name                          = local.key_vault_name
  location                      = azurerm_resource_group.main.location
  resource_group_name           = azurerm_resource_group.main.name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "standard"
  enable_rbac_authorization     = true
  purge_protection_enabled      = true
  soft_delete_retention_days    = 7
  public_network_access_enabled = true
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = local.postgres_server_name
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "16"
  administrator_login    = local.postgres_admin_username
  administrator_password = var.database_admin_password
  storage_mb             = 32768
  sku_name               = "B_Standard_B1ms"
  backup_retention_days  = 7
  zone                   = "1"

  authentication {
    active_directory_auth_enabled = false
    password_auth_enabled         = true
  }
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "allow-azure-services"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = local.postgres_database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_cognitive_account" "openai" {
  name                          = local.openai_account_name
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  kind                          = "OpenAI"
  sku_name                      = "S0"
  custom_subdomain_name         = local.openai_custom_subdomain
  public_network_access_enabled = true
}

resource "azurerm_cognitive_deployment" "gpt4o" {
  name                 = "gpt-4o"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "gpt-4o"
    version = "2024-08-06"
  }

  scale {
    type     = "Standard"
    capacity = 1
  }
}

resource "azurerm_key_vault_secret" "database_admin_password" {
  name         = "database-admin-password"
  value        = var.database_admin_password
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "postgresql_connection_string" {
  name         = "postgresql-connection-string"
  value        = local.postgresql_connection_string
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "openai_endpoint" {
  name         = "azure-openai-endpoint"
  value        = azurerm_cognitive_account.openai.endpoint
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "openai_api_key" {
  name         = "azure-openai-api-key"
  value        = var.openai_api_key
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "storage-connection-string"
  value        = azurerm_storage_account.main.primary_connection_string
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_linux_web_app" "api" {
  name                = local.api_app_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on                               = true
    container_registry_use_managed_identity = true

    application_stack {
      docker_image_name   = local.api_image_name
      docker_registry_url = "https://${azurerm_container_registry.main.login_server}"
    }
  }

  app_settings = {
    WEBSITES_ENABLE_APP_SERVICE_STORAGE  = "false"
    ConnectionStrings__DefaultConnection = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.postgresql_connection_string.versionless_id})"
    AzureOpenAI__Endpoint                = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.openai_endpoint.versionless_id})"
    AzureOpenAI__ApiKey                  = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.openai_api_key.versionless_id})"
    AzureOpenAI__DeploymentName          = azurerm_cognitive_deployment.gpt4o.name
    Storage__ConnectionString            = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.storage_connection_string.versionless_id})"
    Storage__ContainerName               = azurerm_storage_container.attachments.name
  }
}

resource "azurerm_linux_web_app" "web" {
  name                = local.web_app_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on                               = true
    container_registry_use_managed_identity = true

    application_stack {
      docker_image_name   = local.web_image_name
      docker_registry_url = "https://${azurerm_container_registry.main.login_server}"
    }
  }

  app_settings = {
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
    WEBSITES_PORT                       = "3000"
    PORT                                = "3000"
    NEXT_PUBLIC_API_URL                 = "https://${azurerm_linux_web_app.api.default_hostname}"
  }
}

resource "azurerm_container_app_environment" "main" {
  name                       = local.container_app_environment
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

resource "azurerm_container_app" "ai_triage_worker" {
  name                         = local.ai_triage_worker_name
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = "System"
  }

  secret {
    name                = "db-connection"
    key_vault_secret_id = azurerm_key_vault_secret.postgresql_connection_string.versionless_id
    identity            = "System"
  }

  secret {
    name                = "openai-endpoint"
    key_vault_secret_id = azurerm_key_vault_secret.openai_endpoint.versionless_id
    identity            = "System"
  }

  secret {
    name                = "openai-api-key"
    key_vault_secret_id = azurerm_key_vault_secret.openai_api_key.versionless_id
    identity            = "System"
  }

  template {
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "ai-triage-worker"
      image  = "${azurerm_container_registry.main.login_server}/${local.ai_triage_image_name}"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name        = "ConnectionStrings__DefaultConnection"
        secret_name = "db-connection"
      }

      env {
        name        = "AzureOpenAI__Endpoint"
        secret_name = "openai-endpoint"
      }

      env {
        name        = "AzureOpenAI__ApiKey"
        secret_name = "openai-api-key"
      }

      env {
        name  = "AzureOpenAI__DeploymentName"
        value = azurerm_cognitive_deployment.gpt4o.name
      }
    }
  }
}

resource "azurerm_container_app" "sla_worker" {
  name                         = local.sla_worker_name
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"

  identity {
    type = "SystemAssigned"
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = "System"
  }

  secret {
    name                = "db-connection"
    key_vault_secret_id = azurerm_key_vault_secret.postgresql_connection_string.versionless_id
    identity            = "System"
  }

  template {
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "sla-worker"
      image  = "${azurerm_container_registry.main.login_server}/${local.sla_worker_image_name}"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name        = "ConnectionStrings__DefaultConnection"
        secret_name = "db-connection"
      }
    }
  }
}

resource "azurerm_role_assignment" "api_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.api.identity[0].principal_id
}

resource "azurerm_role_assignment" "web_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_web_app.web.identity[0].principal_id
}

resource "azurerm_role_assignment" "ai_triage_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_container_app.ai_triage_worker.identity[0].principal_id
}

resource "azurerm_role_assignment" "sla_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_container_app.sla_worker.identity[0].principal_id
}

resource "azurerm_role_assignment" "api_key_vault_reader" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.api.identity[0].principal_id
}

resource "azurerm_role_assignment" "web_key_vault_reader" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.web.identity[0].principal_id
}

resource "azurerm_role_assignment" "ai_triage_key_vault_reader" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_container_app.ai_triage_worker.identity[0].principal_id
}

resource "azurerm_role_assignment" "sla_key_vault_reader" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_container_app.sla_worker.identity[0].principal_id
}

output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "api_url" {
  value = azurerm_linux_web_app.api.default_hostname
}

output "web_url" {
  value = azurerm_linux_web_app.web.default_hostname
}

output "acr_login_server" {
  value = azurerm_container_registry.main.login_server
}

output "postgresql_fqdn" {
  value     = azurerm_postgresql_flexible_server.main.fqdn
  sensitive = true
}

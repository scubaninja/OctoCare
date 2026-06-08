terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }

  backend "azurerm" {
    resource_group_name  = "octocare-tfstate-rg"
    storage_account_name = "octocaretfstate"
    container_name       = "tfstate"
    key                  = "octocare.tfstate"
  }
}

provider "azurerm" {
  features {}
}

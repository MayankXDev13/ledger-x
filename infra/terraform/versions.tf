terraform {
  required_version = ">= 1.6.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

# Authenticated via CLOUDFLARE_API_TOKEN environment variable (bootstrap token
# with Account -> Account API Tokens: Edit permission).
provider "cloudflare" {}

# Authenticated via GITHUB_TOKEN environment variable (PAT or gh auth token
# with Actions secrets write permission on the repository).
provider "github" {
  owner = var.github_owner
}

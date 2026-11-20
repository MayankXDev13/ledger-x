# Look up Cloudflare Account API token permission group IDs dynamically so they
# are never hardcoded across accounts or API updates.
data "cloudflare_account_api_token_permission_groups_list" "workers_scripts" {
  account_id = var.cloudflare_account_id
  name       = "Workers Scripts Write"
  scope      = "com.cloudflare.api.account"
}

data "cloudflare_account_api_token_permission_groups_list" "pages" {
  account_id = var.cloudflare_account_id
  name       = "Pages Write"
  scope      = "com.cloudflare.api.account"
}

data "cloudflare_account_api_token_permission_groups_list" "account_settings" {
  account_id = var.cloudflare_account_id
  name       = "Account Settings Read"
  scope      = "com.cloudflare.api.account"
}

resource "cloudflare_account_token" "github_cd" {
  account_id = var.cloudflare_account_id
  name       = var.token_name
  status     = "active"
  expires_on = var.token_expires_on

  policies = [
    {
      effect = "allow"
      permission_groups = [
        { id = data.cloudflare_account_api_token_permission_groups_list.workers_scripts.result[0].id },
        { id = data.cloudflare_account_api_token_permission_groups_list.pages.result[0].id },
        { id = data.cloudflare_account_api_token_permission_groups_list.account_settings.result[0].id },
      ]
      resources = jsonencode({
        "com.cloudflare.api.account.${var.cloudflare_account_id}" = "*"
      })
    }
  ]
}

resource "github_actions_secret" "cloudflare_api_token" {
  repository  = var.github_repository
  secret_name = "CLOUDFLARE_API_TOKEN"
  value       = cloudflare_account_token.github_cd.value
}

resource "github_actions_secret" "cloudflare_account_id" {
  repository  = var.github_repository
  secret_name = "CLOUDFLARE_ACCOUNT_ID"
  value       = var.cloudflare_account_id
}

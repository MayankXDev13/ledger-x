output "cloudflare_token_id" {
  description = "ID of the created Cloudflare Account API token."
  value       = cloudflare_account_token.github_cd.id
}

output "cloudflare_token_name" {
  description = "Name of the created Cloudflare Account API token."
  value       = cloudflare_account_token.github_cd.name
}

output "github_secrets_configured" {
  description = "GitHub Actions repository secrets managed by this configuration."
  value = [
    github_actions_secret.cloudflare_api_token.secret_name,
    github_actions_secret.cloudflare_account_id.secret_name,
  ]
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID where Workers and Pages are hosted."
  type        = string
}

variable "github_owner" {
  description = "GitHub user or organization owning the repository."
  type        = string
  default     = "MayankXDev13"
}

variable "github_repository" {
  description = "GitHub repository name where Actions secrets will be written."
  type        = string
  default     = "ledger-x"
}

variable "token_name" {
  description = "Display name of the Cloudflare Account API token created for GitHub Actions CD."
  type        = string
  default     = "GITHUB_CD_CLOUDFLARE_API_TOKEN"
}

variable "token_expires_on" {
  description = "Optional RFC3339 expiration timestamp for the Cloudflare API token (null = no expiration)."
  type        = string
  default     = null
}

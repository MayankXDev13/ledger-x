# Terraform: CI/CD Credentials (Cloudflare + GitHub Actions)

Creates a scoped Cloudflare Account API token (`Workers Scripts Write`, `Pages Write`, `Account Settings Read`) and writes `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` directly into the GitHub repository's Actions secrets for `.github/workflows/deploy.yml`.

## Prerequisites

1. **Bootstrap Cloudflare Account API Token** (one-time):
   - In Cloudflare Dashboard → **Manage Account → Account API tokens → Create Token**
   - Grant **Account → Account API Tokens → Edit** (so Terraform can create/manage the CD token).
2. **GitHub Token**:
   - Either a fine-grained PAT with **Secrets: Read and write** on `MayankXDev13/ledger-x`, or `gh auth token` if your `gh` CLI is logged in with `repo` scope.

## Steps

```bash
cd infra/terraform

# 1. Create your local tfvars and .env files (both gitignored)
cp terraform.tfvars.example terraform.tfvars
cp .env.example .env
# Edit .env and paste your bootstrap CLOUDFLARE_API_TOKEN (and optionally GITHUB_TOKEN)

# 2. Load .env into your shell
set -a && source .env && set +a
export GITHUB_TOKEN="${GITHUB_TOKEN:-$(gh auth token)}"

# 3. Initialize providers
terraform init

# 4. Preview changes
terraform plan

# 5. Apply (creates the Cloudflare CD token and sets both GitHub Actions secrets)
terraform apply
```

> **Note on state security:** `terraform.tfstate` stores the generated `CLOUDFLARE_API_TOKEN` value. It is gitignored—never commit `*.tfstate*` files, and consider moving to a remote encrypted backend (e.g. Cloudflare R2 S3 backend) if multiple people manage this stack.

#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if environment argument is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Environment name is required${NC}"
    echo "Usage: ./scripts/sync-github-env.sh <environment>"
    echo "Example: ./scripts/sync-github-env.sh staging"
    exit 1
fi

ENVIRONMENT=$1
ENV_FILE=".env.${ENVIRONMENT}.local"

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: Environment file '${ENV_FILE}' not found${NC}"
    echo "Create it first: .env.${ENVIRONMENT}.local"
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it: https://cli.github.com/"
    exit 1
fi

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI is not authenticated${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Get repository name
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
if [ -z "$REPO" ]; then
    echo -e "${RED}Error: Not in a GitHub repository${NC}"
    exit 1
fi

echo -e "${BLUE}Syncing environment variables to GitHub${NC}"
echo -e "Repository: ${GREEN}${REPO}${NC}"
echo -e "Environment: ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Source file: ${GREEN}${ENV_FILE}${NC}"
echo ""

# Keywords that indicate a value should be treated as a secret
SECRET_KEYWORDS="SECRET|PASSWORD|KEY|TOKEN|PRIVATE|CREDENTIAL|DATABASE_URL"

# Arrays to track local keys
declare -a LOCAL_SECRETS=()
declare -a LOCAL_VARS=()

# Counters
SECRETS_ADDED=0
VARS_ADDED=0
SECRETS_DELETED=0
VARS_DELETED=0

# Arrays to store jobs
declare -a PIDS=()
declare -a JOB_NAMES=()

# Function to set secret in background
set_secret() {
    local key=$1
    local value=$2
    echo "$value" | gh secret set "$key" --env "$ENVIRONMENT" --repo "$REPO" 2>/dev/null
}

# Function to set variable in background
set_variable() {
    local key=$1
    local value=$2
    gh variable set "$key" --env "$ENVIRONMENT" --body "$value" --repo "$REPO" 2>/dev/null
}

# Function to delete secret
delete_secret() {
    local key=$1
    gh secret delete "$key" --env "$ENVIRONMENT" --repo "$REPO" 2>/dev/null || true
}

# Function to delete variable
delete_variable() {
    local key=$1
    gh variable delete "$key" --env "$ENVIRONMENT" --repo "$REPO" 2>/dev/null || true
}

echo -e "${BLUE}Step 1: Adding/Updating from local file...${NC}"

# Read env file and start parallel jobs
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Extract key and value (handles optional spaces around =)
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=[[:space:]]*(.*)$ ]]; then
        KEY="${BASH_REMATCH[1]}"
        VALUE="${BASH_REMATCH[2]}"
        
        # Remove surrounding quotes if present
        VALUE="${VALUE#\"}"
        VALUE="${VALUE%\"}"
        VALUE="${VALUE#\'}"
        VALUE="${VALUE%\'}"
        
        # Check if this should be a secret based on key name
        if [[ "$KEY" =~ ($SECRET_KEYWORDS) ]]; then
            echo -e "  ${YELLOW}[SECRET]${NC} ${KEY}"
            LOCAL_SECRETS+=("$KEY")
            set_secret "$KEY" "$VALUE" &
            PIDS+=($!)
            JOB_NAMES+=("$KEY")
            ((SECRETS_ADDED++))
        else
            echo -e "  ${GREEN}[VAR]${NC}    ${KEY}"
            LOCAL_VARS+=("$KEY")
            set_variable "$KEY" "$VALUE" &
            PIDS+=($!)
            JOB_NAMES+=("$KEY")
            ((VARS_ADDED++))
        fi
    fi
done < "$ENV_FILE"

# Wait for all background jobs to complete
echo ""
echo -e "${BLUE}Waiting for updates to complete...${NC}"
FAILED=0
for i in "${!PIDS[@]}"; do
    if ! wait "${PIDS[$i]}"; then
        echo -e "  ${RED}✗ Failed: ${JOB_NAMES[$i]}${NC}"
        ((FAILED++))
    fi
done

# Step 2: Delete remote vars/secrets not in local file
echo ""
echo -e "${BLUE}Step 2: Removing stale entries from GitHub...${NC}"

# Get current remote variables
REMOTE_VARS=$(gh variable list --env "$ENVIRONMENT" --repo "$REPO" --json name -q '.[].name' 2>/dev/null || echo "")

# Get current remote secrets
REMOTE_SECRETS=$(gh secret list --env "$ENVIRONMENT" --repo "$REPO" --json name -q '.[].name' 2>/dev/null || echo "")

# Delete variables not in local file
for var in $REMOTE_VARS; do
    if [[ ! " ${LOCAL_VARS[*]} " =~ " ${var} " ]]; then
        echo -e "  ${RED}[DELETE VAR]${NC} ${var}"
        delete_variable "$var" &
        ((VARS_DELETED++))
    fi
done

# Delete secrets not in local file
for secret in $REMOTE_SECRETS; do
    if [[ ! " ${LOCAL_SECRETS[*]} " =~ " ${secret} " ]]; then
        echo -e "  ${RED}[DELETE SECRET]${NC} ${secret}"
        delete_secret "$secret" &
        ((SECRETS_DELETED++))
    fi
done

# Wait for deletions
wait

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ Sync complete!${NC}"
else
    echo -e "${YELLOW}⚠ Sync completed with ${FAILED} failures${NC}"
fi
echo -e "  Secrets added/updated: ${SECRETS_ADDED}"
echo -e "  Variables added/updated: ${VARS_ADDED}"
echo -e "  Secrets deleted: ${SECRETS_DELETED}"
echo -e "  Variables deleted: ${VARS_DELETED}"
echo ""
echo -e "View in GitHub: ${BLUE}https://github.com/${REPO}/settings/environments${NC}"

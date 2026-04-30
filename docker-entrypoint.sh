#!/bin/sh
set -e

# If Claude OAuth env vars are provided, materialize them into ~/.claude/.credentials.json
# (used by EasyPanel / containerized deploys to authenticate the bundled Claude CLI).
if [ -n "$CLAUDE_OAUTH_ACCESS_TOKEN" ] && [ -n "$CLAUDE_OAUTH_REFRESH_TOKEN" ] && [ -n "$CLAUDE_OAUTH_EXPIRES_AT" ]; then
  CLAUDE_DIR="${HOME:-/home/nextjs}/.claude"
  mkdir -p "$CLAUDE_DIR"
  cat > "$CLAUDE_DIR/.credentials.json" <<EOF
{
  "claudeAiOauth": {
    "accessToken": "$CLAUDE_OAUTH_ACCESS_TOKEN",
    "refreshToken": "$CLAUDE_OAUTH_REFRESH_TOKEN",
    "expiresAt": $CLAUDE_OAUTH_EXPIRES_AT,
    "scopes": ["user:inference", "user:profile"]
  }
}
EOF
  chmod 600 "$CLAUDE_DIR/.credentials.json"
fi

exec "$@"

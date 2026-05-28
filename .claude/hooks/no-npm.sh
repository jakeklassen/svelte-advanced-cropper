#!/bin/bash
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command')

# Match npm/npx/yarn as a command word, not substrings like "npm-run-all"
if echo "$CMD" | grep -qE '(^|[;&| ])(npm|npx|yarn)([ ]|$)'; then
  echo "Use pnpm, not npm/npx/yarn. Replace 'npm install' with 'pnpm install', 'npm run X' with 'pnpm X', 'npx' with 'pnpm dlx'." >&2

  exit 2
fi

exit 0
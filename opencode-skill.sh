#!/bin/bash
# OpenCode CLI Wrapper for Clawdbot
# 用法: ./opencode-skill.sh "开发任务描述" [目录]

TASK="$1"
DIRECTORY="${2:-$(pwd)}"
FORMAT="--format json"

echo "{\"task\": \"$TASK\", \"directory\": \"$DIRECTORY\"}"

cd "$DIRECTORY" && opencode run "$TASK" $FORMAT

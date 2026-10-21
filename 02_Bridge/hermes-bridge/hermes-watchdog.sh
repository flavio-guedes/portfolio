#!/bin/bash
c=$(curl -s -o /dev/null -w '%{http_code}' -m 5 -H "Authorization: Bearer hermes123" http://127.0.0.1:8787/status)
[ "$c" != "200" ] && launchctl unload ~/Library/LaunchAgents/com.hermes.bridge.plist 2>/dev/null && sleep 2 && launchctl load ~/Library/LaunchAgents/com.hermes.bridge.plist
pgrep -f hermes-agent.mjs >/dev/null || (launchctl unload ~/Library/LaunchAgents/com.hermes.agent.plist 2>/dev/null; sleep 2; launchctl load ~/Library/LaunchAgents/com.hermes.agent.plist)
pgrep -x ollama >/dev/null || (nohup ollama serve >/dev/null 2>&1 &)

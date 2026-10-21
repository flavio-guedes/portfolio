#!/bin/bash
pkill -f "runner.py" && echo "runner parado" || echo "runner não estava rodando"

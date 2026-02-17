#!/bin/sh
curl -f http://localhost:${PORT:-3000}/api/v1/health/live || exit 1

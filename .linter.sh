#!/bin/bash
cd /home/kavia/workspace/code-generation/gridquest-57257-5b9771a2/gridquest_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


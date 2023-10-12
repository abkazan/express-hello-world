#!/bin/bash
if [$# -eq 0]; then
    msg="new commit"
else
    msg=$1

echo "adding..."
git add .
echo "committing "
git commit -m $msg
echo "pushing"
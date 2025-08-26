#!/bin/sh
set -e

USER_ID=${UID:-1000}
GROUP_ID=${GID:-1000}
APP_USER=appuser
APP_GROUP=appuser

echo "[Entrypoint] Script started: UID=$USER_ID, GID=$GROUP_ID, USER=$APP_USER, GROUP=$APP_GROUP"

# Check if group with GID exists
EXISTING_GROUP=$(getent group $GROUP_ID | cut -d: -f1)
if [ -z "$EXISTING_GROUP" ]; then
    addgroup -g $GROUP_ID $APP_GROUP
else
    APP_GROUP=$EXISTING_GROUP
fi

# Check if user with UID exists
EXISTING_USER=$(getent passwd $USER_ID | cut -d: -f1)
if [ -z "$EXISTING_USER" ]; then
    adduser -D -u $USER_ID -G $APP_GROUP $APP_USER
else
    APP_USER=$EXISTING_USER
fi

# Ensure APP_USER is in the docker group for Docker access
if getent group root >/dev/null; then
    addgroup $APP_USER root
fi

# Change ownership of relevant directories (optional, adjust as needed)
chown -R $USER_ID:$GROUP_ID /app/backend/db

# Run the given command as the new user
exec su-exec $APP_USER "$@"
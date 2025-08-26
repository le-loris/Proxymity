#!/bin/sh
set -e

USER_ID=${UID:-1000}
GROUP_ID=${GID:-1000}
APP_USER=appuser
APP_GROUP=appgroup

# Create group if it doesn't exist
if ! getent group $APP_GROUP >/dev/null; then
    addgroup -g $GROUP_ID $APP_GROUP
fi

# Create user if it doesn't exist
if ! id -u $APP_USER >/dev/null 2>&1; then
    adduser -D -u $USER_ID -G $APP_GROUP $APP_USER
fi

# Change ownership of relevant directories (optional, adjust as needed)
# chown -R $USER_ID:$GROUP_ID /app/backend/db

# Run the given command as the new user
exec su-exec $APP_USER "$@"
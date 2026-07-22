#!/bin/bash
set -euo pipefail

# Base directory
APP_HOME="%PWD"

# Optional JAVA_HOME
JAVA_HOME="$APP_HOME/jdk-25.0.3+9"
# export PATH="$JAVA_HOME/bin:$PATH"

# Export environment variables
export CORE_DEPLOYMENT=true

echo "Starting Syncloop..."
echo "APP_HOME=$APP_HOME"
echo "CORE_DEPLOYMENT=$CORE_DEPLOYMENT"

# Cleanup old snapshots (keep latest)
SNAPSHOT_DIR="$APP_HOME/Ignite/work_n_1/snapshots"

if [ -d "$SNAPSHOT_DIR" ]; then
    echo "Cleaning old snapshots..."

    sudo sh -c "
        cd '$SNAPSHOT_DIR' && \
        ls -dt backup_Startup_* 2>/dev/null | \
        tail -n +2 | \
        xargs -r rm -rf
    "
fi

# Classpath
CP="$APP_HOME/syncloop.jar:$APP_HOME/lib/*"

# JVM options
JAVA_OPTS=""
ADD_OPENS=""
DEBUG_OPTS=""

JVM_PROPS_FILE="$APP_HOME/jvm.properties"

if [ -f "$JVM_PROPS_FILE" ]; then
    echo "Loading JVM properties from $JVM_PROPS_FILE"

    while IFS= read -r line || [ -n "$line" ]; do

        # Trim spaces
        line="$(echo "$line" | xargs)"

        # Skip empty lines and comments
        [[ -z "$line" || "$line" == \#* ]] && continue

        # Separate --add-opens
        if [[ "$line" == --add-opens* ]]; then
            ADD_OPENS="$ADD_OPENS $line"
        else
            JAVA_OPTS="$JAVA_OPTS $line"
        fi

    done < "$JVM_PROPS_FILE"
else
    echo "WARNING: jvm.properties not found"
fi

echo "JAVA_OPTS=$JAVA_OPTS"
echo "ADD_OPENS=$ADD_OPENS"

# Debug mode
if [[ "${1:-}" == "-debug" ]]; then
    echo "Debug mode enabled on port 5005"

    DEBUG_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
fi

echo "Launching MiddlewareServer..."
echo

# Start Java process
exec sudo -E $JAVA_HOME/java \
    $DEBUG_OPTS \
    $ADD_OPENS \
    -cp "$CP" \
    $JAVA_OPTS \
    com.eka.middleware.server.MiddlewareServer \
    "$APP_HOME/resources/config"
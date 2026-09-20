#!/usr/bin/env bash
set -euo pipefail

APP_HOME="$(cd "$(dirname "$0")" && pwd)"

#Update the jdk 25 path
DEFAULT_JAVA_HOME="/openjdk-25/Contents/Home"

JAVA_BIN=""

if [[ -x "$DEFAULT_JAVA_HOME/bin/java" ]]; then
  JAVA_BIN="$DEFAULT_JAVA_HOME/bin/java"
elif [[ -x "$APP_HOME/jdk-25.0.1+8/bin/java" ]]; then
  JAVA_BIN="$APP_HOME/jdk-25.0.1+8/bin/java"
elif [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
  JAVA_BIN="$JAVA_HOME/bin/java"
elif [[ -x "/usr/libexec/java_home" ]]; then
  DETECTED_JAVA_HOME="$(/usr/libexec/java_home 2>/dev/null || true)"
  if [[ -n "$DETECTED_JAVA_HOME" && -x "$DETECTED_JAVA_HOME/bin/java" ]]; then
    JAVA_BIN="$DETECTED_JAVA_HOME/bin/java"
  fi
fi

if [[ -z "$JAVA_BIN" ]] && command -v java >/dev/null 2>&1; then
  JAVA_BIN="$(command -v java)"
fi

if [[ -z "$JAVA_BIN" ]]; then
  echo "ERROR: Java not found. Set JAVA_HOME, install Java, or place bundled JDK at $APP_HOME/jdk-25.0.1+8"
  exit 1
fi

echo "Using Java: $JAVA_BIN"

CP="$APP_HOME/syncloop.jar:$APP_HOME/lib/*"

JAVA_OPTS=()
ADD_OPENS=()
DEBUG_OPTS=()

for arg in "$@"; do
  if [[ "${arg,,}" == "-debug" ]]; then
    DEBUG_OPTS+=("-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005")
    break
  fi
done

JVM_PROPS_FILE="$APP_HOME/jvm.properties"
if [[ -f "$JVM_PROPS_FILE" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    trimmed="${line#"${line%%[![:space:]]*}"}"
    trimmed="${trimmed%"${trimmed##*[![:space:]]}"}"

    [[ -z "$trimmed" || "$trimmed" == \#* ]] && continue

    if [[ "$trimmed" == --add-opens* ]]; then
      ADD_OPENS+=("$trimmed")
    else
      JAVA_OPTS+=("$trimmed")
    fi
  done < "$JVM_PROPS_FILE"
fi

echo "JVM Options: ${JAVA_OPTS[*]:-}"
echo "Add Opens: ${ADD_OPENS[*]:-}"
if [[ ${#DEBUG_OPTS[@]} -gt 0 ]]; then
  echo "Debug Options: ${DEBUG_OPTS[*]}"
fi

CMD=("$JAVA_BIN")

if [[ ${#DEBUG_OPTS[@]} -gt 0 ]]; then
  CMD+=("${DEBUG_OPTS[@]}")
fi

if [[ ${#ADD_OPENS[@]} -gt 0 ]]; then
  CMD+=("${ADD_OPENS[@]}")
fi

CMD+=(-cp "$CP")

if [[ ${#JAVA_OPTS[@]} -gt 0 ]]; then
  CMD+=("${JAVA_OPTS[@]}")
fi

CMD+=(com.eka.middleware.server.MiddlewareServer "$APP_HOME/resources/config")

exec "${CMD[@]}"

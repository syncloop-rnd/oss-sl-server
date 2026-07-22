@echo off
SET "JAVA_HOME=%CD%\jdk-25.0.1+8"
SET "CP=%CD%\syncloop.jar;%CD%\lib\*"

REM Initialize variables
set "JAVA_OPTS="
set "ADD_OPENS="
setlocal enabledelayedexpansion

REM Initialize DEBUG_OPTS as empty
set "DEBUG_OPTS="

REM Loop through all passed parameters to check for "-debug" (case-insensitive)
for %%x in (%*) do (
    if /I "%%~x"=="-debug" (
        set "DEBUG_OPTS=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
    )
)

REM Read JVM arguments from jvm.properties file
for /f "usebackq tokens=*" %%a in ("jvm.properties") do (
    set "line=%%a"
    
    REM Skip empty lines and comment lines (lines starting with #)
    if not "!line!"=="" (
        if not "!line:~0,1!"=="#" (
            REM Check if the line starts with --add-opens (11 characters)
            if "!line:~0,11!"=="--add-opens" (
                set "ADD_OPENS=!ADD_OPENS! !line!"
            ) else (
                set "JAVA_OPTS=!JAVA_OPTS! !line!"
            )
        )
    )
)

echo JVM Options: %JAVA_OPTS%
echo Add Opens: %ADD_OPENS%
if defined DEBUG_OPTS (
    echo Debug Options: %DEBUG_OPTS%
)

REM Start the Java server.
REM The first quoted string ("") is the window title placeholder.
REM start "Syncloop-server" /affinity 20 

"%JAVA_HOME%\bin\java" %DEBUG_OPTS% %ADD_OPENS% -cp "%CP%" %JAVA_OPTS% com.eka.middleware.server.MiddlewareServer "%CD%\resources\config"

cmd /k
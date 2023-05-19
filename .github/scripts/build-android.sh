#!/bin/bash

# Define the log file path
LOG_FILE=$1
# Define app name
MEGA_APP_NAME=$2

# Define the color codes
BLUE_BOLD="\033[1;36m"
GREEN_BOLD="\033[1;32m"
RED_BOLD="\033[1;31m"
COLOR_END="\033[0m"

# To resolve "error Command failed: /Users/runner/Library/Android/sdk/platform-tools/adb logcat -c"
# https://stackoverflow.com/questions/63617294/error-while-running-android-build-on-react-native
# https://stackoverflow.com/questions/55677874/failed-to-launch-emulator-error-emulator-didnt-connect-within-60-seconds
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

echo -e "${BLUE_BOLD}cd build-system-tests/mega-apps/${MEGA_APP_NAME}${COLOR_END}"
cd build-system-tests/mega-apps/${MEGA_APP_NAME}

# Log errors to LOG_FILE in the background
echo -e "${BLUE_BOLD}Create ${LOG_FILE}${COLOR_END}"
touch $LOG_FILE
echo -e "${BLUE_BOLD}Logging errors to $LOG_FILE in the background${COLOR_END}"
npx react-native log-android >$LOG_FILE &

# Check if the command succeeded
if [ $? -ne 0 ]; then
  echo -e "${BLUE_BOLD}Failed to run command: npx react-native log-android > $LOG_FILE &${COLOR_END}"
  exit 1
fi

# Run npm run android in the background
echo -e "${BLUE_BOLD}Running npm run android${COLOR_END}"
npm run android

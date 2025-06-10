#!/bin/bash

# Android Emulator Setup Script for Flutter Development
# This script sets up Android SDK and creates an emulator for Flutter testing

set -e  # Exit on any error

# Set variables
ANDROID_SDK_DIR="$HOME/android-sdk"
CMDLINE_TOOLS_DIR="$ANDROID_SDK_DIR/cmdline-tools/latest"
TOOLS_ZIP="commandlinetools-linux-11076708_latest.zip"
TOOLS_URL="https://dl.google.com/android/repository/${TOOLS_ZIP}"
AVD_NAME="delivery-notes-emulator"
ANDROID_API_LEVEL="34"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    local missing_deps=()
    
    # Check for required tools
    command -v wget >/dev/null 2>&1 || missing_deps+=("wget")
    command -v unzip >/dev/null 2>&1 || missing_deps+=("unzip")
    command -v java >/dev/null 2>&1 || missing_deps+=("java")
    command -v flutter >/dev/null 2>&1 || missing_deps+=("flutter")
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        echo "Please install them first:"
        echo "  Ubuntu/Debian: sudo apt update && sudo apt install wget unzip openjdk-17-jdk"
        echo "  For Flutter: https://flutter.dev/docs/get-started/install/linux"
        exit 1
    fi
    
    # Check Java version
    java_version=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
    if [ "$java_version" -lt 17 ]; then
        log_error "Java 17 or higher is required for Android development with latest SDK tools"
        echo "Current Java version: $java_version"
        echo "Please install Java 17 or higher:"
        echo "  Ubuntu/Debian: sudo apt update && sudo apt install openjdk-17-jdk"
        exit 1
    fi
    
    log_info "All dependencies are satisfied"
}

cleanup_temp_files() {
    log_info "Cleaning up temporary files..."
    rm -f "/tmp/$TOOLS_ZIP"
    rm -rf "/tmp/tools-temp"
}

setup_android_sdk() {
    # Check if Android SDK is already installed
    if [ -d "$ANDROID_SDK_DIR" ] && [ -f "$CMDLINE_TOOLS_DIR/bin/sdkmanager" ]; then
        log_warn "Android SDK already exists at $ANDROID_SDK_DIR"
        read -p "Do you want to reinstall? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Skipping Android SDK installation"
            return 0
        fi
        rm -rf "$ANDROID_SDK_DIR"
    fi

    log_info "Creating SDK directory..."
    mkdir -p "$CMDLINE_TOOLS_DIR"

    log_info "Downloading Android command line tools..."
    if ! wget -q "$TOOLS_URL" -O "/tmp/$TOOLS_ZIP"; then
        log_error "Failed to download Android command line tools"
        exit 1
    fi

    log_info "Extracting tools..."
    mkdir -p "/tmp/tools-temp"
    if ! unzip -q "/tmp/$TOOLS_ZIP" -d "/tmp/tools-temp"; then
        log_error "Failed to extract command line tools"
        cleanup_temp_files
        exit 1
    fi
    
    mv "/tmp/tools-temp/cmdline-tools"/* "$CMDLINE_TOOLS_DIR/"
    
    log_info "Android SDK installed successfully"
}

setup_environment_variables() {
    log_info "Setting up environment variables..."
    
    # Remove existing Android SDK entries from bashrc to avoid duplicates
    sed -i '/# Android SDK/,/^$/d' ~/.bashrc
    
    # Add new Android SDK configuration
    cat >> ~/.bashrc << EOF

# Android SDK
export ANDROID_HOME=$ANDROID_SDK_DIR
export ANDROID_SDK_ROOT=\$ANDROID_HOME
export PATH=\$ANDROID_HOME/cmdline-tools/latest/bin:\$PATH
export PATH=\$ANDROID_HOME/platform-tools:\$PATH
export PATH=\$ANDROID_HOME/emulator:\$PATH
EOF
    
    # Export for current session
    export ANDROID_HOME="$ANDROID_SDK_DIR"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
    export PATH="$ANDROID_HOME/platform-tools:$PATH"
    export PATH="$ANDROID_HOME/emulator:$PATH"
    
    log_info "Environment variables configured"
}

install_sdk_components() {
    log_info "Installing SDK components..."
    
    # Accept all licenses first
    yes | "$CMDLINE_TOOLS_DIR/bin/sdkmanager" --sdk_root="$ANDROID_SDK_DIR" --licenses > /dev/null 2>&1
    
    # Install required components
    if ! "$CMDLINE_TOOLS_DIR/bin/sdkmanager" --sdk_root="$ANDROID_SDK_DIR" --install \
        "platform-tools" \
        "emulator" \
        "platforms;android-$ANDROID_API_LEVEL" \
        "system-images;android-$ANDROID_API_LEVEL;google_apis;x86_64" \
        "build-tools;$ANDROID_API_LEVEL.0.0"; then
        log_error "Failed to install SDK components"
        exit 1
    fi
    
    log_info "SDK components installed successfully"
}

create_avd() {
    log_info "Creating Android Virtual Device (AVD)..."
    
    # Check if AVD already exists
    if "$CMDLINE_TOOLS_DIR/bin/avdmanager" list avd | grep -q "$AVD_NAME"; then
        log_warn "AVD '$AVD_NAME' already exists"
        read -p "Do you want to recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            "$CMDLINE_TOOLS_DIR/bin/avdmanager" delete avd -n "$AVD_NAME"
        else
            log_info "Keeping existing AVD"
            return 0
        fi
    fi
    
    # Create new AVD
    if ! echo "no" | "$CMDLINE_TOOLS_DIR/bin/avdmanager" create avd \
        -n "$AVD_NAME" \
        -k "system-images;android-$ANDROID_API_LEVEL;google_apis;x86_64" \
        -d "pixel_xl" \
        --force; then
        log_error "Failed to create AVD"
        exit 1
    fi
    
    log_info "AVD '$AVD_NAME' created successfully"
}

verify_installation() {
    log_info "Verifying installation..."
    
    # Check if emulator command is available
    if command -v emulator >/dev/null 2>&1; then
        log_info "✓ Emulator command is available"
    else
        log_warn "Emulator command not found in PATH. You may need to restart your terminal."
    fi
    
    # List available AVDs
    log_info "Available AVDs:"
    "$CMDLINE_TOOLS_DIR/bin/avdmanager" list avd | grep "Name:" || log_warn "No AVDs found"
    
    # Check Flutter doctor for Android setup
    log_info "Running Flutter doctor for Android..."
    flutter doctor --android-licenses > /dev/null 2>&1 || true
    flutter doctor | grep -A 5 "Android toolchain" || log_warn "Flutter doctor check failed"
}

main() {
    log_info "Starting Android Emulator setup for Flutter development..."
    
    # Trap to cleanup on exit
    trap cleanup_temp_files EXIT
    
    check_dependencies
    setup_android_sdk
    setup_environment_variables
    install_sdk_components
    create_avd
    verify_installation
    
    echo
    log_info "✅ Setup completed successfully!"
    echo
    echo "📱 To start the emulator, run:"
    echo "   emulator -avd $AVD_NAME"
    echo
    echo "🚀 To run your Flutter app:"
    echo "   cd apps/delivery-notes-mobile"
    echo "   flutter run"
    echo
    echo "💡 Alternative: Use Nx to run your Flutter app:"
    echo "   nx run delivery-notes-mobile:run"
    echo
    log_warn "Note: You may need to restart your terminal for environment variables to take effect."
}

# Run main function
main "$@"

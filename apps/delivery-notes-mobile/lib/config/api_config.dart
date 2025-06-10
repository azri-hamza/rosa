import 'dart:io';

class ApiConfig {
  static const String _developmentHost = 'localhost';
  static const String _androidEmulatorHost = '10.0.2.2';
  static const int _port = 3000;
  static const String _apiPrefix = '/api';
  
  /// Get the appropriate base URL for API calls based on the platform
  static String get baseUrl {
    String host;
    
    // Check if running on Android
    if (Platform.isAndroid) {
      // On Android emulator, use 10.0.2.2 to access host machine
      // In production, you would typically use your actual domain/IP
      host = _androidEmulatorHost;
    } else {
      // For iOS simulator and other platforms, localhost works fine
      host = _developmentHost;
    }
    
    return 'http://$host:$_port$_apiPrefix';
  }
  
  /// For debugging purposes
  static void printCurrentConfig() {
    print('🌐 API Config:');
    print('   Platform: ${Platform.operatingSystem}');
    print('   Base URL: $baseUrl');
    print('   Host: ${Platform.isAndroid ? _androidEmulatorHost : _developmentHost}');
    print('   Port: $_port');
  }
} 
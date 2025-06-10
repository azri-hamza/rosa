import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';
import '../models/user.dart';
import '../models/delivery_note.dart';
import '../models/client.dart';
import '../models/product.dart';

class ApiService {
  static String get baseUrl => ApiConfig.baseUrl;
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  // Print API configuration for debugging
  static void printConfig() {
    ApiConfig.printCurrentConfig();
  }

  // Authentication endpoints
  static Future<AuthResponse> login(LoginRequest request) async {
    printConfig(); // Debug: Print current API config
    
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(request.toJson()),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final authResponse = AuthResponse.fromJson(jsonDecode(response.body));
      await _storage.write(key: 'access_token', value: authResponse.accessToken);
      await _storage.write(key: 'refresh_token', value: authResponse.refreshToken);
      return authResponse;
    } else {
      throw Exception('Failed to login: ${response.body}');
    }
  }

  static Future<void> logout() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  static Future<String?> getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }

  static Future<Map<String, String>> _getAuthHeaders() async {
    final token = await getAccessToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Delivery Notes endpoints
  static Future<List<DeliveryNote>> getDeliveryNotes({
    int? clientId,
    String? status,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (clientId != null) queryParams['clientId'] = clientId.toString();
      if (status != null) queryParams['status'] = status;
      if (startDate != null) queryParams['startDate'] = startDate.toIso8601String();
      if (endDate != null) queryParams['endDate'] = endDate.toIso8601String();

      final uri = Uri.parse('$baseUrl/sales/delivery-notes').replace(queryParameters: queryParams);
      print('Fetching delivery notes from: $uri');
      
      final headers = await _getAuthHeaders();
      print('Using headers: $headers');
      
      final response = await http.get(uri, headers: headers);

      print('Delivery Notes API Response Status: ${response.statusCode}');
      print('Delivery Notes API Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final dynamic responseBody = jsonDecode(response.body);
        print('Response body type: ${responseBody.runtimeType}');
        
        List<dynamic> deliveryNotesData;
        
        // Handle both direct list response and wrapped object response
        if (responseBody is List) {
          print('Response is a direct list with ${responseBody.length} items');
          deliveryNotesData = responseBody;
        } else if (responseBody is Map && responseBody.containsKey('data')) {
          print('Response is wrapped object with data property');
          final data = responseBody['data'];
          if (data is List) {
            deliveryNotesData = data;
          } else {
            throw Exception('Response data property is not a list: ${data.runtimeType}');
          }
        } else if (responseBody is Map && responseBody.containsKey('message')) {
          // Handle error responses from the API
          throw Exception('API Error: ${responseBody['message']}');
        } else {
          // If it's not a list or wrapped object, it might be an error response
          print('Unexpected response format: ${responseBody.runtimeType}');
          throw Exception('Unexpected response format. Expected list or wrapped object, got: ${responseBody.toString()}');
        }
        
        print('Processing ${deliveryNotesData.length} delivery notes');
        
        // Convert each item to a Map<String, dynamic> first
        final List<Map<String, dynamic>> deliveryNotes = deliveryNotesData.map((item) {
          if (item is Map) {
            // Convert all values to the expected types
            return Map<String, dynamic>.from(item).map((key, value) {
              if (key == 'id' && value is String) {
                return MapEntry(key, int.parse(value));
              }
              if (key == 'items' && value is List) {
                return MapEntry(key, value.map((item) {
                  if (item is Map) {
                    var itemMap = Map<String, dynamic>.from(item);
                    // Convert string IDs to integers
                    if (itemMap['id'] is String) {
                      itemMap['id'] = int.parse(itemMap['id']);
                    }
                    // Convert string numbers to doubles
                    if (itemMap['unitPrice'] is String) {
                      itemMap['unitPrice'] = double.parse(itemMap['unitPrice']);
                    }
                    if (itemMap['totalPrice'] is String) {
                      itemMap['totalPrice'] = double.parse(itemMap['totalPrice']);
                    }
                    // Parse productName if it's a JSON string
                    if (itemMap['productName'] is String && itemMap['productName'].startsWith('{')) {
                      try {
                        final productData = jsonDecode(itemMap['productName'] as String);
                        itemMap['productName'] = productData['name'] as String;
                      } catch (e) {
                        print('Error parsing productName JSON: $e');
                      }
                    }
                    return itemMap;
                  }
                  return item;
                }).toList());
              }
              return MapEntry(key, value);
            });
          }
          return item as Map<String, dynamic>;
        }).toList();

        return deliveryNotes.map((json) => DeliveryNote.fromJson(json)).toList();
      } else {
        // Handle HTTP error responses
        String errorMessage = 'Failed to load delivery notes: Status ${response.statusCode}';
        try {
          final errorBody = jsonDecode(response.body);
          if (errorBody is Map && errorBody.containsKey('message')) {
            errorMessage = 'API Error: ${errorBody['message']}';
          } else {
            errorMessage = 'Failed to load delivery notes: ${response.body}';
          }
        } catch (e) {
          errorMessage = 'Failed to load delivery notes: Status ${response.statusCode}, Body: ${response.body}';
        }
        throw Exception(errorMessage);
      }
    } catch (e) {
      print('Error in getDeliveryNotes: $e');
      print('Stack trace: ${StackTrace.current}');
      rethrow;
    }
  }

  static Future<DeliveryNote> getDeliveryNote(String id) async {
    final response = await http.get(
      Uri.parse('$baseUrl/sales/delivery-notes/$id'),
      headers: await _getAuthHeaders(),
    );

    if (response.statusCode == 200) {
      return DeliveryNote.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load delivery note: ${response.body}');
    }
  }

  static Future<DeliveryNote> createDeliveryNote(CreateDeliveryNoteRequest request) async {
    final response = await http.post(
      Uri.parse('$baseUrl/sales/delivery-notes'),
      headers: await _getAuthHeaders(),
      body: jsonEncode(request.toJson()),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return DeliveryNote.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create delivery note: ${response.body}');
    }
  }

  static Future<DeliveryNote> updateDeliveryNote(String id, CreateDeliveryNoteRequest request) async {
    final response = await http.put(
      Uri.parse('$baseUrl/sales/delivery-notes/$id'),
      headers: await _getAuthHeaders(),
      body: jsonEncode(request.toJson()),
    );

    if (response.statusCode == 200) {
      return DeliveryNote.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update delivery note: ${response.body}');
    }
  }

  static Future<void> deleteDeliveryNote(String id) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/sales/delivery-notes/$id'),
      headers: await _getAuthHeaders(),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to delete delivery note: ${response.body}');
    }
  }

  // Clients endpoints
  static Future<List<Client>> getClients() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/clients'),
        headers: await _getAuthHeaders(),
      );

      print('Clients API Response Status: ${response.statusCode}');
      print('Clients API Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final dynamic responseBody = jsonDecode(response.body);
        print('Clients response body type: ${responseBody.runtimeType}');
        
        List<dynamic> clientsData;
        
        // Handle both direct list response and wrapped object response
        if (responseBody is List) {
          print('Clients response is a direct list with ${responseBody.length} items');
          clientsData = responseBody;
        } else if (responseBody is Map && responseBody.containsKey('data')) {
          print('Clients response is wrapped object with data property');
          final data = responseBody['data'];
          if (data is List) {
            clientsData = data;
          } else {
            throw Exception('Clients response data property is not a list: ${data.runtimeType}');
          }
        } else if (responseBody is Map && responseBody.containsKey('message')) {
          // Handle error responses from the API
          throw Exception('API Error: ${responseBody['message']}');
        } else {
          // If it's not a list or wrapped object, it might be an error response
          print('Unexpected clients response format: ${responseBody.runtimeType}');
          throw Exception('Unexpected response format. Expected list or wrapped object, got: ${responseBody.toString()}');
        }
        
        return clientsData.map((json) => Client.fromJson(json)).toList();
      } else {
        // Handle HTTP error responses
        String errorMessage = 'Failed to load clients: Status ${response.statusCode}';
        try {
          final errorBody = jsonDecode(response.body);
          if (errorBody is Map && errorBody.containsKey('message')) {
            errorMessage = 'API Error: ${errorBody['message']}';
          } else {
            errorMessage = 'Failed to load clients: ${response.body}';
          }
        } catch (e) {
          errorMessage = 'Failed to load clients: Status ${response.statusCode}, Body: ${response.body}';
        }
        throw Exception(errorMessage);
      }
    } catch (e) {
      print('Error in getClients: $e');
      print('Stack trace: ${StackTrace.current}');
      rethrow;
    }
  }

  // Products endpoints
  static Future<List<Product>> getProducts({String? filter}) async {
    try {
      final queryParams = <String, String>{};
      if (filter != null && filter.isNotEmpty) {
        queryParams['filter'] = filter;
      }
      queryParams['limit'] = '50'; // Limit results for auto-complete
      
      final uri = Uri.parse('$baseUrl/products').replace(queryParameters: queryParams);
      print('Fetching products from: $uri');
      
      final headers = await _getAuthHeaders();
      final response = await http.get(uri, headers: headers);

      print('Products API Response Status: ${response.statusCode}');
      print('Products API Response Body: ${response.body}');

      if (response.statusCode == 200) {
        final dynamic responseBody = jsonDecode(response.body);
        print('Products response body type: ${responseBody.runtimeType}');
        
        List<dynamic> productsData;
        
        // Handle both direct list response and wrapped object response
        if (responseBody is List) {
          print('Products response is a direct list with ${responseBody.length} items');
          productsData = responseBody;
        } else if (responseBody is Map && responseBody.containsKey('data')) {
          print('Products response is wrapped object with data property');
          final data = responseBody['data'];
          if (data is List) {
            productsData = data;
          } else {
            throw Exception('Products response data property is not a list: ${data.runtimeType}');
          }
        } else if (responseBody is Map && responseBody.containsKey('message')) {
          // Handle error responses from the API
          throw Exception('API Error: ${responseBody['message']}');
        } else {
          // If it's not a list or wrapped object, it might be an error response
          print('Unexpected products response format: ${responseBody.runtimeType}');
          throw Exception('Unexpected response format. Expected list or wrapped object, got: ${responseBody.toString()}');
        }
        
        return productsData.map((json) => Product.fromJson(json)).toList();
      } else {
        // Handle HTTP error responses
        String errorMessage = 'Failed to load products: Status ${response.statusCode}';
        try {
          final errorBody = jsonDecode(response.body);
          if (errorBody is Map && errorBody.containsKey('message')) {
            errorMessage = 'API Error: ${errorBody['message']}';
          } else {
            errorMessage = 'Failed to load products: ${response.body}';
          }
        } catch (e) {
          errorMessage = 'Failed to load products: Status ${response.statusCode}, Body: ${response.body}';
        }
        throw Exception(errorMessage);
      }
    } catch (e) {
      print('Error in getProducts: $e');
      print('Stack trace: ${StackTrace.current}');
      rethrow;
    }
  }

  static Future<Product> getProduct(String productId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/products/$productId'),
      headers: await _getAuthHeaders(),
    );

    if (response.statusCode == 200) {
      return Product.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load product: ${response.body}');
    }
  }
} 
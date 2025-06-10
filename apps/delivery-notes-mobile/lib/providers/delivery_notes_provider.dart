import 'package:flutter/foundation.dart';
import '../models/delivery_note.dart';
import '../models/client.dart';
import '../models/product.dart';
import '../services/api_service.dart';

class DeliveryNotesProvider with ChangeNotifier {
  List<DeliveryNote> _deliveryNotes = [];
  List<Client> _clients = [];
  List<Product> _products = [];
  bool _isLoading = false;
  String? _error;

  // Filters
  int? _selectedClientId;
  String? _selectedStatus;
  DateTime? _startDate;
  DateTime? _endDate;

  List<DeliveryNote> get deliveryNotes => _deliveryNotes;
  List<Client> get clients => _clients;
  List<Product> get products => _products;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Filter getters
  int? get selectedClientId => _selectedClientId;
  String? get selectedStatus => _selectedStatus;
  DateTime? get startDate => _startDate;
  DateTime? get endDate => _endDate;

  Future<void> loadDeliveryNotes() async {
    _setLoading(true);
    _setError(null);

    try {
      // Add a small delay to ensure authentication is complete
      await Future.delayed(const Duration(milliseconds: 100));
      
      // Verify we have an access token
      final token = await ApiService.getAccessToken();
      if (token == null) {
        throw Exception('Authentication required. Please log in again.');
      }
      
      _deliveryNotes = await ApiService.getDeliveryNotes(
        clientId: _selectedClientId,
        status: _selectedStatus,
        startDate: _startDate,
        endDate: _endDate,
      );
      
      print('Successfully loaded ${_deliveryNotes.length} delivery notes');
      notifyListeners();
    } catch (e) {
      String errorMessage = e.toString();
      
      // Clean up error messages for better user experience
      if (errorMessage.contains('Failed to login')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (errorMessage.contains('SocketException') || errorMessage.contains('Connection refused')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (errorMessage.contains('FormatException') || errorMessage.contains('_JsonMap')) {
        errorMessage = 'Data format error. Please try again.';
      } else if (errorMessage.contains('Unexpected response format')) {
        errorMessage = 'Server response error. Please try again.';
      } else if (errorMessage.startsWith('Exception: ')) {
        errorMessage = errorMessage.substring(11); // Remove "Exception: " prefix
      }
      
      print('Error loading delivery notes: $e');
      _setError(errorMessage);
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadClients() async {
    try {
      // Verify we have an access token
      final token = await ApiService.getAccessToken();
      if (token == null) {
        throw Exception('Authentication required. Please log in again.');
      }
      
      _clients = await ApiService.getClients();
      print('Successfully loaded ${_clients.length} clients');
      notifyListeners();
    } catch (e) {
      String errorMessage = e.toString();
      
      // Clean up error messages for better user experience
      if (errorMessage.contains('Failed to login')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (errorMessage.contains('SocketException') || errorMessage.contains('Connection refused')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (errorMessage.contains('FormatException') || errorMessage.contains('_JsonMap')) {
        errorMessage = 'Data format error. Please try again.';
      } else if (errorMessage.contains('Unexpected response format')) {
        errorMessage = 'Server response error. Please try again.';
      } else if (errorMessage.startsWith('Exception: ')) {
        errorMessage = errorMessage.substring(11); // Remove "Exception: " prefix
      }
      
      print('Error loading clients: $e');
      _setError(errorMessage);
    }
  }

  Future<DeliveryNote?> createDeliveryNote(CreateDeliveryNoteRequest request) async {
    _setLoading(true);
    _setError(null);

    try {
      final deliveryNote = await ApiService.createDeliveryNote(request);
      _deliveryNotes.insert(0, deliveryNote);
      notifyListeners();
      return deliveryNote;
    } catch (e) {
      _setError(e.toString());
      return null;
    } finally {
      _setLoading(false);
    }
  }

  Future<DeliveryNote?> updateDeliveryNote(String id, CreateDeliveryNoteRequest request) async {
    print('🔄 Provider: Starting update for delivery note $id');
    _setLoading(true);
    _setError(null);

    try {
      print('🌐 Provider: Making API call to update delivery note');
      final updatedDeliveryNote = await ApiService.updateDeliveryNote(id, request);
      
      print('✅ Provider: API call successful, updating local state');
      final index = _deliveryNotes.indexWhere((dn) => dn.referenceId == id);
      
      if (index != -1) {
        final oldNote = _deliveryNotes[index];
        _deliveryNotes[index] = updatedDeliveryNote;
        print('✅ Provider: Updated delivery note at index $index');
        print('📊 Provider: Status changed from ${oldNote.status} to ${updatedDeliveryNote.status}');
        print('💰 Provider: Amount changed from ${oldNote.totalAmount} to ${updatedDeliveryNote.totalAmount}');
        notifyListeners();
      } else {
        print('⚠️ Provider: Delivery note with ID $id not found in local list, adding it');
        _deliveryNotes.insert(0, updatedDeliveryNote);
        notifyListeners();
      }
      
      print('✅ Provider: Successfully updated delivery note $id');
      return updatedDeliveryNote;
    } catch (e) {
      print('❌ Provider: Error updating delivery note: $e');
      _setError(e.toString());
      return null;
    } finally {
      _setLoading(false);
      print('🏁 Provider: Update operation completed for delivery note $id');
    }
  }

  Future<bool> deleteDeliveryNote(String id) async {
    _setLoading(true);
    _setError(null);

    try {
      await ApiService.deleteDeliveryNote(id);
      _deliveryNotes.removeWhere((dn) => dn.referenceId == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Filter methods
  void setClientFilter(int? clientId) {
    _selectedClientId = clientId;
    notifyListeners();
    loadDeliveryNotes();
  }

  void setStatusFilter(String? status) {
    _selectedStatus = status;
    notifyListeners();
    loadDeliveryNotes();
  }

  void setDateRangeFilter(DateTime? startDate, DateTime? endDate) {
    _startDate = startDate;
    _endDate = endDate;
    notifyListeners();
    loadDeliveryNotes();
  }

  void clearFilters() {
    _selectedClientId = null;
    _selectedStatus = null;
    _startDate = null;
    _endDate = null;
    notifyListeners();
    loadDeliveryNotes();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Client? getClientById(int? clientId) {
    if (clientId == null) return null;
    try {
      return _clients.firstWhere((client) => client.id == clientId);
    } catch (e) {
      return null;
    }
  }

  Future<void> loadProducts({String? filter}) async {
    try {
      print('🔐 Checking authentication token...');
      // Verify we have an access token
      final token = await ApiService.getAccessToken();
      if (token == null) {
        print('❌ No access token found');
        throw Exception('Authentication required. Please log in again.');
      }
      
      print('✅ Access token found: ${token.substring(0, 20)}...');
      print('🌐 Loading products with filter: $filter');
      
      _products = await ApiService.getProducts(filter: filter);
      print('Successfully loaded ${_products.length} products');
      notifyListeners();
    } catch (e) {
      String errorMessage = e.toString();
      
      // Clean up error messages for better user experience
      if (errorMessage.contains('Failed to login')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (errorMessage.contains('SocketException') || errorMessage.contains('Connection refused')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (errorMessage.contains('FormatException') || errorMessage.contains('_JsonMap')) {
        errorMessage = 'Data format error. Please try again.';
      } else if (errorMessage.contains('Unexpected response format')) {
        errorMessage = 'Server response error. Please try again.';
      } else if (errorMessage.startsWith('Exception: ')) {
        errorMessage = errorMessage.substring(11); // Remove "Exception: " prefix
      }
      
      print('Error loading products: $e');
      _setError(errorMessage);
      throw Exception(errorMessage);
    }
  }

  Future<List<Product>> searchProducts(String query) async {
    print('🔍 Provider: Searching products with query: "$query"');
    
    if (query.isEmpty) {
      print('📋 Provider: Returning ${_products.length} cached products for empty query');
      return _products;
    }
    
    try {
      print('🌐 Provider: Making API call to search products');
      await loadProducts(filter: query);
      print('✅ Provider: API call successful, returning ${_products.length} products');
      return _products;
    } catch (e) {
      print('❌ Provider: Error searching products: $e');
      // Return cached products filtered locally as fallback
      final filtered = _products.where((product) =>
          product.name.toLowerCase().contains(query.toLowerCase()) ||
          product.productCode.toLowerCase().contains(query.toLowerCase()) ||
          product.description.toLowerCase().contains(query.toLowerCase())
      ).toList();
      print('🔄 Provider: Falling back to local filter, returning ${filtered.length} products');
      return filtered;
    }
  }
} 
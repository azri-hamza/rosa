import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../providers/delivery_notes_provider.dart';

class ProductAutocomplete extends StatefulWidget {
  final String? initialValue;
  final Function(Product?) onProductSelected;
  final String? Function(String?)? validator;
  final bool enabled;

  const ProductAutocomplete({
    super.key,
    this.initialValue,
    required this.onProductSelected,
    this.validator,
    this.enabled = true,
  });

  @override
  State<ProductAutocomplete> createState() => _ProductAutocompleteState();
}

class _ProductAutocompleteState extends State<ProductAutocomplete> {
  late TextEditingController _controller;
  bool _isLoading = false;
  List<Product> _suggestions = [];
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialValue ?? '');
    
    // Load initial products
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadInitialProducts();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _loadInitialProducts() async {
    if (!mounted) return;
    
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    try {
      final provider = Provider.of<DeliveryNotesProvider>(context, listen: false);
      await provider.loadProducts();
      
      if (mounted) {
        setState(() {
          _suggestions = provider.products;
          _isLoading = false;
        });
        print('🎯 Initial products loaded: ${_suggestions.length}');
      }
    } catch (e) {
      print('❌ Failed to load initial products: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = _getErrorMessage(e.toString());
        });
      }
    }
  }

  String _getErrorMessage(String error) {
    if (error.contains('Authentication required') || error.contains('401') || error.contains('Unauthorized')) {
      return 'Please log in to search products';
    } else if (error.contains('Network error') || error.contains('Connection refused')) {
      return 'Network error - check connection';
    } else {
      return 'Unable to load products';
    }
  }

  Future<void> _searchProducts(String query) async {
    if (!mounted) return;
    
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('🔍 Searching products with query: "$query"');
      final provider = Provider.of<DeliveryNotesProvider>(context, listen: false);
      final results = await provider.searchProducts(query);
      
      print('📦 Found ${results.length} products');
      if (results.isNotEmpty) {
        print('📦 First product: ${results.first.name}');
      }
      
      if (mounted) {
        setState(() {
          _suggestions = results;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('❌ Error searching products: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = _getErrorMessage(e.toString());
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Autocomplete<Product>(
      initialValue: TextEditingValue(text: widget.initialValue ?? ''),
      optionsBuilder: (TextEditingValue textEditingValue) {
        print('🔤 Options builder called with: "${textEditingValue.text}"');
        print('📋 Current suggestions count: ${_suggestions.length}');
        
        if (textEditingValue.text.isEmpty) {
          final options = _suggestions.take(10);
          print('📋 Returning ${options.length} initial options');
          return options;
        }
        
        // Trigger search for new queries
        _searchProducts(textEditingValue.text);
        
        // Return current suggestions filtered locally for immediate response
        final filtered = _suggestions.where((Product option) {
          final query = textEditingValue.text.toLowerCase();
          return option.name.toLowerCase().contains(query) ||
                 option.productCode.toLowerCase().contains(query) ||
                 option.description.toLowerCase().contains(query);
        }).take(10);
        
        print('📋 Returning ${filtered.length} filtered options');
        return filtered;
      },
      displayStringForOption: (Product option) => option.name,
      fieldViewBuilder: (context, textEditingController, focusNode, onFieldSubmitted) {
        // Set initial value if the controller is empty but we have an initial value
        if (textEditingController.text.isEmpty && (widget.initialValue?.isNotEmpty ?? false)) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (textEditingController.text.isEmpty) {
              textEditingController.text = widget.initialValue!;
            }
          });
        }
        
        // Sync our internal controller with the autocomplete controller
        _controller.text = textEditingController.text;
        
        return TextFormField(
          controller: textEditingController,
          focusNode: focusNode,
          enabled: widget.enabled,
          decoration: InputDecoration(
            labelText: 'Product Name *',
            border: const OutlineInputBorder(),
            prefixIcon: const Icon(Icons.shopping_cart),
            suffixIcon: _isLoading 
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: Padding(
                      padding: EdgeInsets.all(12.0),
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : const Icon(Icons.search),
            isDense: true,
            helperText: _errorMessage ?? 'Type to search for products',
            errorText: _errorMessage,
            helperStyle: _errorMessage != null 
                ? TextStyle(color: Colors.red.shade600)
                : null,
          ),
          validator: widget.validator,
          onFieldSubmitted: (value) {
            onFieldSubmitted();
          },
        );
      },
      optionsViewBuilder: (context, onSelected, options) {
        if (options.isEmpty) {
          return Align(
            alignment: Alignment.topLeft,
            child: Material(
              elevation: 4.0,
              child: Container(
                constraints: const BoxConstraints(maxWidth: 300),
                padding: const EdgeInsets.all(16),
                child: Text(
                  _errorMessage ?? 'No products found',
                  style: TextStyle(
                    color: _errorMessage != null ? Colors.red.shade600 : Colors.grey.shade600,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          );
        }
        
        return Align(
          alignment: Alignment.topLeft,
          child: Material(
            elevation: 4.0,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 200, maxWidth: 300),
              child: ListView.builder(
                padding: EdgeInsets.zero,
                shrinkWrap: true,
                itemCount: options.length,
                itemBuilder: (BuildContext context, int index) {
                  final Product option = options.elementAt(index);
                  return InkWell(
                    onTap: () => onSelected(option),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            option.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Code: ${option.productCode}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          if (option.description.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              option.description,
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey.shade500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        );
      },
      onSelected: (Product selection) {
        _controller.text = selection.name;
        widget.onProductSelected(selection);
      },
    );
  }
} 
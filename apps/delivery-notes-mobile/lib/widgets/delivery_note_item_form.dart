import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/delivery_note.dart';
import '../models/product.dart';
import 'product_autocomplete.dart';

class DeliveryNoteItemForm extends StatefulWidget {
  final CreateDeliveryNoteItemRequest item;
  final Function(CreateDeliveryNoteItemRequest) onChanged;
  final VoidCallback? onRemove;

  const DeliveryNoteItemForm({
    super.key,
    required this.item,
    required this.onChanged,
    this.onRemove,
  });

  @override
  State<DeliveryNoteItemForm> createState() => _DeliveryNoteItemFormState();
}

class _DeliveryNoteItemFormState extends State<DeliveryNoteItemForm> {
  late TextEditingController _descriptionController;
  late TextEditingController _quantityController;
  late TextEditingController _unitPriceController;
  late TextEditingController _deliveredQuantityController;
  
  Product? _selectedProduct;

  @override
  void initState() {
    super.initState();
    _descriptionController = TextEditingController(text: widget.item.description ?? '');
    _quantityController = TextEditingController(text: widget.item.quantity.toString());
    _unitPriceController = TextEditingController(text: widget.item.unitPrice.toString());
    _deliveredQuantityController = TextEditingController(
      text: widget.item.deliveredQuantity?.toString() ?? widget.item.quantity.toString(),
    );
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _quantityController.dispose();
    _unitPriceController.dispose();
    _deliveredQuantityController.dispose();
    super.dispose();
  }

  void _updateItem() {
    final quantity = double.tryParse(_quantityController.text) ?? 0.0;
    final unitPrice = double.tryParse(_unitPriceController.text) ?? 0.0;
    final deliveredQuantity = double.tryParse(_deliveredQuantityController.text) ?? quantity;
    
    final updatedItem = CreateDeliveryNoteItemRequest(
      productName: _selectedProduct?.name ?? widget.item.productName,
      description: _descriptionController.text.trim().isEmpty 
          ? null 
          : _descriptionController.text.trim(),
      quantity: quantity,
      deliveredQuantity: deliveredQuantity,
      unitPrice: unitPrice,
      totalPrice: quantity * unitPrice,
      productId: _selectedProduct?.productId ?? widget.item.productId,
    );
    
    widget.onChanged(updatedItem);
  }

  void _onProductSelected(Product? product) {
    setState(() {
      _selectedProduct = product;
      if (product != null) {
        // Auto-fill description if not already set
        if (_descriptionController.text.isEmpty && product.description.isNotEmpty) {
          _descriptionController.text = product.description;
        }
      }
    });
    _updateItem();
  }

  double get _totalPrice {
    final quantity = double.tryParse(_quantityController.text) ?? 0.0;
    final unitPrice = double.tryParse(_unitPriceController.text) ?? 0.0;
    return quantity * unitPrice;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with remove button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Item Details',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (widget.onRemove != null)
                  IconButton(
                    onPressed: widget.onRemove,
                    icon: const Icon(Icons.remove_circle_outline),
                    color: Colors.red,
                    iconSize: 20,
                  ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Product Name with Autocomplete
            ProductAutocomplete(
              initialValue: widget.item.productName,
              onProductSelected: _onProductSelected,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Product name is required';
                }
                return null;
              },
            ),
            
            const SizedBox(height: 12),
            
            // Description
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description (Optional)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.description),
                isDense: true,
              ),
              maxLines: 2,
              onChanged: (_) => _updateItem(),
            ),
            
            const SizedBox(height: 12),
            
            // Quantity and Unit Price Row
            Row(
              children: [
                // Quantity
                Expanded(
                  child: TextFormField(
                    controller: _quantityController,
                    decoration: const InputDecoration(
                      labelText: 'Quantity *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.numbers),
                      isDense: true,
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
                    ],
                    onChanged: (_) {
                      _updateItem();
                      setState(() {}); // Update total price display
                    },
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Required';
                      }
                      final quantity = double.tryParse(value);
                      if (quantity == null || quantity <= 0) {
                        return 'Invalid quantity';
                      }
                      return null;
                    },
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // Unit Price
                Expanded(
                  child: TextFormField(
                    controller: _unitPriceController,
                    decoration: const InputDecoration(
                      labelText: 'Unit Price *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.attach_money),
                      isDense: true,
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
                    ],
                    onChanged: (_) {
                      _updateItem();
                      setState(() {}); // Update total price display
                    },
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Required';
                      }
                      final price = double.tryParse(value);
                      if (price == null || price < 0) {
                        return 'Invalid price';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Delivered Quantity
            TextFormField(
              controller: _deliveredQuantityController,
              decoration: const InputDecoration(
                labelText: 'Delivered Quantity',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.local_shipping),
                isDense: true,
                helperText: 'Leave empty to use ordered quantity',
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
              ],
              onChanged: (_) => _updateItem(),
            ),
            
            const SizedBox(height: 12),
            
            // Total Price Display
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Total Price:',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    '\$${_totalPrice.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.blue.shade700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
} 
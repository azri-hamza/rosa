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
  late TextEditingController _productNameController;
  late TextEditingController _descriptionController;
  late TextEditingController _quantityController;
  late TextEditingController _deliveredQuantityController;
  late TextEditingController _unitPriceController;
  late TextEditingController _discountPercentageController;
  late TextEditingController _discountAmountController;
  late TextEditingController _vatRateController;
  
  Product? _selectedProduct;

  @override
  void initState() {
    super.initState();
    _productNameController = TextEditingController(text: widget.item.productName);
    _descriptionController = TextEditingController(text: widget.item.description);
    _quantityController = TextEditingController(text: widget.item.quantity.toString());
    _deliveredQuantityController = TextEditingController(text: widget.item.deliveredQuantity.toString());
    _unitPriceController = TextEditingController(text: widget.item.unitPrice.toString());
    _discountPercentageController = TextEditingController(text: widget.item.discountPercentage?.toString() ?? '0');
    _discountAmountController = TextEditingController(text: widget.item.discountAmount?.toString() ?? '0');
    _vatRateController = TextEditingController(text: widget.item.vatRate?.toString() ?? '0');
  }

  @override
  void dispose() {
    _productNameController.dispose();
    _descriptionController.dispose();
    _quantityController.dispose();
    _deliveredQuantityController.dispose();
    _unitPriceController.dispose();
    _discountPercentageController.dispose();
    _discountAmountController.dispose();
    _vatRateController.dispose();
    super.dispose();
  }

  void _updateItem() {
    final quantity = double.tryParse(_quantityController.text) ?? 0.0;
    final unitPrice = double.tryParse(_unitPriceController.text) ?? 0.0;
    final discountPercentage = double.tryParse(_discountPercentageController.text) ?? 0.0;
    final discountAmount = double.tryParse(_discountAmountController.text) ?? 0.0;
    final vatRate = double.tryParse(_vatRateController.text) ?? 0.0;
    
    final netUnitPrice = unitPrice - (unitPrice * discountPercentage / 100);
    final grossUnitPrice = netUnitPrice * (1 + vatRate / 100);
    final totalPrice = quantity * netUnitPrice;
    final vatAmount = totalPrice * vatRate / 100;
    final grossTotalPrice = totalPrice + vatAmount;
    
    final updatedItem = CreateDeliveryNoteItemRequest(
      productName: _selectedProduct?.name ?? widget.item.productName,
      description: _descriptionController.text.trim().isEmpty 
          ? null 
          : _descriptionController.text.trim(),
      quantity: quantity,
      deliveredQuantity: double.tryParse(_deliveredQuantityController.text) ?? quantity,
      unitPrice: unitPrice,
      discountPercentage: discountPercentage,
      discountAmount: discountAmount,
      netUnitPrice: netUnitPrice,
      grossUnitPrice: grossUnitPrice,
      totalPrice: totalPrice,
      vatRate: vatRate,
      vatAmount: vatAmount,
      grossTotalPrice: grossTotalPrice,
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
        // Auto-fill unit price if available
        if (product.netPrice != null && product.netPrice! > 0) {
          _unitPriceController.text = product.netPrice!.toString();
        }
        // Auto-fill VAT rate if available
        if (product.vatRate != null) {
          _vatRateController.text = (product.vatRate! * 100).toString();
        }
      }
    });
    _updateItem();
  }

  double get _netTotal {
    final quantity = double.tryParse(_quantityController.text) ?? 0.0;
    final unitPrice = double.tryParse(_unitPriceController.text) ?? 0.0;
    return quantity * unitPrice;
  }

  double get _vatAmount {
    final vatRate = double.tryParse(_vatRateController.text) ?? 0.0;
    return _netTotal * vatRate / 100;
  }

  double get _grossTotal {
    return _netTotal + _vatAmount;
  }

  double get _grossUnitPrice {
    final unitPrice = double.tryParse(_unitPriceController.text) ?? 0.0;
    final vatRate = double.tryParse(_vatRateController.text) ?? 0.0;
    return unitPrice * (1 + vatRate / 100);
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
                      setState(() {}); // Update calculated values display
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
                      setState(() {}); // Update calculated values display
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
            
            // VAT Rate and Gross Unit Price Row
            Row(
              children: [
                // VAT Rate
                Expanded(
                  child: TextFormField(
                    controller: _vatRateController,
                    decoration: const InputDecoration(
                      labelText: 'VAT Rate (%)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.percent),
                      isDense: true,
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
                    ],
                    onChanged: (_) {
                      _updateItem();
                      setState(() {}); // Update calculated values display
                    },
                    validator: (value) {
                      if (value != null && value.trim().isNotEmpty) {
                        final vatRate = double.tryParse(value);
                        if (vatRate == null || vatRate < 0 || vatRate > 100) {
                          return 'Invalid VAT rate';
                        }
                      }
                      return null;
                    },
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // Gross Unit Price (Read-only)
                Expanded(
                  child: TextFormField(
                    decoration: const InputDecoration(
                      labelText: 'Gross Unit Price',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.euro),
                      isDense: true,
                    ),
                    controller: TextEditingController(text: '\$${_grossUnitPrice.toStringAsFixed(3)}'),
                    readOnly: true,
                    style: TextStyle(color: Colors.grey[600]),
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
            
            // Price Summary
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Net Total:',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        '\$${_netTotal.toStringAsFixed(3)}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.blue.shade700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'VAT Amount:',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        '\$${_vatAmount.toStringAsFixed(3)}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.orange.shade700,
                        ),
                      ),
                    ],
                  ),
                  const Divider(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Gross Total:',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '\$${_grossTotal.toStringAsFixed(3)}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.green.shade700,
                          fontSize: 16,
                        ),
                      ),
                    ],
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
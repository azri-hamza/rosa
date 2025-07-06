import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/delivery_note.dart';
import '../models/client.dart';
import '../providers/delivery_notes_provider.dart';
import '../widgets/delivery_note_item_form.dart';

class EditDeliveryNoteScreen extends StatefulWidget {
  final DeliveryNote deliveryNote;

  const EditDeliveryNoteScreen({
    super.key,
    required this.deliveryNote,
  });

  @override
  State<EditDeliveryNoteScreen> createState() => _EditDeliveryNoteScreenState();
}

class _EditDeliveryNoteScreenState extends State<EditDeliveryNoteScreen> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  final _deliveryAddressController = TextEditingController();

  late DateTime _selectedDate;
  Client? _selectedClient;
  String _selectedStatus = 'pending';
  List<CreateDeliveryNoteItemRequest> _items = [];
  
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _initializeForm();
  }

  void _initializeForm() {
    // Initialize form with existing delivery note data
    _selectedDate = widget.deliveryNote.deliveryDate;
    _selectedStatus = widget.deliveryNote.status;
    _notesController.text = widget.deliveryNote.notes ?? '';
    _deliveryAddressController.text = widget.deliveryNote.deliveryAddress ?? '';
    
    // Convert existing items to CreateDeliveryNoteItemRequest
    _items = widget.deliveryNote.items.map((item) => CreateDeliveryNoteItemRequest(
      productName: item.productName,
      description: item.description,
      quantity: item.quantity,
      deliveredQuantity: item.deliveredQuantity,
      netUnitPrice: item.netUnitPrice,
      grossUnitPrice: item.grossUnitPrice,
      totalPrice: item.totalPrice,
      vatRate: item.vatRate,
      vatAmount: item.vatAmount,
      grossTotalPrice: item.grossTotalPrice,
      productId: item.productId,
    )).toList();
    
    // Initialize client after provider data is loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeClient();
      _loadProducts(); // Load products for auto-complete
    });
  }

  void _initializeClient() {
    if (widget.deliveryNote.client != null) {
      final provider = Provider.of<DeliveryNotesProvider>(context, listen: false);
      
      // Only initialize if clients are loaded
      if (provider.clients.isNotEmpty) {
        // Find matching client by ID from provider's list
        try {
          final matchingClient = provider.clients.firstWhere(
            (client) => client.id == widget.deliveryNote.client!.id,
          );
          
          setState(() {
            _selectedClient = matchingClient;
          });
        } catch (e) {
          // If no matching client found, keep as null
          print('No matching client found for ID: ${widget.deliveryNote.client!.id}');
        }
      }
    }
  }

  Future<void> _loadProducts() async {
    final provider = Provider.of<DeliveryNotesProvider>(context, listen: false);
    try {
      await provider.loadProducts();
      print('Products loaded for autocomplete: ${provider.products.length}');
    } catch (e) {
      print('Error loading products: $e');
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    _deliveryAddressController.dispose();
    super.dispose();
  }

  void _addItem() {
    setState(() {
      _items.add(CreateDeliveryNoteItemRequest(
        productName: '',
        quantity: 1.0,
        netUnitPrice: 0.0,
        vatRate: 0.0,
      ));
    });
  }

  void _removeItem(int index) {
    setState(() {
      _items.removeAt(index);
    });
  }

  void _updateItem(int index, CreateDeliveryNoteItemRequest item) {
    setState(() {
      _items[index] = item;
    });
  }

  double get _netTotalAmount {
    return _items.fold(0.0, (sum, item) => sum + (item.totalPrice ?? (item.quantity * item.netUnitPrice)));
  }

  double get _totalVatAmount {
    return _items.fold(0.0, (sum, item) => sum + (item.vatAmount ?? 0.0));
  }

  double get _grossTotalAmount {
    return _items.fold(0.0, (sum, item) => sum + (item.grossTotalPrice ?? (item.totalPrice ?? (item.quantity * item.netUnitPrice))));
  }

  void _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (date != null) {
      setState(() {
        _selectedDate = date;
      });
    }
  }

  void _saveDeliveryNote() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least one item'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final provider = Provider.of<DeliveryNotesProvider>(context, listen: false);
      
      final request = CreateDeliveryNoteRequest(
        clientId: _selectedClient?.id,
        deliveryDate: _selectedDate,
        deliveryAddress: _deliveryAddressController.text.trim().isEmpty 
            ? null 
            : _deliveryAddressController.text.trim(),
        notes: _notesController.text.trim().isEmpty 
            ? null 
            : _notesController.text.trim(),
        status: _selectedStatus,
        items: _items,
      );

      final updatedDeliveryNote = await provider.updateDeliveryNote(
        widget.deliveryNote.referenceId, 
        request,
      );

      if (updatedDeliveryNote != null && mounted) {
        Navigator.of(context).pop(true); // Return true to indicate success
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Delivery note updated successfully'),
            backgroundColor: Colors.green,
          ),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error updating delivery note: ${provider.error}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Edit DN-${widget.deliveryNote.displayNumber}'),
        actions: [
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else
            TextButton(
              onPressed: _saveDeliveryNote,
              child: const Text(
                'SAVE',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
        ],
      ),
      body: Consumer<DeliveryNotesProvider>(
        builder: (context, provider, child) {
          return Form(
            key: _formKey,
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Client selection
                        _buildClientSection(provider),
                        const SizedBox(height: 20),
                        
                        // Delivery date and status
                        _buildDeliverySection(),
                        const SizedBox(height: 20),
                        
                        // Delivery address
                        _buildAddressSection(),
                        const SizedBox(height: 20),
                        
                        // Items section
                        _buildItemsSection(),
                        const SizedBox(height: 20),
                        
                        // Total Amount Summary
                        _buildTotalSection(),
                        const SizedBox(height: 20),
                        
                        // Notes section
                        _buildNotesSection(),
                        const SizedBox(height: 100), // Extra space for floating button
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _isLoading ? null : _saveDeliveryNote,
        icon: _isLoading 
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : const Icon(Icons.save),
        label: Text(_isLoading ? 'Saving...' : 'Save Changes'),
        backgroundColor: _isLoading ? Colors.grey : null,
      ),
    );
  }

  Widget _buildClientSection(DeliveryNotesProvider provider) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Client Information',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<Client>(
              value: _selectedClient,
              decoration: const InputDecoration(
                labelText: 'Select Client',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.business),
              ),
              items: [
                const DropdownMenuItem<Client>(
                  value: null,
                  child: Text('No client selected'),
                ),
                ...provider.clients.map((client) => DropdownMenuItem<Client>(
                  value: client,
                  child: Text(client.name),
                )),
              ],
              onChanged: (client) {
                setState(() {
                  _selectedClient = client;
                });
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDeliverySection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Delivery Details',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: _selectDate,
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        labelText: 'Delivery Date',
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.calendar_today),
                      ),
                      child: Text(
                        DateFormat('MMM dd, yyyy').format(_selectedDate),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedStatus,
                    decoration: const InputDecoration(
                      labelText: 'Status',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.info),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'pending', child: Text('Pending')),
                      DropdownMenuItem(value: 'delivered', child: Text('Delivered')),
                      DropdownMenuItem(value: 'cancelled', child: Text('Cancelled')),
                    ],
                    onChanged: (status) {
                      setState(() {
                        _selectedStatus = status!;
                      });
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddressSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Delivery Address',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _deliveryAddressController,
              decoration: const InputDecoration(
                labelText: 'Delivery Address (Optional)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.location_on),
                hintText: 'Enter the delivery address',
              ),
              maxLines: 3,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItemsSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Items (${_items.length})',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton.icon(
                  onPressed: _addItem,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Item'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ..._items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: DeliveryNoteItemForm(
                  item: item,
                  onChanged: (updatedItem) => _updateItem(index, updatedItem),
                  onRemove: () => _removeItem(index),
                ),
              );
            }),
            if (_items.isEmpty)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.inventory_2_outlined,
                      size: 48,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'No items added yet',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Tap "Add Item" to get started',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey.shade500,
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

  Widget _buildTotalSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Total Summary',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Net Total:',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      Text(
                        '\$${_netTotalAmount.toStringAsFixed(3)}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'VAT Total:',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      Text(
                        '\$${_totalVatAmount.toStringAsFixed(3)}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
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
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '\$${_grossTotalAmount.toStringAsFixed(3)}',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.green.shade700,
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

  Widget _buildNotesSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Notes',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: 'Additional Notes (Optional)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.note_alt),
                hintText: 'Add any additional notes or comments',
              ),
              maxLines: 4,
            ),
          ],
        ),
      ),
    );
  }
} 
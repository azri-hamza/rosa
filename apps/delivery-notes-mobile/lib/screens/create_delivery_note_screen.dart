import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/delivery_note.dart';
import '../models/client.dart';
import '../providers/delivery_notes_provider.dart';
import '../widgets/delivery_note_item_form.dart';

class CreateDeliveryNoteScreen extends StatefulWidget {
  const CreateDeliveryNoteScreen({super.key});

  @override
  State<CreateDeliveryNoteScreen> createState() => _CreateDeliveryNoteScreenState();
}

class _CreateDeliveryNoteScreenState extends State<CreateDeliveryNoteScreen> {
  final _formKey = GlobalKey<FormState>();
  final _deliveryAddressController = TextEditingController();
  final _notesController = TextEditingController();
  
  Client? _selectedClient;
  DateTime _selectedDeliveryDate = DateTime.now();
  String _selectedStatus = 'pending';
  List<CreateDeliveryNoteItemRequest> _items = [];
  
  final List<String> _statusOptions = ['pending', 'delivered', 'cancelled'];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadClients();
    _loadProducts(); // Load products for auto-complete
    _addItem(); // Add initial item
  }

  @override
  void dispose() {
    _deliveryAddressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadClients() async {
    final provider = Provider.of<DeliveryNotesProvider>(context, listen: false);
    await provider.loadClients();
  }

  Future<void> _loadProducts() async {
    final provider = Provider.of<DeliveryNotesProvider>(context, listen: false);
    print('🧪 About to load products...');
    await provider.loadProducts();
    print('🧪 Products loaded: ${provider.products.length}');
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
    if (_items.length > 1) {
      setState(() {
        _items.removeAt(index);
      });
    }
  }

  void _updateItem(int index, CreateDeliveryNoteItemRequest updatedItem) {
    setState(() {
      _items[index] = updatedItem;
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

  Future<void> _selectDeliveryDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDeliveryDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    
    if (picked != null && picked != _selectedDeliveryDate) {
      setState(() {
        _selectedDeliveryDate = picked;
      });
    }
  }

  Future<void> _saveDeliveryNote() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedClient == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a client')),
      );
      return;
    }

    if (_items.isEmpty || _items.any((item) => item.productName.trim().isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one valid item')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final request = CreateDeliveryNoteRequest(
        clientId: _selectedClient!.id,
        deliveryDate: _selectedDeliveryDate,
        deliveryAddress: _deliveryAddressController.text.trim().isEmpty 
            ? null 
            : _deliveryAddressController.text.trim(),
        notes: _notesController.text.trim().isEmpty 
            ? null 
            : _notesController.text.trim(),
        status: _selectedStatus,
        items: _items.where((item) => item.productName.trim().isNotEmpty).toList(),
      );

      final provider = Provider.of<DeliveryNotesProvider>(context, listen: false);
      final createdNote = await provider.createDeliveryNote(request);

      if (createdNote != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Delivery note created successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop(true); // Return true to indicate success
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.error ?? 'Failed to create delivery note'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
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
        title: const Text('Create Delivery Note'),
        actions: [
          if (!_isLoading)
            TextButton(
              onPressed: _saveDeliveryNote,
              child: const Text('Save'),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Client Selection
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Client Information',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 12),
                            Consumer<DeliveryNotesProvider>(
                              builder: (context, provider, child) {
                                return DropdownButtonFormField<Client>(
                                  value: _selectedClient,
                                  decoration: const InputDecoration(
                                    labelText: 'Select Client',
                                    border: OutlineInputBorder(),
                                    prefixIcon: Icon(Icons.person),
                                  ),
                                  items: provider.clients.map((client) {
                                    return DropdownMenuItem<Client>(
                                      value: client,
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(client.name),
                                          if (client.address != null)
                                            Text(
                                              client.address!,
                                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                                color: Colors.grey.shade600,
                                              ),
                                            ),
                                        ],
                                      ),
                                    );
                                  }).toList(),
                                  onChanged: (client) {
                                    setState(() {
                                      _selectedClient = client;
                                      if (client?.address != null) {
                                        _deliveryAddressController.text = client!.address!;
                                      }
                                    });
                                  },
                                  validator: (value) {
                                    if (value == null) {
                                      return 'Please select a client';
                                    }
                                    return null;
                                  },
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Delivery Details
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Delivery Details',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 12),
                            
                            // Delivery Date
                            InkWell(
                              onTap: _selectDeliveryDate,
                              child: InputDecorator(
                                decoration: const InputDecoration(
                                  labelText: 'Delivery Date',
                                  border: OutlineInputBorder(),
                                  prefixIcon: Icon(Icons.calendar_today),
                                ),
                                child: Text(
                                  DateFormat('MMM dd, yyyy').format(_selectedDeliveryDate),
                                ),
                              ),
                            ),
                            
                            const SizedBox(height: 12),
                            
                            // Status
                            DropdownButtonFormField<String>(
                              value: _selectedStatus,
                              decoration: const InputDecoration(
                                labelText: 'Status',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.flag),
                              ),
                              items: _statusOptions.map((status) {
                                return DropdownMenuItem<String>(
                                  value: status,
                                  child: Text(status.toUpperCase()),
                                );
                              }).toList(),
                              onChanged: (status) {
                                setState(() {
                                  _selectedStatus = status!;
                                });
                              },
                            ),
                            
                            const SizedBox(height: 12),
                            
                            // Delivery Address
                            TextFormField(
                              controller: _deliveryAddressController,
                              decoration: const InputDecoration(
                                labelText: 'Delivery Address (Optional)',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.location_on),
                              ),
                              maxLines: 2,
                            ),
                            
                            const SizedBox(height: 12),
                            
                            // Notes
                            TextFormField(
                              controller: _notesController,
                              decoration: const InputDecoration(
                                labelText: 'Notes (Optional)',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.note),
                              ),
                              maxLines: 3,
                            ),
                          ],
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Items Section
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Items',
                                  style: Theme.of(context).textTheme.titleMedium,
                                ),
                                ElevatedButton.icon(
                                  onPressed: _addItem,
                                  icon: const Icon(Icons.add),
                                  label: const Text('Add Item'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            
                            // Items List
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _items.length,
                              separatorBuilder: (context, index) => const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                return DeliveryNoteItemForm(
                                  item: _items[index],
                                  onChanged: (updatedItem) => _updateItem(index, updatedItem),
                                  onRemove: _items.length > 1 ? () => _removeItem(index) : null,
                                );
                              },
                            ),
                            
                            const SizedBox(height: 16),
                            
                            // Total Amount Summary
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
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Save Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _saveDeliveryNote,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator()
                            : const Text('Create Delivery Note'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
} 
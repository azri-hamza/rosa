import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/delivery_note.dart';
import '../providers/delivery_notes_provider.dart';
import 'edit_delivery_note_screen.dart';

class DeliveryNoteDetailScreen extends StatefulWidget {
  final DeliveryNote deliveryNote;

  const DeliveryNoteDetailScreen({
    super.key,
    required this.deliveryNote,
  });

  @override
  State<DeliveryNoteDetailScreen> createState() => _DeliveryNoteDetailScreenState();
}

class _DeliveryNoteDetailScreenState extends State<DeliveryNoteDetailScreen> {
  late DeliveryNote _currentDeliveryNote;

  @override
  void initState() {
    super.initState();
    _currentDeliveryNote = widget.deliveryNote;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<DeliveryNotesProvider>(
      builder: (context, provider, child) {
        // Try to find the current delivery note from the provider's list
        // This ensures we always show the most up-to-date data
        DeliveryNote currentDeliveryNote;
        try {
          currentDeliveryNote = provider.deliveryNotes
              .firstWhere((dn) => dn.referenceId == widget.deliveryNote.referenceId);
          
          // Update our local state with the fresh data
          _currentDeliveryNote = currentDeliveryNote;
          
          print('🔄 Detail view updated with fresh delivery note data: ${currentDeliveryNote.referenceId}');
        } catch (e) {
          // If delivery note not found in provider, use our current local state
          currentDeliveryNote = _currentDeliveryNote;
          print('⚠️ Using cached delivery note data (not found in provider): ${_currentDeliveryNote.referenceId}');
        }

        final dateFormat = DateFormat('MMM dd, yyyy');
        final currencyFormat = NumberFormat.currency(symbol: '\$');

        return Scaffold(
          appBar: AppBar(
            title: Text('DN-${currentDeliveryNote.displayNumber}'),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () => _refreshDeliveryNote(provider),
                tooltip: 'Refresh',
              ),
              IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () => _navigateToEdit(context, currentDeliveryNote),
                tooltip: 'Edit Delivery Note',
              ),
              PopupMenuButton<String>(
                onSelected: (value) => _handleMenuAction(context, value, currentDeliveryNote),
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: Row(
                      children: [
                        Icon(Icons.edit),
                        SizedBox(width: 8),
                        Text('Edit'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete, color: Colors.red),
                        SizedBox(width: 8),
                        Text('Delete', style: TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Status and header info
                _buildHeaderCard(context, dateFormat, currentDeliveryNote),
                const SizedBox(height: 16),
                
                // Client information
                _buildClientCard(context, currentDeliveryNote),
                const SizedBox(height: 16),
                
                // Delivery information
                _buildDeliveryCard(context, dateFormat, currentDeliveryNote),
                const SizedBox(height: 16),
                
                // Items section
                _buildItemsCard(context, currencyFormat, currentDeliveryNote),
                const SizedBox(height: 16),
                
                // Notes section
                if (currentDeliveryNote.notes != null && currentDeliveryNote.notes!.isNotEmpty)
                  _buildNotesCard(context, currentDeliveryNote),
              ],
            ),
          ),
          bottomNavigationBar: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.2),
                  blurRadius: 4,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _navigateToEdit(context, currentDeliveryNote),
                  icon: const Icon(Icons.edit),
                  label: const Text('Edit Delivery Note'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeaderCard(BuildContext context, DateFormat dateFormat, DeliveryNote deliveryNote) {
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
                  'DN-${deliveryNote.displayNumber}',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                _buildStatusChip(deliveryNote.status),
              ],
            ),
            const SizedBox(height: 16),
            _buildInfoRow(
              context,
              Icons.fingerprint,
              'Reference ID',
              deliveryNote.referenceId,
            ),
            const SizedBox(height: 8),
            _buildInfoRow(
              context,
              Icons.attach_money,
              'Total Amount',
              '\$${deliveryNote.totalAmount.toStringAsFixed(2)}',
              valueColor: Colors.green.shade700,
              valueWeight: FontWeight.bold,
            ),
            const SizedBox(height: 8),
            _buildInfoRow(
              context,
              Icons.inventory_2,
              'Items',
              '${deliveryNote.itemCount} item${deliveryNote.itemCount != 1 ? 's' : ''}',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClientCard(BuildContext context, DeliveryNote deliveryNote) {
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
            if (deliveryNote.client != null) ...[
              _buildInfoRow(
                context,
                Icons.business,
                'Name',
                deliveryNote.client!.name,
              ),
              if (deliveryNote.client!.address != null) ...[
                const SizedBox(height: 8),
                _buildInfoRow(
                  context,
                  Icons.location_on,
                  'Address',
                  deliveryNote.client!.address!,
                ),
              ],
            ] else ...[
              Text(
                'No client assigned',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey.shade600,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDeliveryCard(BuildContext context, DateFormat dateFormat, DeliveryNote deliveryNote) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Delivery Information',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildInfoRow(
              context,
              Icons.calendar_today,
              'Delivery Date',
              dateFormat.format(deliveryNote.deliveryDate),
            ),
            if (deliveryNote.deliveryAddress != null && deliveryNote.deliveryAddress!.isNotEmpty) ...[
              const SizedBox(height: 8),
              _buildInfoRow(
                context,
                Icons.location_on,
                'Delivery Address',
                deliveryNote.deliveryAddress!,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildItemsCard(BuildContext context, NumberFormat currencyFormat, DeliveryNote deliveryNote) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Items (${deliveryNote.items.length})',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...deliveryNote.items.map((item) => _buildItemCard(context, item, currencyFormat)),
          ],
        ),
      ),
    );
  }

  Widget _buildItemCard(BuildContext context, DeliveryNoteItem item, NumberFormat currencyFormat) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            item.productName,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          if (item.description != null && item.description!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              item.description!,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey.shade600,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildItemDetail('Quantity', '${item.quantity}'),
              ),
              Expanded(
                child: _buildItemDetail('Delivered', '${item.deliveredQuantity}'),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: _buildItemDetail('Net Unit Price', currencyFormat.format(item.netUnitPrice)),
              ),
              Expanded(
                child: _buildItemDetail('VAT Rate', '${(item.vatRate ?? 0).toStringAsFixed(1)}%'),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: _buildItemDetail('Gross Unit Price', currencyFormat.format(item.grossUnitPrice)),
              ),
              Expanded(
                child: _buildItemDetail('VAT Amount', currencyFormat.format(item.vatAmount)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Expanded(
                child: _buildItemDetail(
                  'Net Total',
                  currencyFormat.format(item.totalPrice),
                  valueColor: Colors.blue.shade700,
                ),
              ),
              Expanded(
                child: _buildItemDetail(
                  'Gross Total',
                  currencyFormat.format(item.grossTotalPrice),
                  valueColor: Colors.green.shade700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildItemDetail(String label, String value, {Color? valueColor}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: valueColor,
          ),
        ),
      ],
    );
  }

  Widget _buildNotesCard(BuildContext context, DeliveryNote deliveryNote) {
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
            Text(
              deliveryNote.notes!,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    BuildContext context,
    IconData icon,
    String label,
    String value, {
    Color? valueColor,
    FontWeight? valueWeight,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          size: 20,
          color: Colors.grey.shade600,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: valueColor,
                  fontWeight: valueWeight,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatusChip(String status) {
    Color backgroundColor;
    Color textColor;
    
    switch (status.toLowerCase()) {
      case 'pending':
        backgroundColor = Colors.orange.shade100;
        textColor = Colors.orange.shade700;
        break;
      case 'delivered':
        backgroundColor = Colors.green.shade100;
        textColor = Colors.green.shade700;
        break;
      case 'cancelled':
        backgroundColor = Colors.red.shade100;
        textColor = Colors.red.shade700;
        break;
      default:
        backgroundColor = Colors.grey.shade100;
        textColor = Colors.grey.shade700;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  void _refreshDeliveryNote(DeliveryNotesProvider provider) async {
    print('🔄 Refreshing delivery note data...');
    await provider.loadDeliveryNotes();
  }

  void _navigateToEdit(BuildContext context, DeliveryNote deliveryNote) async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (context) => EditDeliveryNoteScreen(deliveryNote: deliveryNote),
      ),
    );
    
    // The provider should automatically update its state when updateDeliveryNote is called,
    // and the Consumer will rebuild with the updated data. However, we can optionally
    // refresh to ensure we have the latest data from the server.
    if (result == true && context.mounted) {
      print('✅ Delivery note updated successfully');
      
      // Optional: Force a refresh from the server to ensure data consistency
      // This is generally not needed since the provider updates its state,
      // but can be useful in case of any race conditions
      final provider = Provider.of<DeliveryNotesProvider>(context, listen: false);
      
      // Small delay to allow any pending UI updates to complete
      await Future.delayed(const Duration(milliseconds: 100));
      
      // Check if the updated delivery note is in the provider's list
      final updatedNote = provider.deliveryNotes
          .where((dn) => dn.referenceId == deliveryNote.referenceId)
          .firstOrNull;
      
      if (updatedNote != null) {
        // Update our local cache with the fresh data
        setState(() {
          _currentDeliveryNote = updatedNote;
        });
        print('✅ Local cache updated with fresh delivery note data');
      } else {
        print('⚠️ Updated delivery note not found in provider, refreshing from server');
        _refreshDeliveryNote(provider);
      }
    }
  }

  void _handleMenuAction(BuildContext context, String action, DeliveryNote deliveryNote) {
    switch (action) {
      case 'edit':
        _navigateToEdit(context, deliveryNote);
        break;
      case 'delete':
        _showDeleteConfirmation(context, deliveryNote);
        break;
    }
  }

  void _showDeleteConfirmation(BuildContext context, DeliveryNote deliveryNote) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Delete Delivery Note'),
          content: Text(
            'Are you sure you want to delete delivery note DN-${deliveryNote.displayNumber}? This action cannot be undone.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => _deleteDeliveryNote(context, deliveryNote),
              style: TextButton.styleFrom(
                foregroundColor: Colors.red,
              ),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );
  }

  void _deleteDeliveryNote(BuildContext context, DeliveryNote deliveryNote) async {
    Navigator.of(context).pop(); // Close dialog
    
    final provider = Provider.of<DeliveryNotesProvider>(context, listen: false);
    final success = await provider.deleteDeliveryNote(deliveryNote.referenceId);
    
    if (context.mounted) {
      if (success) {
        Navigator.of(context).pop(); // Return to list
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Delivery note deleted successfully'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error deleting delivery note: ${provider.error}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
} 
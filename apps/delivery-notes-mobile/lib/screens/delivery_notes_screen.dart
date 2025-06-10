import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/delivery_notes_provider.dart';
import '../models/delivery_note.dart';
import '../widgets/delivery_note_card.dart';
import '../widgets/filter_bottom_sheet.dart';
import 'create_delivery_note_screen.dart';
import 'delivery_note_detail_screen.dart';
import 'login_screen.dart';

class DeliveryNotesScreen extends StatefulWidget {
  const DeliveryNotesScreen({super.key});

  @override
  State<DeliveryNotesScreen> createState() => _DeliveryNotesScreenState();
}

class _DeliveryNotesScreenState extends State<DeliveryNotesScreen> {
  @override
  void initState() {
    super.initState();
    // Use addPostFrameCallback with additional delay to ensure proper initialization
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      // Add a small delay to ensure the widget is fully mounted and authentication is settled
      await Future.delayed(const Duration(milliseconds: 200));
      
      if (mounted) {
        final provider = Provider.of<DeliveryNotesProvider>(context, listen: false);
        
        // Clear any previous errors first
        provider.clearError();
        
        // Load clients first, then delivery notes
        await provider.loadClients();
        
        // Add another small delay before loading delivery notes
        if (mounted) {
          await Future.delayed(const Duration(milliseconds: 100));
          await provider.loadDeliveryNotes();
        }
      }
    });
  }

  Future<void> _logout() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const FilterBottomSheet(),
    );
  }

  void _navigateToCreateDeliveryNote() async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (context) => const CreateDeliveryNoteScreen(),
      ),
    );
    
    // Refresh the list if a delivery note was created successfully
    if (result == true && mounted) {
      final provider = Provider.of<DeliveryNotesProvider>(context, listen: false);
      provider.loadDeliveryNotes();
    }
  }

  void _navigateToDeliveryNoteDetail(DeliveryNote deliveryNote) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => DeliveryNoteDetailScreen(deliveryNote: deliveryNote),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Delivery Notes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterBottomSheet,
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'logout') {
                _logout();
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout),
                    SizedBox(width: 8),
                    Text('Logout'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Consumer<DeliveryNotesProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.deliveryNotes.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.red.shade300,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading delivery notes',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    provider.error!,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: provider.loadDeliveryNotes,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (provider.deliveryNotes.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.description_outlined,
                    size: 64,
                    color: Colors.grey.shade300,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No delivery notes found',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Create your first delivery note to get started',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: provider.loadDeliveryNotes,
            child: Column(
              children: [
                // Filter summary
                if (_hasActiveFilters(provider))
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    color: Colors.blue.shade50,
                    child: Row(
                      children: [
                        Icon(Icons.filter_list, color: Colors.blue.shade700),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _getFilterSummary(provider),
                            style: TextStyle(color: Colors.blue.shade700),
                          ),
                        ),
                        TextButton(
                          onPressed: provider.clearFilters,
                          child: const Text('Clear'),
                        ),
                      ],
                    ),
                  ),
                
                // Delivery notes list
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: provider.deliveryNotes.length,
                    itemBuilder: (context, index) {
                      final deliveryNote = provider.deliveryNotes[index];
                      return DeliveryNoteCard(
                        deliveryNote: deliveryNote,
                        onTap: () => _navigateToDeliveryNoteDetail(deliveryNote),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _navigateToCreateDeliveryNote,
        child: const Icon(Icons.add),
      ),
    );
  }

  bool _hasActiveFilters(DeliveryNotesProvider provider) {
    return provider.selectedClientId != null ||
           provider.selectedStatus != null ||
           provider.startDate != null ||
           provider.endDate != null;
  }

  String _getFilterSummary(DeliveryNotesProvider provider) {
    final filters = <String>[];
    
    if (provider.selectedClientId != null) {
      final client = provider.getClientById(provider.selectedClientId);
      filters.add('Client: ${client?.name ?? 'Unknown'}');
    }
    
    if (provider.selectedStatus != null) {
      filters.add('Status: ${provider.selectedStatus}');
    }
    
    if (provider.startDate != null || provider.endDate != null) {
      final dateFormat = DateFormat('MMM dd, yyyy');
      if (provider.startDate != null && provider.endDate != null) {
        filters.add('Date: ${dateFormat.format(provider.startDate!)} - ${dateFormat.format(provider.endDate!)}');
      } else if (provider.startDate != null) {
        filters.add('From: ${dateFormat.format(provider.startDate!)}');
      } else if (provider.endDate != null) {
        filters.add('Until: ${dateFormat.format(provider.endDate!)}');
      }
    }
    
    return filters.join(' • ');
  }
} 
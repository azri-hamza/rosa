import 'package:json_annotation/json_annotation.dart';
import 'client.dart';

part 'delivery_note.g.dart';

@JsonSerializable()
class DeliveryNoteItem {
  @JsonKey(fromJson: _parseId)
  final int id;
  @JsonKey(fromJson: _parseProductName)
  final String productName;
  final String? description;
  final double quantity;
  final double deliveredQuantity;
  final double unitPrice;
  final double totalPrice;
  final String? productId;

  DeliveryNoteItem({
    required this.id,
    required this.productName,
    this.description,
    required this.quantity,
    required this.deliveredQuantity,
    required this.unitPrice,
    required this.totalPrice,
    this.productId,
  });

  factory DeliveryNoteItem.fromJson(Map<String, dynamic> json) => _$DeliveryNoteItemFromJson(json);
  Map<String, dynamic> toJson() => _$DeliveryNoteItemToJson(this);

  static int _parseId(dynamic id) {
    if (id is int) return id;
    if (id is String) return int.parse(id);
    throw FormatException('Invalid id format: $id');
  }

  static String _parseProductName(dynamic productName) {
    if (productName is String) return productName;
    if (productName is Map) return productName['name'] as String;
    throw FormatException('Invalid productName format: $productName');
  }
}

@JsonSerializable()
class DeliveryNote {
  @JsonKey(fromJson: _parseId)
  final int id;
  final String referenceId;
  final int year;
  final int sequenceNumber;
  final DateTime deliveryDate;
  final String? deliveryAddress;
  final String? notes;
  final String status; // 'pending', 'delivered', 'cancelled'
  final Client? client;
  final int? clientId;
  final List<DeliveryNoteItem> items;
  final double totalAmount;
  final int itemCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  DeliveryNote({
    required this.id,
    required this.referenceId,
    required this.year,
    required this.sequenceNumber,
    required this.deliveryDate,
    this.deliveryAddress,
    this.notes,
    required this.status,
    this.client,
    this.clientId,
    required this.items,
    required this.totalAmount,
    required this.itemCount,
    required this.createdAt,
    required this.updatedAt,
  });

  factory DeliveryNote.fromJson(Map<String, dynamic> json) => _$DeliveryNoteFromJson(json);
  Map<String, dynamic> toJson() => _$DeliveryNoteToJson(this);

  String get displayNumber => '$year-${sequenceNumber.toString().padLeft(3, '0')}';
  
  String get statusDisplayName {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  static int _parseId(dynamic id) {
    if (id is int) return id;
    if (id is String) return int.parse(id);
    throw FormatException('Invalid id format: $id');
  }
}

@JsonSerializable()
class CreateDeliveryNoteRequest {
  final int? clientId;
  final DateTime? deliveryDate;
  final String? deliveryAddress;
  final String? notes;
  final String? status;
  final List<CreateDeliveryNoteItemRequest> items;

  CreateDeliveryNoteRequest({
    this.clientId,
    this.deliveryDate,
    this.deliveryAddress,
    this.notes,
    this.status,
    required this.items,
  });

  factory CreateDeliveryNoteRequest.fromJson(Map<String, dynamic> json) => _$CreateDeliveryNoteRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateDeliveryNoteRequestToJson(this);
}

@JsonSerializable()
class CreateDeliveryNoteItemRequest {
  final String productName;
  final String? description;
  final double quantity;
  final double? deliveredQuantity;
  final double unitPrice;
  final double? totalPrice;
  final String? productId;

  CreateDeliveryNoteItemRequest({
    required this.productName,
    this.description,
    required this.quantity,
    this.deliveredQuantity,
    required this.unitPrice,
    this.totalPrice,
    this.productId,
  });

  factory CreateDeliveryNoteItemRequest.fromJson(Map<String, dynamic> json) => _$CreateDeliveryNoteItemRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateDeliveryNoteItemRequestToJson(this);
} 
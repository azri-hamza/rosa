// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'delivery_note.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DeliveryNoteItem _$DeliveryNoteItemFromJson(Map<String, dynamic> json) =>
    DeliveryNoteItem(
      id: DeliveryNoteItem._parseId(json['id']),
      productName: DeliveryNoteItem._parseProductName(json['productName']),
      description: json['description'] as String?,
      quantity: (json['quantity'] as num).toDouble(),
      deliveredQuantity: (json['deliveredQuantity'] as num).toDouble(),
      unitPrice: (json['unitPrice'] as num).toDouble(),
      totalPrice: (json['totalPrice'] as num).toDouble(),
      productId: json['productId'] as String?,
    );

Map<String, dynamic> _$DeliveryNoteItemToJson(DeliveryNoteItem instance) =>
    <String, dynamic>{
      'id': instance.id,
      'productName': instance.productName,
      'description': instance.description,
      'quantity': instance.quantity,
      'deliveredQuantity': instance.deliveredQuantity,
      'unitPrice': instance.unitPrice,
      'totalPrice': instance.totalPrice,
      'productId': instance.productId,
    };

DeliveryNote _$DeliveryNoteFromJson(Map<String, dynamic> json) => DeliveryNote(
      id: DeliveryNote._parseId(json['id']),
      referenceId: json['referenceId'] as String,
      year: (json['year'] as num).toInt(),
      sequenceNumber: (json['sequenceNumber'] as num).toInt(),
      deliveryDate: DateTime.parse(json['deliveryDate'] as String),
      deliveryAddress: json['deliveryAddress'] as String?,
      notes: json['notes'] as String?,
      status: json['status'] as String,
      client: json['client'] == null
          ? null
          : Client.fromJson(json['client'] as Map<String, dynamic>),
      clientId: (json['clientId'] as num?)?.toInt(),
      items: (json['items'] as List<dynamic>)
          .map((e) => DeliveryNoteItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalAmount: (json['totalAmount'] as num).toDouble(),
      itemCount: (json['itemCount'] as num).toInt(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$DeliveryNoteToJson(DeliveryNote instance) =>
    <String, dynamic>{
      'id': instance.id,
      'referenceId': instance.referenceId,
      'year': instance.year,
      'sequenceNumber': instance.sequenceNumber,
      'deliveryDate': instance.deliveryDate.toIso8601String(),
      'deliveryAddress': instance.deliveryAddress,
      'notes': instance.notes,
      'status': instance.status,
      'client': instance.client,
      'clientId': instance.clientId,
      'items': instance.items,
      'totalAmount': instance.totalAmount,
      'itemCount': instance.itemCount,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

CreateDeliveryNoteRequest _$CreateDeliveryNoteRequestFromJson(
        Map<String, dynamic> json) =>
    CreateDeliveryNoteRequest(
      clientId: (json['clientId'] as num?)?.toInt(),
      deliveryDate: json['deliveryDate'] == null
          ? null
          : DateTime.parse(json['deliveryDate'] as String),
      deliveryAddress: json['deliveryAddress'] as String?,
      notes: json['notes'] as String?,
      status: json['status'] as String?,
      items: (json['items'] as List<dynamic>)
          .map((e) =>
              CreateDeliveryNoteItemRequest.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$CreateDeliveryNoteRequestToJson(
        CreateDeliveryNoteRequest instance) =>
    <String, dynamic>{
      'clientId': instance.clientId,
      'deliveryDate': instance.deliveryDate?.toIso8601String(),
      'deliveryAddress': instance.deliveryAddress,
      'notes': instance.notes,
      'status': instance.status,
      'items': instance.items,
    };

CreateDeliveryNoteItemRequest _$CreateDeliveryNoteItemRequestFromJson(
        Map<String, dynamic> json) =>
    CreateDeliveryNoteItemRequest(
      productName: json['productName'] as String,
      description: json['description'] as String?,
      quantity: (json['quantity'] as num).toDouble(),
      deliveredQuantity: (json['deliveredQuantity'] as num?)?.toDouble(),
      unitPrice: (json['unitPrice'] as num).toDouble(),
      totalPrice: (json['totalPrice'] as num?)?.toDouble(),
      productId: json['productId'] as String?,
    );

Map<String, dynamic> _$CreateDeliveryNoteItemRequestToJson(
        CreateDeliveryNoteItemRequest instance) =>
    <String, dynamic>{
      'productName': instance.productName,
      'description': instance.description,
      'quantity': instance.quantity,
      'deliveredQuantity': instance.deliveredQuantity,
      'unitPrice': instance.unitPrice,
      'totalPrice': instance.totalPrice,
      'productId': instance.productId,
    };

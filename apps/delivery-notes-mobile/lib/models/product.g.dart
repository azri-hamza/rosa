// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'product.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Product _$ProductFromJson(Map<String, dynamic> json) => Product(
      id: Product._parseId(json['id']),
      productId: json['productId'] as String,
      productCode: json['productCode'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      netPrice: (json['netPrice'] as num?)?.toDouble(),
      vatRate: (json['vatRate'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$ProductToJson(Product instance) => <String, dynamic>{
      'id': instance.id,
      'productId': instance.productId,
      'productCode': instance.productCode,
      'name': instance.name,
      'description': instance.description,
      'netPrice': instance.netPrice,
      'vatRate': instance.vatRate,
    };

import 'package:json_annotation/json_annotation.dart';

part 'product.g.dart';

@JsonSerializable()
class Product {
  @JsonKey(fromJson: _parseId)
  final int id;
  final String productId;
  final String productCode;
  final String name;
  final String description;
  final double? netPrice;
  final double? vatRate;

  const Product({
    required this.id,
    required this.productId,
    required this.productCode,
    required this.name,
    required this.description,
    this.netPrice,
    this.vatRate,
  });

  factory Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);
  Map<String, dynamic> toJson() => _$ProductToJson(this);

  static int _parseId(dynamic id) {
    if (id is int) return id;
    if (id is String) return int.parse(id);
    throw FormatException('Invalid id format: $id');
  }

  @override
  String toString() => name;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Product && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
} 
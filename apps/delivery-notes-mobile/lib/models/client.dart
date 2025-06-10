import 'package:json_annotation/json_annotation.dart';

part 'client.g.dart';

@JsonSerializable()
class Client {
  final int id;
  final String referenceId;
  final String name;
  final String? taxIdentificationNumber;
  final String? phoneNumber;
  final String? address;

  Client({
    required this.id,
    required this.referenceId,
    required this.name,
    this.taxIdentificationNumber,
    this.phoneNumber,
    this.address,
  });

  factory Client.fromJson(Map<String, dynamic> json) => _$ClientFromJson(json);
  Map<String, dynamic> toJson() => _$ClientToJson(this);
} 
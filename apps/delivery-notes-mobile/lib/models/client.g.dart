// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'client.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Client _$ClientFromJson(Map<String, dynamic> json) => Client(
      id: (json['id'] as num).toInt(),
      referenceId: json['referenceId'] as String,
      name: json['name'] as String,
      taxIdentificationNumber: json['taxIdentificationNumber'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
      address: json['address'] as String?,
    );

Map<String, dynamic> _$ClientToJson(Client instance) => <String, dynamic>{
      'id': instance.id,
      'referenceId': instance.referenceId,
      'name': instance.name,
      'taxIdentificationNumber': instance.taxIdentificationNumber,
      'phoneNumber': instance.phoneNumber,
      'address': instance.address,
    };

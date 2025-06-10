# VAT Management System

This document describes the VAT (Value-Added Tax) management system implemented in the Rosa application backend.

## Overview

The VAT management system provides comprehensive functionality for managing VAT rates, including:

- Multiple VAT rates with different percentages
- Country-specific VAT rates
- Time-based effective periods for VAT rates
- Default VAT rate management
- VAT calculation utilities
- Full CRUD operations via REST API

## Architecture

### Entity Structure

**VatRate Entity** (`libs/shared/api-core/src/lib/entities/vat.entity.ts`)
- `id`: Unique identifier (bigint, auto-increment)
- `name`: Unique name for the VAT rate (varchar, 100 chars)
- `rate`: VAT rate as decimal (0.2000 for 20%)
- `percentage`: VAT rate as percentage (20.00 for 20%)
- `description`: Optional description
- `isActive`: Whether the rate is currently active
- `isDefault`: Whether this is the default rate
- `countryCode`: Optional country code (e.g., 'FR', 'EU')
- `effectiveFrom`: Optional start date for the rate
- `effectiveTo`: Optional end date for the rate
- Inherits audit fields: `createdAt`, `updatedAt`, `deletedAt`

### Repository Layer

**VatRateRepository** (`libs/shared/api-core/src/lib/repositories/vat-rate.repository.ts`)

Key methods:
- `findActiveRates()`: Get all active VAT rates
- `findDefaultRate()`: Get the current default VAT rate
- `findByCountryCode(countryCode)`: Get rates for a specific country
- `findEffectiveRate(countryCode?, date?)`: Get the effective rate for a country/date
- `findWithFilters(filters)`: Advanced filtering
- `setDefaultRate(id)`: Set a rate as default (removes default from others)
- `validateRateUniqueness(name, excludeId?)`: Check name uniqueness

### Service Layer

**VatRateService** (`libs/shared/api-core/src/lib/services/vat-rate.service.ts`)

Business logic including:
- CRUD operations with validation
- Default rate management
- Date range validation
- Name uniqueness validation
- VAT calculation utilities

### Controller Layer

**VatRateController** (`libs/shared/api-core/src/lib/controllers/vat-rate.controller.ts`)

REST API endpoints:
- `POST /vat-rates` - Create new VAT rate
- `GET /vat-rates` - List all VAT rates (with filtering)
- `GET /vat-rates/active` - Get active VAT rates
- `GET /vat-rates/default` - Get default VAT rate
- `GET /vat-rates/effective` - Get effective rate for country/date
- `GET /vat-rates/:id` - Get specific VAT rate
- `PATCH /vat-rates/:id` - Update VAT rate
- `PATCH /vat-rates/:id/set-default` - Set as default rate
- `DELETE /vat-rates/:id` - Delete VAT rate (soft delete)

### Calculation Utilities

The service provides utility methods for VAT calculations:
- `calculateVatAmount(netAmount, vatRate)`: Calculate VAT amount from net
- `calculateGrossAmount(netAmount, vatRate)`: Calculate gross amount from net
- `calculateNetFromGross(grossAmount, vatRate)`: Calculate net from gross

## API Usage Examples

### Create a VAT Rate

```bash
POST /vat-rates
Content-Type: application/json

{
  "name": "Standard Rate - UK",
  "rate": 0.20,
  "description": "Standard VAT rate for United Kingdom",
  "countryCode": "UK",
  "isActive": true,
  "isDefault": false
}
```

### Get Active VAT Rates

```bash
GET /vat-rates/active
```

### Get Effective VAT Rate

```bash
GET /vat-rates/effective?countryCode=FR&date=2024-01-15
```

### Calculate VAT Amount

```bash
POST /vat-rates/calculate/vat-amount
Content-Type: application/json

{
  "netAmount": 100.00,
  "vatRate": 0.20
}

Response: { "vatAmount": 20.00 }
```

### Filter VAT Rates

```bash
GET /vat-rates?isActive=true&countryCode=FR&minRate=0.1&maxRate=0.25
```

## Database Schema

The migration creates the `vat_rates` table with:
- Primary key on `id`
- Unique constraint on `name`
- Indexes on commonly queried fields (`rate`, `is_active`, `is_default`, `country_code`)
- Composite index on effective date range
- Audit trail columns

### Default Data

The migration includes default VAT rates:
- Standard Rate - France (20%, default)
- Reduced Rate - France (10%)
- Super Reduced Rate - France (5.5%)
- Zero Rate (0%)
- EU Standard Rate (20%)

## Validation Rules

### Create/Update Validation
- `name`: Required, 1-100 characters, must be unique
- `rate`: Required, positive number, max 1 (100%), up to 4 decimal places
- `description`: Optional, max 500 characters
- `countryCode`: Optional, 2-10 uppercase letters
- `effectiveFrom`/`effectiveTo`: Optional ISO date strings
- Date range validation: `effectiveFrom` must be before `effectiveTo`

### Business Rules
- Cannot delete the default VAT rate
- Cannot set inactive rate as default
- Only one rate can be default at a time
- Name must be unique across all rates

## Module Integration

The VAT system is integrated into the main application via:

1. **VatModule** (`api/src/app/vat/vat.module.ts`) - NestJS module configuration
2. **AppModule** - Imports VatModule and includes VatRate entity in TypeORM
3. **api-core exports** - All VAT components exported from shared library

## Testing

Basic unit tests are provided for:
- Service instantiation
- VAT calculation utilities
- Core business logic validation

Run tests with:
```bash
pnpm nx test api --testPathPattern=vat
```

## Future Enhancements

Potential improvements:
- VAT rate history tracking
- Bulk import/export functionality
- Integration with external VAT rate services
- Advanced reporting and analytics
- Multi-currency support
- VAT exemption management
- Integration with invoicing system

## Security Considerations

- All endpoints should be protected with appropriate authentication/authorization
- Input validation prevents SQL injection and data corruption
- Soft delete preserves audit trail
- Rate changes are logged through audit fields

## Performance Notes

- Indexes optimize common queries (active rates, country lookups, date ranges)
- Repository pattern enables efficient database access
- Caching can be added for frequently accessed default rates
- Pagination should be implemented for large datasets 
# API Versioning Strategy - Rosa Backend

## Overview

This document outlines the API versioning strategy implemented for the Rosa backend application using **NestJS built-in versioning**. The strategy ensures backward compatibility, smooth migration paths, and clear deprecation policies.

## Versioning Approach

### **NestJS Built-in URI Versioning**

We implement NestJS's built-in versioning system using URI path versioning:

- **URL Path Versioning**: `/api/v1/products`
- **Default Version**: `v1` (configured globally)
- **Version Type**: `VersioningType.URI`

### **Version Configuration**

The versioning is configured globally in `main.ts`:

```typescript
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});
```

## Implementation Details

### **Directory Structure**

```
api/src/
├── app/
│   ├── v1/                       # Version 1 API
│   │   ├── product/
│   │   │   └── product-v1.controller.ts
│   │   ├── client/
│   │   │   └── client-v1.controller.ts
│   │   ├── sales/
│   │   │   └── sales-v1.controller.ts
│   │   ├── user/
│   │   │   └── user-v1.controller.ts
│   │   ├── vat/
│   │   │   └── vat-v1.controller.ts
│   │   └── v1.module.ts
│   └── [original modules]        # Legacy/unversioned endpoints
```

### **Controller Implementation**

Controllers use NestJS's built-in versioning decorator:

```typescript
@Controller({ path: 'products', version: '1' })
@UseGuards(JwtAuthGuard)
export class ProductV1Controller {
  // Implementation
}
```

### **Response Format**

All v1 endpoints return a standardized response format:

```json
{
  "data": { /* actual response data */ },
  "pagination": { /* pagination info for lists */ },
  "meta": {
    "version": "1.0",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## API Endpoints

### **Version 1 Endpoints**

| Resource | Endpoint | Description |
|----------|----------|-------------|
| **Products** | `GET /api/v1/products` | List products with v1 format |
| | `GET /api/v1/products/:id` | Get product by ID |
| | `POST /api/v1/products` | Create new product |
| | `PUT /api/v1/products/:id` | Update product |
| | `DELETE /api/v1/products/:id` | Delete product |
| **Clients** | `GET /api/v1/clients` | List clients with v1 format |
| | `GET /api/v1/clients/:id` | Get client by ID |
| | `POST /api/v1/clients` | Create new client |
| **Sales** | `GET /api/v1/sales/quotes` | List quotes |
| | `GET /api/v1/sales/delivery-notes` | List delivery notes |
| | `POST /api/v1/sales/delivery-notes` | Create delivery note |
| | `GET /api/v1/sales/delivery-notes/:id/pdf` | Download PDF |
| **Users** | `GET /api/v1/users` | List users |
| | `GET /api/v1/users/:id` | Get user by ID |
| | `POST /api/v1/users` | Create user |
| **VAT** | `GET /api/v1/vat-rates` | List VAT rates |
| | `POST /api/v1/vat-rates` | Create VAT rate |
| | `GET /api/v1/vat-rates/calculate/*` | VAT calculations |

### **Legacy Endpoints (Unversioned)**

Original endpoints remain available for backward compatibility:
- `/api/products`
- `/api/clients`
- `/api/sales/*`
- `/api/users`
- `/api/vat-rates`

## Usage Examples

### **URI Path Versioning**

```bash
# Get all products (v1)
curl -H "Authorization: Bearer <token>" \
     "https://api.rosa.com/api/v1/products"

# Get specific product (v1)
curl -H "Authorization: Bearer <token>" \
     "https://api.rosa.com/api/v1/products/123"

# Create new product (v1)
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name":"New Product","price":99.99}' \
     "https://api.rosa.com/api/v1/products"
```

### **Default Version Access**

Since `v1` is configured as the default version, you can also access endpoints without the version prefix:

```bash
# These are equivalent when v1 is the default
curl "https://api.rosa.com/api/v1/products"
curl "https://api.rosa.com/api/products"  # Uses default version
```

## Response Headers

### **Version Information**

NestJS automatically adds version headers to responses:

```http
X-API-Version: 1
```

## Migration Strategy

### **Phase 1: Implementation (Current)**

✅ **Completed:**
- NestJS built-in versioning infrastructure
- V1 API endpoints with standardized response format
- Backward compatibility with legacy endpoints
- URI path versioning implementation

### **Phase 2: Client Migration**

🔄 **In Progress:**
- Update frontend applications to use v1 endpoints
- Update mobile applications to use v1 endpoints
- Monitor usage analytics

### **Phase 3: Deprecation**

📅 **Future:**
- Mark legacy endpoints as deprecated
- Add deprecation warnings to responses
- Provide migration guides

### **Phase 4: Removal**

📅 **Future (v2.0):**
- Remove legacy unversioned endpoints
- Clean up legacy code

## Best Practices

### **1. Version-Specific Controllers**

- Each version has its own controllers
- Shared business logic through services
- Version-specific response formatting

### **2. Backward Compatibility**

- Never break existing API contracts
- Additive changes only in minor versions
- Breaking changes require new major version

### **3. Response Format Consistency**

```typescript
// Standard v1 response format
{
  data: T,
  pagination?: PaginationInfo,
  meta: {
    version: string,
    timestamp: string
  }
}
```

### **4. Error Handling**

```typescript
// Version-specific error responses
{
  error: {
    code: string,
    message: string,
    details?: any
  },
  meta: {
    version: string,
    timestamp: string
  }
}
```

## Testing Strategy

### **1. Version Validation Tests**

```typescript
describe('API Versioning', () => {
  it('should accept v1 endpoints', () => {
    // Test /api/v1/products
  });
  
  it('should use default version when not specified', () => {
    // Test /api/products (should use v1)
  });
  
  it('should reject unsupported versions', () => {
    // Test /api/v2/products (should fail)
  });
});
```

### **2. Response Format Tests**

```typescript
describe('V1 Response Format', () => {
  it('should return standardized response format', () => {
    // Test response structure
  });
  
  it('should include version metadata', () => {
    // Test meta.version field
  });
});
```

## Monitoring & Analytics

### **1. Version Usage Tracking**

- Log API version usage per endpoint
- Track client adoption rates
- Monitor deprecated endpoint usage

### **2. Performance Monitoring**

- Version-specific performance metrics
- Response time comparison between versions
- Error rate tracking per version

## Future Considerations

### **1. Multiple Version Support**

To add support for additional versions (e.g., v2):

```typescript
// In main.ts
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});

// Create v2 controllers
@Controller({ path: 'products', version: '2' })
export class ProductV2Controller {
  // V2 implementation
}
```

### **2. API Gateway Integration**

- Route requests based on version
- Centralized version management
- Rate limiting per version

### **3. Documentation Versioning**

- Version-specific API documentation
- Interactive API explorer per version
- Migration guides between versions

### **4. SDK Generation**

- Version-specific client SDKs
- Automated SDK generation from OpenAPI specs
- Version compatibility matrices

## Troubleshooting

### **Common Issues**

1. **Version Not Recognized**
   - Ensure URL follows pattern: `/api/v1/resource`
   - Check controller decorator: `@Controller({ path: 'resource', version: '1' })`

2. **Unsupported Version Error**
   - Update to supported version
   - Check available versions in error message

3. **Missing Version Headers**
   - Ensure NestJS versioning is enabled in main.ts
   - Check controller version decorators

### **Debug Configuration**

Add logging to see version resolution:

```typescript
// In main.ts
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});

// Add request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});
```

## Migration from Custom Versioning

### **What Changed**

1. **Removed Custom Components:**
   - Custom version decorators (`@ApiVersion`)
   - Custom version interceptor
   - Custom version module

2. **Adopted NestJS Built-in:**
   - `app.enableVersioning()` in main.ts
   - `@Controller({ version: '1' })` decorators
   - Automatic version header handling

3. **Simplified Implementation:**
   - No custom version extraction logic
   - No custom deprecation handling
   - Leverages NestJS's battle-tested versioning

### **Benefits of NestJS Built-in Versioning**

- **Standardized**: Uses NestJS's official versioning system
- **Maintained**: Backed by the NestJS team
- **Simplified**: Less custom code to maintain
- **Flexible**: Easy to add new versions
- **Documented**: Well-documented in NestJS official docs

## Contact & Support

For questions about API versioning:
- **Technical Lead**: [Contact Information]
- **Documentation**: [Internal Wiki Link]
- **Issue Tracking**: [JIRA/GitHub Link]

---

**Last Updated**: January 2024  
**Version**: 2.0  
**Status**: Active - Using NestJS Built-in Versioning 
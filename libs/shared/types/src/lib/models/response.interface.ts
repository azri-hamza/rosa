export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ResponseMeta {
  timestamp: string;
  version: string;
  requestId?: string;
  path?: string;
}

export interface ErrorDetail {
  field?: string;
  code: string;
  message: string;
}

/**
 * Standard API Response wrapper
 * @template T The type of data being returned
 * @template M Additional metadata type (extends object)
 */
export interface ApiResponse<T, M extends object = Record<string, never>> {
  // Main response data
  data: T;
  
  
  // Optional message for user feedback
  message?: string;
  
  // Standard metadata
  meta: ResponseMeta & M;
  
  // Pagination data (only for paginated responses)
  pagination?: PaginationMeta;
  
  // Detailed error information (only when success is false)
  errors?: ErrorDetail[];
}

/**
 * Type guard to check if a response contains pagination metadata
 */
export function isPaginatedResponse<T, M extends object>(
  response: ApiResponse<T, M>
): response is ApiResponse<T, M> & { pagination: PaginationMeta } {
  return response.pagination !== undefined;
}
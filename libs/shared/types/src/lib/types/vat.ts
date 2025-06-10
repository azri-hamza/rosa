export interface CreateVatRateRequest {
  name: string;
  rate: number;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
  countryCode?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface UpdateVatRateRequest {
  name?: string;
  rate?: number;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
  countryCode?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface VatRateResponse {
  id: number;
  name: string;
  rate: number;
  percentage: number;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  countryCode?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VatRateFilter {
  name?: string;
  isActive?: boolean;
  isDefault?: boolean;
  countryCode?: string;
  minRate?: number;
  maxRate?: number;
} 
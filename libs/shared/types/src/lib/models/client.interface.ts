export interface Client {
  id: number;
  referenceId: string;
  name: string;
  taxIdentificationNumber?: string;
  phoneNumber?: string;
  address: string;
}

export interface CreateClientRequest {
  referenceId?: string;
  name: string;
  taxIdentificationNumber?: string;
  phoneNumber?: string;
  address: string;
}

export interface UpdateClientRequest {
  name?: string;
  taxIdentificationNumber?: string;
  phoneNumber?: string;
  address?: string;
} 
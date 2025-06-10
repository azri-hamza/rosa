import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { VatRateRepository, VAT_RATE_REPOSITORY, VatRate} from '@rosa/api-core';
import { 
  CreateVatRateDto, 
  UpdateVatRateDto, 
  VatRateResponseDto, 
  VatRateFilterDto 
} from '@rosa/api-core';

@Injectable()
export class VatRateService {
  constructor(@Inject(VAT_RATE_REPOSITORY) private vatRateRepository: VatRateRepository) {}

  async create(createVatRateDto: CreateVatRateDto): Promise<VatRateResponseDto> {
    try {
      // Validate name uniqueness
      const isUnique = await this.vatRateRepository.validateRateUniqueness(createVatRateDto.name);
      if (!isUnique) {
        throw new ConflictException(`VAT rate with name '${createVatRateDto.name}' already exists`);
      }

      // Calculate percentage from rate
      const percentage = createVatRateDto.rate * 100;

      // Validate date range
      if (createVatRateDto.effectiveFrom && createVatRateDto.effectiveTo) {
        const effectiveFrom = new Date(createVatRateDto.effectiveFrom);
        const effectiveTo = new Date(createVatRateDto.effectiveTo);
        
        if (effectiveFrom >= effectiveTo) {
          throw new BadRequestException('Effective from date must be before effective to date');
        }
      }

      const vatRateData = {
        ...createVatRateDto,
        percentage,
        effectiveFrom: createVatRateDto.effectiveFrom ? new Date(createVatRateDto.effectiveFrom) : undefined,
        effectiveTo: createVatRateDto.effectiveTo ? new Date(createVatRateDto.effectiveTo) : undefined,
        isActive: createVatRateDto.isActive ?? true,
        isDefault: createVatRateDto.isDefault ?? false
      };

      const savedVatRate = await this.vatRateRepository.createEntity(vatRateData);

      // If this is set as default, update other rates
      if (savedVatRate.isDefault) {
        await this.vatRateRepository.setDefaultRate(savedVatRate.id);
      }

      return this.mapToResponseDto(savedVatRate);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create VAT rate');
    }
  }

  async findAll(filters?: VatRateFilterDto): Promise<VatRateResponseDto[]> {
    try {
      const vatRates = filters && Object.keys(filters).length > 0
        ? await this.vatRateRepository.findWithFilters(filters)
        : await this.vatRateRepository.find({ order: { rate: 'ASC' } });

      return vatRates.map(vatRate => this.mapToResponseDto(vatRate));
    } catch (error) {
      throw new BadRequestException('Failed to retrieve VAT rates');
    }
  }

  async findActiveRates(): Promise<VatRateResponseDto[]> {
    try {
      const vatRates = await this.vatRateRepository.findActiveRates();
      return vatRates.map(vatRate => this.mapToResponseDto(vatRate));
    } catch (error) {
      throw new BadRequestException('Failed to retrieve active VAT rates');
    }
  }

  async findOne(id: number): Promise<VatRateResponseDto> {
    try {
      const vatRate = await this.vatRateRepository.findOne({ where: { id } });
      
      if (!vatRate) {
        throw new NotFoundException(`VAT rate with ID ${id} not found`);
      }

      return this.mapToResponseDto(vatRate);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve VAT rate');
    }
  }

  async findEntityById(id: number): Promise<VatRate> {
    try {
      const vatRate = await this.vatRateRepository.findOne({ where: { id } });
      
      if (!vatRate) {
        throw new NotFoundException(`VAT rate with ID ${id} not found`);
      }

      return vatRate;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve VAT rate');
    }
  }

  async findDefaultRate(): Promise<VatRateResponseDto | null> {
    try {
      const vatRate = await this.vatRateRepository.findDefaultRate();
      return vatRate ? this.mapToResponseDto(vatRate) : null;
    } catch (error) {
      throw new BadRequestException('Failed to retrieve default VAT rate');
    }
  }

  async findEffectiveRate(countryCode?: string, date?: Date): Promise<VatRateResponseDto | null> {
    try {
      const vatRate = await this.vatRateRepository.findEffectiveRate(countryCode, date);
      return vatRate ? this.mapToResponseDto(vatRate) : null;
    } catch (error) {
      throw new BadRequestException('Failed to retrieve effective VAT rate');
    }
  }

  async update(id: number, updateVatRateDto: UpdateVatRateDto): Promise<VatRateResponseDto> {
    try {
      const existingVatRate = await this.vatRateRepository.findOne({ where: { id } });
      
      if (!existingVatRate) {
        throw new NotFoundException(`VAT rate with ID ${id} not found`);
      }

      // Validate name uniqueness if name is being updated
      if (updateVatRateDto.name && updateVatRateDto.name !== existingVatRate.name) {
        const isUnique = await this.vatRateRepository.validateRateUniqueness(updateVatRateDto.name, id);
        if (!isUnique) {
          throw new ConflictException(`VAT rate with name '${updateVatRateDto.name}' already exists`);
        }
      }

      // Calculate percentage if rate is being updated
      const percentage = updateVatRateDto.rate ? updateVatRateDto.rate * 100 : undefined;

      // Validate date range if dates are being updated
      const effectiveFrom = updateVatRateDto.effectiveFrom 
        ? new Date(updateVatRateDto.effectiveFrom)
        : existingVatRate.effectiveFrom;
      const effectiveTo = updateVatRateDto.effectiveTo 
        ? new Date(updateVatRateDto.effectiveTo)
        : existingVatRate.effectiveTo;

      if (effectiveFrom && effectiveTo && effectiveFrom >= effectiveTo) {
        throw new BadRequestException('Effective from date must be before effective to date');
      }

      const updateData = {
        ...updateVatRateDto,
        ...(percentage !== undefined && { percentage }),
        ...(updateVatRateDto.effectiveFrom && { effectiveFrom: new Date(updateVatRateDto.effectiveFrom) }),
        ...(updateVatRateDto.effectiveTo && { effectiveTo: new Date(updateVatRateDto.effectiveTo) })
      };

      await this.vatRateRepository.update(id, updateData);

      // If setting as default, update other rates
      if (updateVatRateDto.isDefault === true) {
        await this.vatRateRepository.setDefaultRate(id);
      }

      const updatedVatRate = await this.vatRateRepository.findOne({ where: { id } });
      return this.mapToResponseDto(updatedVatRate!);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update VAT rate');
    }
  }

  async setAsDefault(id: number): Promise<VatRateResponseDto> {
    try {
      const vatRate = await this.vatRateRepository.findOne({ where: { id } });
      
      if (!vatRate) {
        throw new NotFoundException(`VAT rate with ID ${id} not found`);
      }

      if (!vatRate.isActive) {
        throw new BadRequestException('Cannot set inactive VAT rate as default');
      }

      await this.vatRateRepository.setDefaultRate(id);

      const updatedVatRate = await this.vatRateRepository.findOne({ where: { id } });
      return this.mapToResponseDto(updatedVatRate!);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to set VAT rate as default');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const vatRate = await this.vatRateRepository.findOne({ where: { id } });
      
      if (!vatRate) {
        throw new NotFoundException(`VAT rate with ID ${id} not found`);
      }

      if (vatRate.isDefault) {
        throw new BadRequestException('Cannot delete the default VAT rate. Please set another rate as default first.');
      }

      await this.vatRateRepository.softDelete(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete VAT rate');
    }
  }

  // Utility methods for VAT calculations
  calculateVatAmount(netAmount: number, vatRate: number): number {
    return Math.round(netAmount * vatRate * 1000) / 1000;
  }

  calculateGrossAmount(netAmount: number, vatRate: number): number {
    return Math.round((netAmount * (1 + vatRate)) * 1000) / 1000;
  }

  calculateNetFromGross(grossAmount: number, vatRate: number): number {
    return Math.round((grossAmount / (1 + vatRate)) * 1000) / 1000;
  }

  private mapToResponseDto(vatRate: VatRate): VatRateResponseDto {
    return {
      id: vatRate.id,
      name: vatRate.name,
      rate: vatRate.rate,
      percentage: vatRate.percentage,
      description: vatRate.description,
      isActive: vatRate.isActive,
      isDefault: vatRate.isDefault,
      countryCode: vatRate.countryCode,
      effectiveFrom: vatRate.effectiveFrom,
      effectiveTo: vatRate.effectiveTo,
      createdAt: vatRate.createdAt,
      updatedAt: vatRate.updatedAt
    };
  }
} 
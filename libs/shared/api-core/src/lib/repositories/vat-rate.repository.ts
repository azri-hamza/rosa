import { DataSource, Repository } from 'typeorm';
import { VatRate } from '../entities/vat.entity';
import { VatRateFilterDto } from '../dto/vat.dto';

export class VatRateRepository extends Repository<VatRate> {
  constructor(dataSource: DataSource) {
    super(VatRate, dataSource.createEntityManager());
  }

  async createEntity(entityData: Partial<VatRate>): Promise<VatRate> {
    const entity = this.create(entityData);
    return this.save(entity);
  }

  async findActiveRates(): Promise<VatRate[]> {
    return this.find({
      where: { isActive: true },
      order: { rate: 'ASC' }
    });
  }

  async findDefaultRate(): Promise<VatRate | null> {
    return this.findOne({
      where: { isDefault: true, isActive: true }
    });
  }

  async findByCountryCode(countryCode: string): Promise<VatRate[]> {
    return this.find({
      where: { countryCode, isActive: true },
      order: { effectiveFrom: 'DESC' }
    });
  }

  async findEffectiveRate(countryCode?: string, date: Date = new Date()): Promise<VatRate | null> {
    const query = this.createQueryBuilder('vat')
      .where('vat.isActive = :isActive', { isActive: true })
      .andWhere('(vat.effectiveFrom IS NULL OR vat.effectiveFrom <= :date)', { date })
      .andWhere('(vat.effectiveTo IS NULL OR vat.effectiveTo >= :date)', { date });

    if (countryCode) {
      query.andWhere('vat.countryCode = :countryCode', { countryCode });
    } else {
      query.andWhere('vat.countryCode IS NULL');
    }

    return query
      .orderBy('vat.effectiveFrom', 'DESC')
      .getOne();
  }

  async findWithFilters(filters: VatRateFilterDto): Promise<VatRate[]> {
    const query = this.createQueryBuilder('vat');

    if (filters.name) {
      query.andWhere('vat.name ILIKE :name', { name: `%${filters.name}%` });
    }

    if (filters.isActive !== undefined) {
      query.andWhere('vat.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters.isDefault !== undefined) {
      query.andWhere('vat.isDefault = :isDefault', { isDefault: filters.isDefault });
    }

    if (filters.countryCode) {
      query.andWhere('vat.countryCode = :countryCode', { countryCode: filters.countryCode });
    }

    if (filters.minRate !== undefined) {
      query.andWhere('vat.rate >= :minRate', { minRate: filters.minRate });
    }

    if (filters.maxRate !== undefined) {
      query.andWhere('vat.rate <= :maxRate', { maxRate: filters.maxRate });
    }

    return query
      .orderBy('vat.rate', 'ASC')
      .getMany();
  }

  async setDefaultRate(id: number): Promise<void> {
    // First, remove default flag from all rates
    await this.update({ isDefault: true }, { isDefault: false });
    
    // Then set the new default
    await this.update(id, { isDefault: true });
  }

  async validateRateUniqueness(name: string, excludeId?: number): Promise<boolean> {
    const query = this.createQueryBuilder('vat')
      .where('vat.name = :name', { name });

    if (excludeId) {
      query.andWhere('vat.id != :excludeId', { excludeId });
    }

    const existingRate = await query.getOne();
    return !existingRate;
  }
}

// Factory function for dependency injection
export const createVatRateRepository = (dataSource: DataSource) => {
  return new VatRateRepository(dataSource);
}; 
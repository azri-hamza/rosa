import { Test, TestingModule } from '@nestjs/testing';
import { VAT_RATE_REPOSITORY } from '@rosa/api-core';
import { VatRateService } from './vat-rate.service';
import { DataSource } from 'typeorm';

describe('VatRateService', () => {
  let service: VatRateService;

  const mockRepository = {
    validateRateUniqueness: jest.fn(),
    createEntity: jest.fn(),
    save: jest.fn(),
    setDefaultRate: jest.fn(),
    findWithFilters: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findActiveRates: jest.fn(),
    findDefaultRate: jest.fn(),
    findEffectiveRate: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const mockDataSource = {
      createEntityManager: jest.fn().mockReturnValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VatRateService,
        {
          provide: VAT_RATE_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<VatRateService>(VatRateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('VAT calculation utilities', () => {
    it('should calculate VAT amount correctly', () => {
      const netAmount = 100;
      const vatRate = 0.2;

      const result = service.calculateVatAmount(netAmount, vatRate);

      expect(result).toBe(20);
    });

    it('should calculate gross amount correctly', () => {
      const netAmount = 100;
      const vatRate = 0.2;

      const result = service.calculateGrossAmount(netAmount, vatRate);

      expect(result).toBe(120);
    });

    it('should calculate net from gross correctly', () => {
      const grossAmount = 120;
      const vatRate = 0.2;

      const result = service.calculateNetFromGross(grossAmount, vatRate);

      expect(result).toBe(100);
    });
  });
}); 
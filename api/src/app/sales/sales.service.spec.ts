import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { QUOTE_REPOSITORY } from '@rosa/api-core';

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: QUOTE_REPOSITORY,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SalesV1Controller } from '../v1/sales/sales-v1.controller';
import { SalesService } from './sales.service';
import { 
  QUOTE_REPOSITORY, 
  DELIVERY_NOTE_REPOSITORY, 
  PRODUCT_REPOSITORY, 
  DELIVERY_NOTE_ITEM_REPOSITORY 
} from '@rosa/api-core';
import { DataSource } from 'typeorm';
import { ProductService } from '../product/product.service';
import { ClientService } from '../client/client.service';
import { PdfService } from './pdf.service';

describe('SalesV1Controller', () => {
  let controller: SalesV1Controller;

  const mockQuoteRepository = {
    findAll: jest.fn().mockResolvedValue([]),
    findByReferenceId: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockDeliveryNoteRepository = {
    findAll: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn().mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockProductRepository = {
    findAll: jest.fn().mockResolvedValue([]),
  };

  const mockDeliveryNoteItemRepository = {
    findAll: jest.fn().mockResolvedValue([]),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((callback) => callback({
      save: jest.fn(),
      delete: jest.fn(),
    })),
    createEntityManager: jest.fn().mockReturnValue({}),
  };

  const mockProductService = {
    findProductById: jest.fn(),
  };

  const mockClientService = {
    findOne: jest.fn(),
  };

  const mockPdfService = {
    generateDeliveryNotePDF: jest.fn().mockResolvedValue(Buffer.from('test')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesV1Controller],
      providers: [
        SalesService,
        {
          provide: QUOTE_REPOSITORY,
          useValue: mockQuoteRepository,
        },
        {
          provide: DELIVERY_NOTE_REPOSITORY,
          useValue: mockDeliveryNoteRepository,
        },
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
        {
          provide: DELIVERY_NOTE_ITEM_REPOSITORY,
          useValue: mockDeliveryNoteItemRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ProductService,
          useValue: mockProductService,
        },
        {
          provide: ClientService,
          useValue: mockClientService,
        },
        {
          provide: PdfService,
          useValue: mockPdfService,
        },
      ],
    }).compile();

    controller = module.get<SalesV1Controller>(SalesV1Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
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

describe('SalesService', () => {
  let service: SalesService;

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
    create: jest.fn(),
    save: jest.fn(),
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
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((callback) => callback({
      save: jest.fn(),
      delete: jest.fn(),
    })),
    createEntityManager: jest.fn().mockReturnValue({}),
    getRepository: jest.fn(),
  };

  const mockProductService = {
    findProductById: jest.fn(),
  };

  const mockClientService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('VAT rate conversion', () => {
    it('should convert VAT rate from percentage to decimal when creating delivery note items', async () => {
      // Mock the necessary dependencies
      const mockUser = { id: 'user-1' };
      const mockDeliveryNote = { id: 1, referenceId: 'test-ref' };
      
      mockDataSource.getRepository = jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(mockUser),
      });
      
      mockDeliveryNoteRepository.create = jest.fn().mockReturnValue(mockDeliveryNote);
      mockDeliveryNoteRepository.save = jest.fn().mockResolvedValue(mockDeliveryNote);
      
      const mockDeliveryNoteItem = {
        id: 1,
        vatRate: 0.13, // Should be stored as decimal (13% -> 0.13)
      };
      
      mockDeliveryNoteItemRepository.create = jest.fn().mockReturnValue(mockDeliveryNoteItem);
      mockDeliveryNoteItemRepository.save = jest.fn().mockResolvedValue([mockDeliveryNoteItem]);

      const createDto = {
        items: [{
          productName: 'Test Product',
          quantity: 1,
          unitPrice: 100,
          vatRate: 13, // Input as percentage
        }]
      };

      await service.createDeliveryNote(createDto, 'user-1');

      // Verify that the VAT rate was converted from percentage (13) to decimal (0.13)
      expect(mockDeliveryNoteItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vatRate: 0.13, // Should be converted to decimal
        })
      );
    });
  });
});

import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { 
  Quote, 
  QUOTE_REPOSITORY, 
  QuoteRepository, 
  QuoteItem, 
  QuoteFilterDto,
  DeliveryNote,
  DELIVERY_NOTE_REPOSITORY,
  DeliveryNoteRepository,
  DeliveryNoteItem,
  DeliveryNoteFilterDto
} from '@rosa/api-core';
import { DataSource } from 'typeorm';
import { ProductService } from '../product/product.service';
import { ClientService } from '../client/client.service';


// Interface for the incoming DTO
interface CreateQuoteItemDto {
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  productId?: string;
}

interface CreateQuoteDto {
  year?: number;
  clientId?: number;
  userDate?: Date | null;
  items?: CreateQuoteItemDto[];
}

// Interface for delivery note DTOs
interface CreateDeliveryNoteItemDto {
  productName: string;
  description?: string;
  quantity: number;
  deliveredQuantity?: number;
  unitPrice: number;
  totalPrice?: number;
  productId?: string;
}

interface CreateDeliveryNoteDto {
  year?: number;
  clientId?: number;
  deliveryDate?: Date;
  deliveryAddress?: string;
  notes?: string;
  status?: 'pending' | 'delivered' | 'cancelled';
  items?: CreateDeliveryNoteItemDto[];
}

@Injectable()
export class SalesService {
  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepository: QuoteRepository,
    @Inject(DELIVERY_NOTE_REPOSITORY) private readonly deliveryNoteRepository: DeliveryNoteRepository,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(ProductService) private readonly productService: ProductService,
    @Inject(ClientService) private readonly clientService: ClientService
  ) {}

  private async getNextSequenceNumber(year: number | null): Promise<number> {
    if (!year) {
      return 1;
    }

    const quotes = await this.quoteRepository
      .createQueryBuilder('quote')
      .where('quote.year = :year', { year })
      .orderBy('quote.sequenceNumber', 'DESC')
      .getMany();

    return quotes.length > 0 ? quotes[0].sequenceNumber + 1 : 1;
  }

  async getQuoteById(quoteUuid: string): Promise<Quote> {
    try {
      const quote = await this.quoteRepository.findByReferenceId(quoteUuid);
      if (!quote) {
        throw new NotFoundException(`Quote with reference ID ${quoteUuid} not found`);
      }
      return quote;
    } catch (error) {
      console.error('Error in getQuoteById:', error);
      throw error;
    }
  }

  async getAllQuotes(filterDto?: QuoteFilterDto): Promise<Quote[]> {
    try {
      const queryBuilder = this.quoteRepository
        .createQueryBuilder('quote')
        .leftJoinAndSelect('quote.items', 'items')
        .leftJoinAndSelect('items.product', 'product')
        .leftJoinAndSelect('quote.client', 'client');

      // Apply client filter if provided
      if (filterDto?.clientId) {
        queryBuilder.andWhere('quote.client.id = :clientId', { clientId: filterDto.clientId });
      }

      // Apply date range filter if provided
      if (filterDto?.startDate && filterDto?.endDate) {
        queryBuilder.andWhere('quote.createdAt >= :startDate AND quote.createdAt <= :endDate', {
          startDate: filterDto.startDate,
          endDate: filterDto.endDate,
        });
      } else if (filterDto?.startDate) {
        queryBuilder.andWhere('quote.createdAt >= :startDate', { startDate: filterDto.startDate });
      } else if (filterDto?.endDate) {
        queryBuilder.andWhere('quote.createdAt <= :endDate', { endDate: filterDto.endDate });
      }

      const quotes = await queryBuilder
        .orderBy('quote.createdAt', 'DESC')
        .getMany();

      return quotes || [];
    } catch (error) {
      console.error('Error in getAllQuotes:', error);
      throw error;
    }
  }

  async updateQuote(quoteUuid: string, updateQuoteDto: CreateQuoteDto): Promise<Quote> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      try {
        // Find the existing quote
        const existingQuote = await this.quoteRepository.findByReferenceId(quoteUuid);
        if (!existingQuote) {
          throw new NotFoundException(`Quote with reference ID ${quoteUuid} not found`);
        }

        // Handle client assignment
        let client = null;
        if (updateQuoteDto.clientId) {
          try {
            client = await this.clientService.findOne(updateQuoteDto.clientId);
          } catch (error) {
            throw new BadRequestException(`Client with ID ${updateQuoteDto.clientId} not found`);
          }
        }

        // Update basic quote properties
        Object.assign(existingQuote, {
          year: updateQuoteDto.year ?? existingQuote.year,
          userDate: updateQuoteDto.userDate !== undefined ? updateQuoteDto.userDate : existingQuote.userDate,
          client: client ?? existingQuote.client,
        });

        // Save the updated quote using the transactional manager
        const savedQuote = await transactionalEntityManager.save(existingQuote);

        // If items are provided, update them
        if (updateQuoteDto.items) {
          // Remove existing items using the transactional manager
          await transactionalEntityManager.delete('QuoteItem', { quote: { id: existingQuote.id } });

          // Create new items
          const quoteItems = await Promise.all(updateQuoteDto.items.map(async (item: CreateQuoteItemDto) => {
            let product = null;
            
            if (item.productId) {
              try {
                product = await this.productService.findProductById(item.productId);
              } catch (error) {
                if (error instanceof NotFoundException) {
                  throw new BadRequestException(`Product with ID ${item.productId} not found`);
                }
                throw error;
              }
            }

            return {
              productName: item.productName,
              description: item.description || '',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice || (item.quantity * item.unitPrice),
              quote: savedQuote,
              product: product
            };
          }));
          
          // Save the new items using the transactional manager
          const savedItems = await transactionalEntityManager.save('QuoteItem', quoteItems);
          savedQuote.items = savedItems as QuoteItem[];
        }

        return savedQuote;

      } catch (error) {
        console.error('Error in updateQuote:', error);
        throw error;
      }
    });
  }

  async createQuote(createQuoteDto: CreateQuoteDto): Promise<Quote> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      try {
        console.log('createQuoteDto', createQuoteDto);
        // Ensure items is initialized
        const items = createQuoteDto.items || [];
        
        // Validate quote items if they exist
        for (const item of items) {
          if (!item?.productName) {
            throw new BadRequestException(
              'Product name is required for quote items'
            );
          }
          // Ensure numeric fields are properly initialized
          item.quantity = Number(item.quantity) || 0;
          item.unitPrice = Number(item.unitPrice) || 0;
          item.totalPrice = Number(item.totalPrice) || (item.quantity * item.unitPrice);
        }

        // Handle client assignment
        let client = null;
        if (createQuoteDto.clientId) {
          try {
            client = await this.clientService.findOne(createQuoteDto.clientId);
          } catch (error) {
            throw new BadRequestException(`Client with ID ${createQuoteDto.clientId} not found`);
          }
        }

        const year = createQuoteDto.year ?? new Date().getFullYear();
        const sequenceNumber = await this.getNextSequenceNumber(year);

        // Create the quote entity without items first
        const quote = this.quoteRepository.create({
          ...createQuoteDto,
          year,
          sequenceNumber,
          client,
          items: [], // Initialize empty array
        });

        // Save the quote first using the transactional manager
        const savedQuote = await transactionalEntityManager.save(quote);

        // If there are items, save them with the quote reference
        if (items.length > 0) {
          // Process items sequentially to handle product lookups
          const quoteItems = await Promise.all(items.map(async (item: CreateQuoteItemDto) => {
            let product = null;
            
            // If productId is provided, look up the product
            if (item.productId) {
              try {
                product = await this.productService.findProductById(item.productId);
              } catch (error) {
                if (error instanceof NotFoundException) {
                  throw new BadRequestException(`Product with ID ${item.productId} not found`);
                }
                throw error;
              }
            }

            return {
              productName: item.productName,
              description: item.description || '',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              quote: savedQuote,
              product: product // This will now be the full product entity with numeric ID
            };
          }));
          
          // Save the items and assign them to the quote using the transactional manager
          const savedItems = await transactionalEntityManager.save('QuoteItem', quoteItems);
          savedQuote.items = savedItems as QuoteItem[];
        }

        // Return the quote with items
        return savedQuote;

      } catch (error) {
        console.error('Error in createQuote:', error);
        throw error;
      }
    });
  }

  async deleteQuote(quoteUuid: string): Promise<void> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      try {
        // Find the quote to ensure it exists
        const quote = await this.quoteRepository.findByReferenceId(quoteUuid);
        if (!quote) {
          throw new NotFoundException(`Quote with reference ID ${quoteUuid} not found`);
        }

        // Delete associated quote items first using the transactional manager
        await transactionalEntityManager.delete('QuoteItem', { quote: { id: quote.id } });
        
        // Delete the quote using the transactional manager
        await transactionalEntityManager.delete('Quote', { id: quote.id });

      } catch (error) {
        console.error('Error in deleteQuote:', error);
        throw error;
      }
    });
  }

  // ===== DELIVERY NOTE METHODS =====

  private async getNextDeliveryNoteSequenceNumber(year: number | null): Promise<number> {
    if (!year) {
      return 1;
    }

    const deliveryNotes = await this.deliveryNoteRepository
      .createQueryBuilder('deliveryNote')
      .where('deliveryNote.year = :year', { year })
      .orderBy('deliveryNote.sequenceNumber', 'DESC')
      .getMany();

    return deliveryNotes.length > 0 ? deliveryNotes[0].sequenceNumber + 1 : 1;
  }

  async getDeliveryNoteById(deliveryNoteUuid: string, userId: string): Promise<DeliveryNote> {
    try {
      const deliveryNote = await this.deliveryNoteRepository
        .createQueryBuilder('deliveryNote')
        .leftJoinAndSelect('deliveryNote.items', 'items')
        .leftJoinAndSelect('items.product', 'product')
        .leftJoinAndSelect('deliveryNote.client', 'client')
        .leftJoinAndSelect('deliveryNote.createdByUser', 'createdByUser')
        .where('deliveryNote.referenceId = :referenceId', { referenceId: deliveryNoteUuid })
        .andWhere('deliveryNote.createdByUser.id = :userId', { userId })
        .getOne();

      if (!deliveryNote) {
        throw new NotFoundException(`Delivery note with reference ID ${deliveryNoteUuid} not found or access denied`);
      }
      return deliveryNote;
    } catch (error) {
      console.error('Error in getDeliveryNoteById:', error);
      throw error;
    }
  }

  async getAllDeliveryNotes(filterDto?: DeliveryNoteFilterDto, userId?: string): Promise<DeliveryNote[]> {
    try {
      const queryBuilder = this.deliveryNoteRepository
        .createQueryBuilder('deliveryNote')
        .leftJoinAndSelect('deliveryNote.items', 'items')
        .leftJoinAndSelect('items.product', 'product')
        .leftJoinAndSelect('deliveryNote.client', 'client')
        .leftJoinAndSelect('deliveryNote.createdByUser', 'createdByUser');

      // Filter by user ID if provided
      if (userId) {
        queryBuilder.andWhere('deliveryNote.createdByUser.id = :userId', { userId });
      }

      // Apply client filter if provided
      if (filterDto?.clientId) {
        queryBuilder.andWhere('deliveryNote.client.id = :clientId', { clientId: filterDto.clientId });
      }

      // Apply status filter if provided
      if (filterDto?.status) {
        queryBuilder.andWhere('deliveryNote.status = :status', { status: filterDto.status });
      }

      // Apply date range filter if provided
      if (filterDto?.startDate && filterDto?.endDate) {
        queryBuilder.andWhere('deliveryNote.deliveryDate BETWEEN :startDate AND :endDate', {
          startDate: filterDto.startDate,
          endDate: filterDto.endDate,
        });
      } else if (filterDto?.startDate) {
        queryBuilder.andWhere('deliveryNote.deliveryDate >= :startDate', { startDate: filterDto.startDate });
      } else if (filterDto?.endDate) {
        queryBuilder.andWhere('deliveryNote.deliveryDate <= :endDate', { endDate: filterDto.endDate });
      }

      const deliveryNotes = await queryBuilder
        .orderBy('deliveryNote.createdAt', 'DESC')
        .getMany();

      return deliveryNotes || [];
    } catch (error) {
      console.error('Error in getAllDeliveryNotes:', error);
      throw error;
    }
  }

  async createDeliveryNote(createDeliveryNoteDto: CreateDeliveryNoteDto, userId: string): Promise<DeliveryNote> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      try {
        console.log('createDeliveryNoteDto', createDeliveryNoteDto);
        const items = createDeliveryNoteDto.items || [];
        
        // Validate delivery note items if they exist
        for (const item of items) {
          if (!item?.productName) {
            throw new BadRequestException(
              'Product name is required for delivery note items'
            );
          }
          item.quantity = Number(item.quantity) || 0;
          item.deliveredQuantity = Number(item.deliveredQuantity) || 0;
          item.unitPrice = Number(item.unitPrice) || 0;
          item.totalPrice = Number(item.totalPrice) || (item.quantity * item.unitPrice);
        }

        // Handle client assignment
        let client = null;
        if (createDeliveryNoteDto.clientId) {
          try {
            client = await this.clientService.findOne(createDeliveryNoteDto.clientId);
          } catch (error) {
            throw new BadRequestException(`Client with ID ${createDeliveryNoteDto.clientId} not found`);
          }
        }

        // Get the user entity using the transactional manager
        const user = await transactionalEntityManager.findOne('User', { where: { id: userId } });
        if (!user) {
          throw new BadRequestException(`User with ID ${userId} not found`);
        }

        const year = createDeliveryNoteDto.year ?? new Date().getFullYear();
        const sequenceNumber = await this.getNextDeliveryNoteSequenceNumber(year);

        // Create the delivery note entity without items first
        const deliveryNote = this.deliveryNoteRepository.create({
          ...createDeliveryNoteDto,
          year,
          sequenceNumber,
          client,
          createdByUser: user,
          deliveryDate: createDeliveryNoteDto.deliveryDate || new Date(),
          status: createDeliveryNoteDto.status || 'pending',
          items: [],
        });

        // Save the delivery note first using the transactional manager
        const savedDeliveryNote = await transactionalEntityManager.save(deliveryNote);

        // If there are items, save them with the delivery note reference
        if (items.length > 0) {
          const deliveryNoteItems = await Promise.all(items.map(async (item: CreateDeliveryNoteItemDto) => {
            let product = null;
            let vatRate = 0;
            let appliedVatRate = null;
            
            if (item.productId) {
              try {
                product = await this.productService.findProductById(item.productId);
                // Use VAT rate from product if available
                if (product?.vatRate) {
                  vatRate = product.vatRate.rate;
                  appliedVatRate = product.vatRate;
                }
              } catch (error) {
                if (error instanceof NotFoundException) {
                  throw new BadRequestException(`Product with ID ${item.productId} not found`);
                }
                throw error;
              }
            }

            // Calculate VAT amounts
            const netTotal = item.totalPrice || (item.quantity * item.unitPrice);
            const vatAmount = Math.round(netTotal * vatRate * 1000) / 1000;
            const grossTotal = Math.round((netTotal + vatAmount) * 1000) / 1000;

            return {
              productName: item.productName,
              description: item.description || '',
              quantity: item.quantity,
              deliveredQuantity: item.deliveredQuantity || 0,
              unitPrice: item.unitPrice,
              totalPrice: netTotal,
              vatRate: vatRate,
              vatAmount: vatAmount,
              grossTotalPrice: grossTotal,
              deliveryNote: savedDeliveryNote,
              product: product,
              appliedVatRate: appliedVatRate
            };
          }));
          
          // Save items using the transactional manager
          const savedItems = await transactionalEntityManager.save('DeliveryNoteItem', deliveryNoteItems);
          savedDeliveryNote.items = savedItems as DeliveryNoteItem[];
        }

        return savedDeliveryNote;

      } catch (error) {
        console.error('Error in createDeliveryNote:', error);
        throw error;
      }
    });
  }

  async updateDeliveryNote(deliveryNoteUuid: string, updateDeliveryNoteDto: CreateDeliveryNoteDto, userId: string): Promise<DeliveryNote> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      try {
        // Find the existing delivery note and verify ownership
        const existingDeliveryNote = await this.deliveryNoteRepository
          .createQueryBuilder('deliveryNote')
          .leftJoinAndSelect('deliveryNote.createdByUser', 'createdByUser')
          .where('deliveryNote.referenceId = :referenceId', { referenceId: deliveryNoteUuid })
          .andWhere('deliveryNote.createdByUser.id = :userId', { userId })
          .getOne();

        if (!existingDeliveryNote) {
          throw new NotFoundException(`Delivery note with reference ID ${deliveryNoteUuid} not found or access denied`);
        }

        // Handle client assignment
        let client = null;
        if (updateDeliveryNoteDto.clientId) {
          try {
            client = await this.clientService.findOne(updateDeliveryNoteDto.clientId);
          } catch (error) {
            throw new BadRequestException(`Client with ID ${updateDeliveryNoteDto.clientId} not found`);
          }
        }

        // Update basic delivery note properties
        Object.assign(existingDeliveryNote, {
          year: updateDeliveryNoteDto.year ?? existingDeliveryNote.year,
          deliveryDate: updateDeliveryNoteDto.deliveryDate ?? existingDeliveryNote.deliveryDate,
          deliveryAddress: updateDeliveryNoteDto.deliveryAddress !== undefined ? updateDeliveryNoteDto.deliveryAddress : existingDeliveryNote.deliveryAddress,
          notes: updateDeliveryNoteDto.notes !== undefined ? updateDeliveryNoteDto.notes : existingDeliveryNote.notes,
          status: updateDeliveryNoteDto.status ?? existingDeliveryNote.status,
          client: client ?? existingDeliveryNote.client,
        });

        // Save the updated delivery note using the transactional manager
        const savedDeliveryNote = await transactionalEntityManager.save(existingDeliveryNote);

        // If items are provided, update them
        if (updateDeliveryNoteDto.items) {
          // Remove existing items using the transactional manager
          await transactionalEntityManager.delete('DeliveryNoteItem', { deliveryNote: { id: existingDeliveryNote.id } });

          // Create new items
          const deliveryNoteItems = await Promise.all(updateDeliveryNoteDto.items.map(async (item: CreateDeliveryNoteItemDto) => {
            let product = null;
            let vatRate = 0;
            let appliedVatRate = null;
            
            if (item.productId) {
              try {
                product = await this.productService.findProductById(item.productId);
                // Use VAT rate from product if available
                if (product?.vatRate) {
                  vatRate = product.vatRate.rate;
                  appliedVatRate = product.vatRate;
                }
              } catch (error) {
                if (error instanceof NotFoundException) {
                  throw new BadRequestException(`Product with ID ${item.productId} not found`);
                }
                throw error;
              }
            }

            // Calculate VAT amounts
            const netTotal = item.totalPrice || (item.quantity * item.unitPrice);
            const vatAmount = Math.round(netTotal * vatRate * 1000) / 1000;
            const grossTotal = Math.round((netTotal + vatAmount) * 1000) / 1000;

            return {
              productName: item.productName,
              description: item.description || '',
              quantity: item.quantity,
              deliveredQuantity: item.deliveredQuantity || 0,
              unitPrice: item.unitPrice,
              totalPrice: netTotal,
              vatRate: vatRate,
              vatAmount: vatAmount,
              grossTotalPrice: grossTotal,
              deliveryNote: savedDeliveryNote,
              product: product,
              appliedVatRate: appliedVatRate
            };
          }));
          
          // Save the new items using the transactional manager
          const savedItems = await transactionalEntityManager.save('DeliveryNoteItem', deliveryNoteItems);
          savedDeliveryNote.items = savedItems as DeliveryNoteItem[];
        }

        return savedDeliveryNote;

      } catch (error) {
        console.error('Error in updateDeliveryNote:', error);
        throw error;
      }
    });
  }

  async deleteDeliveryNote(deliveryNoteUuid: string, userId: string): Promise<void> {
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      try {
        // Find the delivery note and verify ownership
        const deliveryNote = await this.deliveryNoteRepository
          .createQueryBuilder('deliveryNote')
          .leftJoinAndSelect('deliveryNote.createdByUser', 'createdByUser')
          .where('deliveryNote.referenceId = :referenceId', { referenceId: deliveryNoteUuid })
          .andWhere('deliveryNote.createdByUser.id = :userId', { userId })
          .getOne();

        if (!deliveryNote) {
          throw new NotFoundException(`Delivery note with reference ID ${deliveryNoteUuid} not found or access denied`);
        }

        // Delete associated delivery note items first using the transactional manager
        await transactionalEntityManager.delete('DeliveryNoteItem', { deliveryNote: { id: deliveryNote.id } });
        
        // Delete the delivery note using the transactional manager
        await transactionalEntityManager.delete('DeliveryNote', { id: deliveryNote.id });

      } catch (error) {
        console.error('Error in deleteDeliveryNote:', error);
        throw error;
      }
    });
  }
}

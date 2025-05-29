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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

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

      // Save the updated quote
      const savedQuote = await queryRunner.manager.save(existingQuote);

      // If items are provided, update them
      if (updateQuoteDto.items) {
        // Remove existing items
        await queryRunner.manager.delete('QuoteItem', { quote: { id: existingQuote.id } });

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
        
        // Save the new items
        const savedItems = await queryRunner.manager.save('QuoteItem', quoteItems);
        savedQuote.items = savedItems as QuoteItem[];
      }

      await queryRunner.commitTransaction();
      return savedQuote;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error in updateQuote:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createQuote(createQuoteDto: CreateQuoteDto): Promise<Quote> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

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

      // Save the quote first
      const savedQuote = await queryRunner.manager.save(quote);

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
        
        // Save the items and assign them to the quote
        const savedItems = await queryRunner.manager.save('QuoteItem', quoteItems);
        savedQuote.items = savedItems as QuoteItem[];
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Return the quote with items
      return savedQuote;

    } catch (error) {
      // Rollback the transaction on error
      await queryRunner.rollbackTransaction();
      console.error('Error in createQuote:', error);
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async deleteQuote(quoteUuid: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the quote to ensure it exists
      const quote = await this.quoteRepository.findByReferenceId(quoteUuid);
      if (!quote) {
        throw new NotFoundException(`Quote with reference ID ${quoteUuid} not found`);
      }

      // Delete associated quote items first
      await queryRunner.manager.delete('QuoteItem', { quote: { id: quote.id } });
      
      // Delete the quote
      await queryRunner.manager.delete('Quote', { id: quote.id });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error in deleteQuote:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
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

  async getDeliveryNoteById(deliveryNoteUuid: string): Promise<DeliveryNote> {
    try {
      const deliveryNote = await this.deliveryNoteRepository.findByReferenceId(deliveryNoteUuid);
      if (!deliveryNote) {
        throw new NotFoundException(`Delivery note with reference ID ${deliveryNoteUuid} not found`);
      }
      return deliveryNote;
    } catch (error) {
      console.error('Error in getDeliveryNoteById:', error);
      throw error;
    }
  }

  async getAllDeliveryNotes(filterDto?: DeliveryNoteFilterDto): Promise<DeliveryNote[]> {
    try {
      const queryBuilder = this.deliveryNoteRepository
        .createQueryBuilder('deliveryNote')
        .leftJoinAndSelect('deliveryNote.items', 'items')
        .leftJoinAndSelect('items.product', 'product')
        .leftJoinAndSelect('deliveryNote.client', 'client');

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

  async createDeliveryNote(createDeliveryNoteDto: CreateDeliveryNoteDto): Promise<DeliveryNote> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

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

      const year = createDeliveryNoteDto.year ?? new Date().getFullYear();
      const sequenceNumber = await this.getNextDeliveryNoteSequenceNumber(year);

      // Create the delivery note entity without items first
      const deliveryNote = this.deliveryNoteRepository.create({
        ...createDeliveryNoteDto,
        year,
        sequenceNumber,
        client,
        deliveryDate: createDeliveryNoteDto.deliveryDate || new Date(),
        status: createDeliveryNoteDto.status || 'pending',
        items: [],
      });

      // Save the delivery note first
      const savedDeliveryNote = await queryRunner.manager.save(deliveryNote);

      // If there are items, save them with the delivery note reference
      if (items.length > 0) {
        const deliveryNoteItems = await Promise.all(items.map(async (item: CreateDeliveryNoteItemDto) => {
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
            deliveredQuantity: item.deliveredQuantity || 0,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            deliveryNote: savedDeliveryNote,
            product: product
          };
        }));
        
        const savedItems = await queryRunner.manager.save('DeliveryNoteItem', deliveryNoteItems);
        savedDeliveryNote.items = savedItems as DeliveryNoteItem[];
      }

      await queryRunner.commitTransaction();
      return savedDeliveryNote;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error in createDeliveryNote:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateDeliveryNote(deliveryNoteUuid: string, updateDeliveryNoteDto: CreateDeliveryNoteDto): Promise<DeliveryNote> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the existing delivery note
      const existingDeliveryNote = await this.deliveryNoteRepository.findByReferenceId(deliveryNoteUuid);
      if (!existingDeliveryNote) {
        throw new NotFoundException(`Delivery note with reference ID ${deliveryNoteUuid} not found`);
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

      // Save the updated delivery note
      const savedDeliveryNote = await queryRunner.manager.save(existingDeliveryNote);

      // If items are provided, update them
      if (updateDeliveryNoteDto.items) {
        // Remove existing items
        await queryRunner.manager.delete('DeliveryNoteItem', { deliveryNote: { id: existingDeliveryNote.id } });

        // Create new items
        const deliveryNoteItems = await Promise.all(updateDeliveryNoteDto.items.map(async (item: CreateDeliveryNoteItemDto) => {
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
            deliveredQuantity: item.deliveredQuantity || 0,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice || (item.quantity * item.unitPrice),
            deliveryNote: savedDeliveryNote,
            product: product
          };
        }));
        
        // Save the new items
        const savedItems = await queryRunner.manager.save('DeliveryNoteItem', deliveryNoteItems);
        savedDeliveryNote.items = savedItems as DeliveryNoteItem[];
      }

      await queryRunner.commitTransaction();
      return savedDeliveryNote;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error in updateDeliveryNote:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteDeliveryNote(deliveryNoteUuid: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the delivery note to ensure it exists
      const deliveryNote = await this.deliveryNoteRepository.findByReferenceId(deliveryNoteUuid);
      if (!deliveryNote) {
        throw new NotFoundException(`Delivery note with reference ID ${deliveryNoteUuid} not found`);
      }

      // Delete associated delivery note items first
      await queryRunner.manager.delete('DeliveryNoteItem', { deliveryNote: { id: deliveryNote.id } });
      
      // Delete the delivery note
      await queryRunner.manager.delete('DeliveryNote', { id: deliveryNote.id });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error in deleteDeliveryNote:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

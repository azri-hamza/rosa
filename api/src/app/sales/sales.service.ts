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
  DeliveryNoteFilterDto,
  User,
  PRODUCT_REPOSITORY,
  ProductRepository,
  DeliveryNoteItemRepository,
  DELIVERY_NOTE_ITEM_REPOSITORY,
} from '@rosa/api-core';
import { DataSource } from 'typeorm';
import { ProductService } from '../product/product.service';
import { ClientService } from '../client/client.service';
import { CreateQuoteItemDto } from './dto/create-quote-item.dto';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateDeliveryNoteDto } from './dto/create-delivery-note.dto';
import { UpdateDeliveryNoteDto } from './dto/update-delivery-note.dto';

@Injectable()
export class SalesService {
  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quoteRepository: QuoteRepository,
    @Inject(DELIVERY_NOTE_REPOSITORY) private readonly deliveryNoteRepository: DeliveryNoteRepository,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(ProductService) private readonly productService: ProductService,
    @Inject(ClientService) private readonly clientService: ClientService,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepository,
    @Inject(DELIVERY_NOTE_ITEM_REPOSITORY) private readonly deliveryNoteItemRepository: DeliveryNoteItemRepository
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

  private calculateItemPrices(item: Partial<DeliveryNoteItem>): {
    discountAmount: number;
    discountPercentage: number;
    netUnitPrice: number;
    grossUnitPrice: number;
    totalPrice: number;
    vatAmount: number;
    grossTotalPrice: number;
  } {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const discountPercentage = Number(item.discountPercentage) || 0;
    const vatPercentage = Number(item.vatRate) || 0;

    // Calculate discount amount based solely on discount percentage
    const finalDiscountAmount = Math.round(unitPrice * (discountPercentage / 100) * 1000) / 1000;
    const finalDiscountPercentage = discountPercentage;

    // Calculate net unit price (after discount)
    const netUnitPrice = Math.round((unitPrice - finalDiscountAmount) * 1000) / 1000;

    // Calculate total price
    const netTotal = Math.round(quantity * netUnitPrice * 1000) / 1000;

    // Calculate VAT and gross prices
    const grossUnitPrice = Math.round(netUnitPrice * (1 + vatPercentage / 100) * 1000) / 1000;
    const vatAmount = Math.round(netTotal * (vatPercentage / 100) * 1000) / 1000;
    const grossTotal = netTotal + vatAmount;

    return {
      discountAmount: finalDiscountAmount,
      discountPercentage: finalDiscountPercentage,
      netUnitPrice,
      grossUnitPrice,
      totalPrice: netTotal,
      vatAmount,
      grossTotalPrice: grossTotal,
    };
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

      console.log('deliveryNotes items on getAllDeliveryNotes', deliveryNotes[0].items);

      return deliveryNotes || [];
    } catch (error) {
      console.error('Error in getAllDeliveryNotes:', error);
      throw error;
    }
  }

  async createDeliveryNote(dto: CreateDeliveryNoteDto, userId: string): Promise<DeliveryNote> {
    const { items = [], ...deliveryNoteData } = dto;

    // Get the next sequence number
    const year = dto.year ?? new Date().getFullYear();
    const sequenceNumber = await this.getNextDeliveryNoteSequenceNumber(year);

    // Fetch the user entity
    const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Create delivery note with sequence number and user
    const deliveryNote = this.deliveryNoteRepository.create({
      ...deliveryNoteData,
      year,
      sequenceNumber,
      createdByUser: user
    });
    const savedDeliveryNote = await this.deliveryNoteRepository.save(deliveryNote);

    // Create items
    const itemEntities = await Promise.all(
      items.map(async (item) => {
        let product = null;
        if (item.productId && item.productId.trim() !== '') {
          // Use the UUID productId directly instead of parsing as integer
          product = await this.productRepository.findByProductId(item.productId);
          console.log('product on createDeliveryNote', product);
        }

        // Calculate prices
        const calculations = this.calculateItemPrices({
          ...item,
          id: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          deliveryNote: savedDeliveryNote,
          unitPrice: item.unitPrice,
        });

        return this.deliveryNoteItemRepository.create({
          productName: item.productName,
          description: item.description || '',
          quantity: item.quantity,
          deliveredQuantity: item.deliveredQuantity || 0,
          unitPrice: item.unitPrice,
          discountPercentage: calculations.discountPercentage,
          discountAmount: calculations.discountAmount,
          netUnitPrice: calculations.netUnitPrice,
          grossUnitPrice: calculations.grossUnitPrice,
          totalPrice: calculations.totalPrice,
          vatRate: item.vatRate ? Number(item.vatRate) / 100 : undefined,
          vatAmount: calculations.vatAmount,
          grossTotalPrice: calculations.grossTotalPrice,
          deliveryNote: savedDeliveryNote,
          product: product
        });
      })
    );

    // Save items
    const savedItems = await this.deliveryNoteItemRepository.save(itemEntities);
    savedDeliveryNote.items = savedItems;

    return savedDeliveryNote;
  }

  async updateDeliveryNote(referenceId: string, dto: UpdateDeliveryNoteDto): Promise<DeliveryNote> {
    const { items = [], clientId, ...deliveryNoteData } = dto;
    console.log('deliveryNoteData', deliveryNoteData);

    console.log('updateDeliveryNote - items received:', JSON.stringify(items, null, 2));

    // Find the delivery note with all its relationships
    const deliveryNote = await this.deliveryNoteRepository
      .createQueryBuilder('deliveryNote')
      .leftJoinAndSelect('deliveryNote.items', 'items')
      .leftJoinAndSelect('deliveryNote.client', 'client')
      .leftJoinAndSelect('deliveryNote.createdByUser', 'createdByUser')
      .where('deliveryNote.referenceId = :referenceId', { referenceId })
      .getOne();

    if (!deliveryNote) {
      throw new NotFoundException(`Delivery note with reference ID "${referenceId}" not found`);
    }

    // If clientId is provided, fetch the client
    if (clientId) {
      try {
        const client = await this.clientService.findOne(clientId);
        deliveryNote.client = client;
      } catch (error) {
        throw new BadRequestException(`Client with ID ${clientId} not found`);
      }
    }

    // Update delivery note data
    Object.assign(deliveryNote, deliveryNoteData);
    console.log('deliveryNote to be saved', deliveryNote);
    const savedDeliveryNote = await this.deliveryNoteRepository.save(deliveryNote);

    // Delete removed items
    const existingItemIds = deliveryNote.items?.map(item => item.id) || [];
    const updatedItemIds = items
      .map(item => item.id)
      .filter(id => id !== undefined && id !== null);
    const removedItemIds = existingItemIds.filter(id => !updatedItemIds.includes(id));

    if (removedItemIds.length > 0) {
      await this.deliveryNoteItemRepository.delete(removedItemIds);
    }

    // Update or create items
    const itemEntities = await Promise.all(
      items.map(async (item) => {
        let product = null;
        if (item.productId && item.productId.trim() !== '') {
          // Use the UUID productId directly instead of parsing as integer
          product = await this.productRepository.findByProductId(item.productId);
          console.log('product on updateDeliveryNote', product);
        }

        // Calculate prices
        const itemId = item.id || 0;
        console.log(`Item ID: ${itemId}`);
        const calculations = this.calculateItemPrices({
          ...item,
          id: itemId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          deliveryNote: savedDeliveryNote,
          unitPrice: item.unitPrice,
        });

        if (item.id && item.id > 0) {
          const existingItem = await this.deliveryNoteItemRepository.findOne({ 
            where: { id: item.id },
            relations: ['deliveryNote']
          });
          if (existingItem) {
            Object.assign(existingItem, {
              productName: item.productName,
              description: item.description || '',
              quantity: item.quantity,
              deliveredQuantity: item.deliveredQuantity || 0,
              unitPrice: item.unitPrice,
              discountPercentage: calculations.discountPercentage,
              discountAmount: calculations.discountAmount,
              netUnitPrice: calculations.netUnitPrice,
              grossUnitPrice: calculations.grossUnitPrice,
              totalPrice: calculations.totalPrice,
              vatRate: item.vatRate ? Number(item.vatRate) / 100 : undefined,
              vatAmount: calculations.vatAmount,
              grossTotalPrice: calculations.grossTotalPrice,
              product: product,
              deliveryNote: savedDeliveryNote
            });
            return existingItem;
          }
        }

        return this.deliveryNoteItemRepository.create({
          productName: item.productName,
          description: item.description || '',
          quantity: item.quantity,
          deliveredQuantity: item.deliveredQuantity || 0,
          unitPrice: item.unitPrice,
          discountPercentage: calculations.discountPercentage,
          discountAmount: calculations.discountAmount,
          netUnitPrice: calculations.netUnitPrice,
          grossUnitPrice: calculations.grossUnitPrice,
          totalPrice: calculations.totalPrice,
          vatRate: item.vatRate ? Number(item.vatRate) / 100 : undefined,
          vatAmount: calculations.vatAmount,
          grossTotalPrice: calculations.grossTotalPrice,
          deliveryNote: savedDeliveryNote,
          product: product
        });
      })
    );

    // Save items
    const savedItems = await this.deliveryNoteItemRepository.save(itemEntities);
    savedDeliveryNote.items = savedItems;

    // Fetch and return the complete updated delivery note with all relations
    const updatedDeliveryNote = await this.deliveryNoteRepository
      .createQueryBuilder('deliveryNote')
      .leftJoinAndSelect('deliveryNote.items', 'items')
      .leftJoinAndSelect('deliveryNote.client', 'client')
      .leftJoinAndSelect('deliveryNote.createdByUser', 'createdByUser')
      .where('deliveryNote.id = :id', { id: savedDeliveryNote.id })
      .getOne();

    if (!updatedDeliveryNote) {
      throw new NotFoundException(`Failed to fetch updated delivery note with ID ${savedDeliveryNote.id}`);
    }

    return updatedDeliveryNote;
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

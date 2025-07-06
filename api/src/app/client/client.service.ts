import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { Like } from 'typeorm';
import { Client, CreateClientDto, UpdateClientDto, PaginationDto, Quote, ClientRepository, CLIENT_REPOSITORY } from '@rosa/api-core';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ClientService {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    // Generate UUID if not provided
    if (!createClientDto.referenceId) {
      createClientDto.referenceId = uuidv4();
    }
    
    const client = this.clientRepository.create(createClientDto);
    return await this.clientRepository.save(client);
  }

  async search(query: string): Promise<Client[]> {
    if (!query) {
      return await this.clientRepository.find({
        take: 10,
        order: { name: 'ASC' },
      });
    }

    return await this.clientRepository.find({
      where: [
        { name: Like(`%${query}%`) },
        { taxIdentificationNumber: Like(`%${query}%`) },
        { phoneNumber: Like(`%${query}%`) },
        { address: Like(`%${query}%`) },
      ],
      take: 10,
      order: { name: 'ASC' },
    });
  }

  async findAll(pagination: PaginationDto): Promise<[Client[], number]> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    
    const [clients, total] = await this.clientRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });
    return [clients, total];
  }

  async findOne(id: number): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      throw new Error(`Client with ID ${id} not found`);
    }
    return client;
  }

  async findByReferenceId(referenceId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { referenceId } });
    if (!client) {
      throw new Error(`Client with reference ID ${referenceId} not found`);
    }
    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, updateClientDto);
    return await this.clientRepository.save(client);
  }

  async remove(id: number): Promise<void> {
    // First check if the client exists
    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    
    // Check if there are any quotes associated with this client
    const quotesCount = await this.clientRepository.manager
      .getRepository(Quote)
      .createQueryBuilder('quote')
      .where('quote.client.id = :clientId', { clientId: id })
      .getCount();
    
    if (quotesCount > 0) {
      throw new BadRequestException(
        `Cannot delete client "${client.name}" because it has ${quotesCount} associated quote(s). Please delete the quotes first or assign them to another client.`
      );
    }
    
    const result = await this.clientRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
  }
} 
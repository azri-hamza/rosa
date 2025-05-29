import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../entities/client.entity';
import { CreateClientDto, UpdateClientDto } from '../dto/client.dto';
import { PaginationDto } from '../dto/pagination.dto';
import { Quote } from '../entities/quote.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientRepository.create(createClientDto);
    return await this.clientRepository.save(client);
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
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return client;
  }

  async findByReferenceId(referenceId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { referenceId } });
    if (!client) {
      throw new NotFoundException(`Client with reference ID ${referenceId} not found`);
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
    const client = await this.findOne(id);
    
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
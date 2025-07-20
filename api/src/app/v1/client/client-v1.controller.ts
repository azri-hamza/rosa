import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards, Inject } from '@nestjs/common';
import { Client, CreateClientDto, UpdateClientDto, PaginationDto } from '@rosa/api-core';
import { Response, ResponseMeta } from '@rosa/types';
import { ClientService } from '../../client/client.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller({ path: 'clients', version: '1' })
@UseGuards(JwtAuthGuard)
export class ClientV1Controller {
  constructor(@Inject(ClientService) private readonly clientService: ClientService) {}

  @Post()
  async create(@Body() createClientDto: CreateClientDto): Promise<{
    data: Client;
    meta: { version: string; timestamp: string };
  }> {
    const client = await this.clientService.create(createClientDto);
    return {
      data: client,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Get('search')
  async search(@Query('q') query: string): Promise<{
    data: Client[];
    meta: { version: string; timestamp: string };
  }> {
    const clients = await this.clientService.search(query || '');
    return {
      data: clients,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Get()
  async findAll(@Query() pagination: PaginationDto): Promise<{
    data: Client[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    meta: { version: string; timestamp: string };
  }> {
    const [clients, total] = await this.clientService.findAll(pagination);
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    
    return {
      data: clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{
    data: Client;
    meta: { version: string; timestamp: string };
  }> {
    const client = await this.clientService.findOne(id);
    return {
      data: client,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Get('reference/:referenceId')
  async findByReferenceId(@Param('referenceId') referenceId: string): Promise<{
    data: Client;
    meta: { version: string; timestamp: string };
  }> {
    const client = await this.clientService.findByReferenceId(referenceId);
    return {
      data: client,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Response<Client, ResponseMeta>> {
    const client = await this.clientService.update(id, updateClientDto);
    return {
      data: client, 
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString()
      }
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    meta: { version: string; timestamp: string };
  }> {
    await this.clientService.remove(id);
    return {
      message: 'Client deleted successfully',
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }
} 
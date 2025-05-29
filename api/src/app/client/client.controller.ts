import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { Client, CreateClientDto, UpdateClientDto, PaginationDto } from '@rosa/api-core';
import { ClientService } from './client.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientController {
  constructor(@Inject(ClientService) private readonly clientService: ClientService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto): Promise<Client> {
    return this.clientService.create(createClientDto);
  }

  @Get('search')
  search(@Query('q') query: string): Promise<Client[]> {
    return this.clientService.search(query || '');
  }

  @Get()
  async findAll(@Query() pagination: PaginationDto): Promise<{ data: Client[]; total: number }> {
    const [clients, total] = await this.clientService.findAll(pagination);
    return { data: clients, total };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Client> {
    return this.clientService.findOne(id);
  }

  @Get('reference/:referenceId')
  findByReferenceId(@Param('referenceId') referenceId: string): Promise<Client> {
    return this.clientService.findByReferenceId(referenceId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    return this.clientService.update(id, updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.clientService.remove(id);
  }
} 
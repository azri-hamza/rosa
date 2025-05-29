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
} from '@nestjs/common';
import { ClientService } from '../services/client.service';
import { CreateClientDto, UpdateClientDto } from '../dto/client.dto';
import { Client } from '../entities/client.entity';
import { PaginationDto } from '../dto/pagination.dto';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto): Promise<Client> {
    return this.clientService.create(createClientDto);
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
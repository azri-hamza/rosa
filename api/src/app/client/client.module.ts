import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '@rosa/api-core';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client])
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService]
})
export class ClientModule {} 
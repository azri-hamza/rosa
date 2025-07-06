import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { ClientRepositoryProvider } from '@rosa/api-core';

@Module({
  controllers: [ClientController],
  providers: [ClientService, ClientRepositoryProvider],
  exports: [ClientService]
})
export class ClientModule {} 
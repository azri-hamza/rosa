import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientRepositoryProvider } from '@rosa/api-core';

@Module({
  controllers: [],
  providers: [ClientService, ClientRepositoryProvider],
  exports: [ClientService]
})
export class ClientModule {} 
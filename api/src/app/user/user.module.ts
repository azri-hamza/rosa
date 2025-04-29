import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserRepositoryProvider } from '@rosa/api-core';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService, UserRepositoryProvider],
  controllers: [UserController],
  exports: [UserService], // optional: export if used in other modules
})
export class UserModule {}

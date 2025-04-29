import { Provider } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createUserRepository } from '../user.repository';
// import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export const UserRepositoryProvider: Provider = {
  provide: USER_REPOSITORY,
  inject: [DataSource],
  useFactory: (dataSource: DataSource) => {
    return createUserRepository(dataSource);
    // const baseRepository = dataSource.getRepository(User);
    // return baseRepository.extend(UserRepository);
  },
};

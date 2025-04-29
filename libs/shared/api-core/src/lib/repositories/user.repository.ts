// libs/shared/api-core/src/lib/repositories/user.repository.ts
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  // Custom query: Find by email with relations
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({
      where: { email },
      relations: ['profile'],
    });
  }

  async findInactiveUsers(): Promise<User[]> {
    // Example usage
    return this.dataSource.query(`
      SELECT * FROM users 
      WHERE date_creation < NOW() - INTERVAL '30 days'
    `);
  }
}

// Factory function for dependency injection
export const createUserRepository = (dataSource: DataSource) => {
  return new UserRepository(dataSource);
};

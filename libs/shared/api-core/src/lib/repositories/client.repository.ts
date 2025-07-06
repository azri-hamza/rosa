import { DataSource, Repository } from 'typeorm';
import { Client } from '../entities/client.entity';

export class ClientRepository extends Repository<Client> {
  constructor(dataSource: DataSource) {
    super(Client, dataSource.createEntityManager());
  }

  async findById(id: number): Promise<Client> {
    const client = await this.findOne({ where: { id } });
    if (!client) {
      throw new Error(`Client with ID ${id} not found`);
    }
    return client;
  }

  async findByReferenceId(referenceId: string): Promise<Client> {
    const client = await this.findOne({ where: { referenceId } });
    if (!client) {
      throw new Error(`Client with reference ID ${referenceId} not found`);
    }
    return client;
  }

  async findAll(): Promise<Client[]> {
    return this.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async findByName(name: string): Promise<Client[]> {
    return this.createQueryBuilder('client')
      .where('client.name ILIKE :name', { name: `%${name}%` })
      .orderBy('client.name', 'ASC')
      .getMany();
  }
}

// Factory function for dependency injection
export const createClientRepository = (dataSource: DataSource) => {
  return new ClientRepository(dataSource);
}; 
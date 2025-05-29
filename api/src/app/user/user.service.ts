import { User, USER_REPOSITORY, UserRepository } from '@rosa/api-core';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto, PaginatedResult } from '@rosa/api-core';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: UserRepository // Use the custom UserRepository
  ) {
    // console.log('Repository methods:', Object.keys(this.userRepository));
  }

  // Method to create a new user
  async createUser(data: Partial<User>): Promise<User> {
    if (data.password) {
      // Hash password before saving
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(data.password, salt);
    }

    const newUser = this.userRepository.create(data);
    return this.userRepository.save(newUser);
  }

  // Method to find a user by ID
  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    console.log('User found:', user);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // Method to find a user by username (email)
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { email: username },
      select: ['id', 'email', 'password', 'name', 'roles'] // Include password field for auth
    });
  }

  // Method to find all users with pagination
  async findAllUsers(pagination: PaginationDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10 } = pagination;
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
    return { data, total, page, limit };
  }

  // Method to update a user by ID
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findUserById(id);
    
    if (data.password) {
      // Hash new password if it's being updated
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(data.password, salt);
    }

    const updatedUser = Object.assign(user, data);
    return this.userRepository.save(updatedUser);
  }

  // Method to delete a user by ID
  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}

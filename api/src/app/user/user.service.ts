import { User, USER_REPOSITORY, UserRepository } from '@rosa/api-core';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: UserRepository // Use the custom UserRepository
  ) {
    // console.log('Repository methods:', Object.keys(this.userRepository));
  }

  // Method to create a new user
  async createUser(data: Partial<User>): Promise<User> {
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

  // Method to find all users
  async findAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }
}

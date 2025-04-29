// src/app/user/user.controller.ts

import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@rosa/api-core';

@Controller('users')
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {
    console.log('UserService injected:', this.userService); // 👀 check if it's undefined
  }

  @Get()
  getUsers(): Promise<User[]> {
    return this.userService.findAllUsers();
  }

  @Get(':id')
  getUserById(@Param('id') id: string): Promise<User> {
    return this.userService.findUserById(id);
  }

  @Post()
  createUser(@Body() body: Partial<User>) {
    return this.userService.createUser(body);
  }
}

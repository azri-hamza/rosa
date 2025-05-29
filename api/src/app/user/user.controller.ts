// src/app/user/user.controller.ts

import { Controller, Get, Post, Body, Param, Inject, Put, Patch, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@rosa/api-core';
import { PaginationDto, PaginatedResult } from '@rosa/api-core';

@Controller('users')
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {
    console.log('UserService injected:', this.userService); // 👀 check if it's undefined
  }

  @Get()
  getUsers(@Query() pagination: PaginationDto): Promise<PaginatedResult<User>> {
    return this.userService.findAllUsers(pagination);
  }

  @Get(':id')
  getUserById(@Param('id') id: string): Promise<User> {
    return this.userService.findUserById(id);
  }

  @Post()
  createUser(@Body() body: Partial<User>) {
    return this.userService.createUser(body);
  }

  @Put(':id')
  updateUser(@Param('id') id: string, @Body() body: Partial<User>): Promise<User> {
    return this.userService.updateUser(id, body);
  }

  @Patch(':id')
  partialUpdateUser(@Param('id') id: string, @Body() body: Partial<User>): Promise<User> {
    return this.userService.updateUser(id, body);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string): Promise<void> {
    return this.userService.deleteUser(id);
  }

}

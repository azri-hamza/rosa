import { Controller, Get, Post, Body, Param, Put, Patch, Delete, Query, Inject, UseGuards } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { User, PaginationDto } from '@rosa/api-core';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard)
export class UserV1Controller {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Get()
  async getUsers(@Query() pagination: PaginationDto): Promise<{
    data: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    meta: { version: string; timestamp: string };
  }> {
    const result = await this.userService.findAllUsers(pagination);
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    
    return {
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<{
    data: User;
    meta: { version: string; timestamp: string };
  }> {
    const user = await this.userService.findUserById(id);
    return {
      data: user,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Post()
  async createUser(@Body() body: Partial<User>): Promise<{
    data: User;
    meta: { version: string; timestamp: string };
  }> {
    const user = await this.userService.createUser(body);
    return {
      data: user,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() body: Partial<User>): Promise<{
    data: User;
    meta: { version: string; timestamp: string };
  }> {
    const user = await this.userService.updateUser(id, body);
    return {
      data: user,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Patch(':id')
  async partialUpdateUser(@Param('id') id: string, @Body() body: Partial<User>): Promise<{
    data: User;
    meta: { version: string; timestamp: string };
  }> {
    const user = await this.userService.updateUser(id, body);
    return {
      data: user,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<{
    message: string;
    meta: { version: string; timestamp: string };
  }> {
    await this.userService.deleteUser(id);
    return {
      message: 'User deleted successfully',
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
      }
    };
  }
} 
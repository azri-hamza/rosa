import { Controller, Get, Inject } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('db')
  async getDatabaseHealth() {
    return this.healthService.getDatabaseHealth();
  }

  @Get('full')
  async getFullHealth() {
    return this.healthService.getFullHealth();
  }
} 
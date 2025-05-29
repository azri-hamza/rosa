import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version?: string;
}

export interface DatabaseHealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  connectionStatus: 'connected' | 'disconnected' | 'unavailable';
  error?: string;
}

export interface FullHealthStatus {
  application: HealthStatus;
  database: DatabaseHealthStatus;
  overall: 'healthy' | 'unhealthy';
}

@Injectable()
export class HealthService {
  constructor(
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  async getHealth(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  async getDatabaseHealth(): Promise<DatabaseHealthStatus> {
    try {
      // Test database connection by running a simple query
      await this.dataSource.query('SELECT 1');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        connectionStatus: 'connected',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        connectionStatus: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  async getFullHealth(): Promise<FullHealthStatus> {
    const application = await this.getHealth();
    const database = await this.getDatabaseHealth();
    
    const overall = application.status === 'healthy' && database.status === 'healthy' 
      ? 'healthy' 
      : 'unhealthy';

    return {
      application,
      database,
      overall,
    };
  }
} 
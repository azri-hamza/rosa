const { DataSource, DataSourceOptions } = require('typeorm');
const { config } = require('dotenv');
const { join } = require('path');

// Load environment variables from .env file in the api project
config({ path: join(process.cwd(), 'api', '.env') });

const dataSourceOptions = {
  type: 'postgres',
  host: process.env['DATABASE_HOST'] || 'localhost',
  port: parseInt(process.env['DATABASE_PORT'] || '5432', 10),
  username: process.env['DATABASE_USER'] || 'postgres',
  password: process.env['DATABASE_PASSWORD'] || 'postgres',
  database: process.env['DATABASE_NAME'] || 'rosa_db',
  entities: [join(__dirname, './entities/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, './migrations/**/*{.ts,.js}')],
  migrationsTransactionMode: 'each',
  synchronize: false,
  logging: true,
};

const dataSource = new DataSource(dataSourceOptions);
module.exports = dataSource; 
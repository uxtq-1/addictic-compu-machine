import knex from 'knex';
import { logger } from './logger';

const config = {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'cafeteria_lite_dev',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

export const db = knex(config);

// Connection pool monitoring
db.on('query', (query) => {
  logger.debug('Query', { sql: query.sql });
});

db.on('query-error', (error, query) => {
  logger.error('Query error', { error, sql: query.sql });
});

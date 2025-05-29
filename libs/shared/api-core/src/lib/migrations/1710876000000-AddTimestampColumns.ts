import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimestampColumns1710876000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add timestamp columns to product table
        await queryRunner.query(`
            ALTER TABLE "product"
            ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "product"
            DROP COLUMN IF EXISTS "created_at",
            DROP COLUMN IF EXISTS "updated_at",
            DROP COLUMN IF EXISTS "deleted_at";
        `);
    }
} 
import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePricePrecision1748900000000 implements MigrationInterface {
    name = 'UpdatePricePrecision1748900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update product.net_price to have 3 decimal places
        await queryRunner.query(`
            ALTER TABLE "product" 
            ALTER COLUMN "net_price" TYPE DECIMAL(10,3)
        `);

        // Update delivery_note_item price fields to have 3 decimal places
        await queryRunner.query(`
            ALTER TABLE "delivery_note_item" 
            ALTER COLUMN "unit_price" TYPE DECIMAL(10,3),
            ALTER COLUMN "total_price" TYPE DECIMAL(10,3),
            ALTER COLUMN "vat_amount" TYPE DECIMAL(10,3),
            ALTER COLUMN "gross_total_price" TYPE DECIMAL(10,3)
        `);

        // Update quote_item price fields to have 3 decimal places
        await queryRunner.query(`
            ALTER TABLE "quote_item" 
            ALTER COLUMN "unit_price" TYPE DECIMAL(10,3),
            ALTER COLUMN "total_price" TYPE DECIMAL(10,3)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert product.net_price to have 2 decimal places
        await queryRunner.query(`
            ALTER TABLE "product" 
            ALTER COLUMN "net_price" TYPE DECIMAL(10,2)
        `);

        // Revert delivery_note_item price fields to have 2 decimal places
        await queryRunner.query(`
            ALTER TABLE "delivery_note_item" 
            ALTER COLUMN "unit_price" TYPE DECIMAL(10,2),
            ALTER COLUMN "total_price" TYPE DECIMAL(10,2),
            ALTER COLUMN "vat_amount" TYPE DECIMAL(10,2),
            ALTER COLUMN "gross_total_price" TYPE DECIMAL(10,2)
        `);

        // Revert quote_item price fields to have 2 decimal places
        await queryRunner.query(`
            ALTER TABLE "quote_item" 
            ALTER COLUMN "unit_price" TYPE DECIMAL(10,2),
            ALTER COLUMN "total_price" TYPE DECIMAL(10,2)
        `);
    }
} 
import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameUnitPriceAndAddGrossUnitPrice1748800001000 implements MigrationInterface {
    name = 'RenameUnitPriceAndAddGrossUnitPrice1748800001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename unit_price to net_unit_price
        await queryRunner.renameColumn('delivery_note_item', 'unit_price', 'net_unit_price');

        // Add gross_unit_price column
        await queryRunner.query(`
            ALTER TABLE "delivery_note_item" 
            ADD COLUMN "gross_unit_price" decimal(10,3) NOT NULL DEFAULT 0,
            ADD CONSTRAINT "CHK_gross_unit_price_non_negative" CHECK ("gross_unit_price" >= 0)
        `);

        // Update existing records to set gross_unit_price based on net_unit_price and vat_rate
        await queryRunner.query(`
            UPDATE "delivery_note_item"
            SET "gross_unit_price" = ROUND("net_unit_price" * (1 + COALESCE("vat_rate", 0)), 3)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the gross_unit_price column
        await queryRunner.dropColumn('delivery_note_item', 'gross_unit_price');

        // Rename net_unit_price back to unit_price
        await queryRunner.renameColumn('delivery_note_item', 'net_unit_price', 'unit_price');
    }
} 
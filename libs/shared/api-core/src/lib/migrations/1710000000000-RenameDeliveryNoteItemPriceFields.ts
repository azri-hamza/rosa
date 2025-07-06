import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameDeliveryNoteItemPriceFields1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, rename net_unit_price to unit_price_temp to avoid conflicts
    await queryRunner.query(`
      ALTER TABLE "delivery_note_item" 
      RENAME COLUMN "net_unit_price" TO "unit_price_temp"
    `);

    // Then rename discounted_unit_price to net_unit_price
    await queryRunner.query(`
      ALTER TABLE "delivery_note_item" 
      RENAME COLUMN "discounted_unit_price" TO "net_unit_price"
    `);

    // Finally rename unit_price_temp to net_unit_price
    await queryRunner.query(`
      ALTER TABLE "delivery_note_item" 
      RENAME COLUMN "unit_price_temp" TO "unit_price"
    `);

    // Update comments
    await queryRunner.query(`
      COMMENT ON COLUMN "delivery_note_item"."unit_price" IS 'Unit price before discount'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "delivery_note_item"."net_unit_price" IS 'Unit price after discount (net price)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // First, rename unit_price to net_unit_price_temp to avoid conflicts
    await queryRunner.query(`
      ALTER TABLE "delivery_note_item" 
      RENAME COLUMN "unit_price" TO "net_unit_price_temp"
    `);

    // Then rename net_unit_price to discounted_unit_price
    await queryRunner.query(`
      ALTER TABLE "delivery_note_item" 
      RENAME COLUMN "net_unit_price" TO "discounted_unit_price"
    `);

    // Finally rename net_unit_price_temp to net_unit_price
    await queryRunner.query(`
      ALTER TABLE "delivery_note_item" 
      RENAME COLUMN "net_unit_price_temp" TO "net_unit_price"
    `);

    // Restore original comments
    await queryRunner.query(`
      COMMENT ON COLUMN "delivery_note_item"."net_unit_price" IS 'Net unit price before VAT and discount'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "delivery_note_item"."discounted_unit_price" IS 'Net unit price after discount'
    `);
  }
} 
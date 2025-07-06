import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDiscountFields1749734529590 implements MigrationInterface {
    name = 'AddDiscountFields1749734529590'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add discount fields to delivery_note_item
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD "discount_percentage" numeric(5,2) DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note_item"."discount_percentage" IS 'Line item discount percentage'`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD "discount_amount" numeric(10,3) DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note_item"."discount_amount" IS 'Line item discount amount'`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD "discounted_unit_price" numeric(10,3) DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note_item"."discounted_unit_price" IS 'Net unit price after discount'`);
        
        // Add global discount fields to delivery_note
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD "global_discount_percentage" numeric(5,2) DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note"."global_discount_percentage" IS 'Global discount percentage applied to net total'`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD "global_discount_amount" numeric(10,3) DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note"."global_discount_amount" IS 'Global discount amount'`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD "net_total_before_global_discount" numeric(10,3) DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note"."net_total_before_global_discount" IS 'Net total before global discount'`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD "net_total_after_global_discount" numeric(10,3) DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note"."net_total_after_global_discount" IS 'Net total after global discount'`);
        
        // Update comments for existing fields
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note_item"."net_unit_price" IS 'Net unit price before VAT and discount'`);
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note_item"."gross_unit_price" IS 'Gross unit price including VAT (after discount)'`);
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note_item"."total_price" IS 'Net total price before VAT (after discount)'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert comments for existing fields
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note_item"."total_price" IS 'Net total price before VAT'`);
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note_item"."gross_unit_price" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "delivery_note_item"."net_unit_price" IS 'Net unit price before VAT'`);
        
        // Remove global discount fields from delivery_note
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP COLUMN "net_total_after_global_discount"`);
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP COLUMN "net_total_before_global_discount"`);
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP COLUMN "global_discount_amount"`);
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP COLUMN "global_discount_percentage"`);
        
        // Remove discount fields from delivery_note_item
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP COLUMN "discounted_unit_price"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP COLUMN "discount_amount"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP COLUMN "discount_percentage"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerformanceIndexes1751836159583 implements MigrationInterface {
    name = 'AddPerformanceIndexes1751836159583'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add indexes for frequently queried fields
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_status" ON "delivery_note" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_delivery_date" ON "delivery_note" ("delivery_date")`);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_year_sequence" ON "delivery_note" ("year", "sequence_number")`);
        await queryRunner.query(`CREATE INDEX "IDX_product_name" ON "product" ("name")`);
        await queryRunner.query(`CREATE INDEX "IDX_product_code" ON "product" ("product_code")`);
        await queryRunner.query(`CREATE INDEX "IDX_client_name" ON "clients" ("name")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_email" ON "user" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_vat_rate_active" ON "vat_rates" ("is_active")`);
        await queryRunner.query(`CREATE INDEX "IDX_vat_rate_default" ON "vat_rates" ("is_default")`);
    }
    
    public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_delivery_note_status"`);
    await queryRunner.query(`DROP INDEX "IDX_delivery_note_delivery_date"`);
    await queryRunner.query(`DROP INDEX "IDX_delivery_note_year_sequence"`);
    await queryRunner.query(`DROP INDEX "IDX_product_name"`);
    await queryRunner.query(`DROP INDEX "IDX_product_code"`);
    await queryRunner.query(`DROP INDEX "IDX_client_name"`);
    await queryRunner.query(`DROP INDEX "IDX_user_email"`);
    await queryRunner.query(`DROP INDEX "IDX_vat_rate_active"`);
    await queryRunner.query(`DROP INDEX "IDX_vat_rate_default"`);
    }

}

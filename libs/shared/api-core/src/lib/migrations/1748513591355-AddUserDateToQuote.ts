import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserDateToQuote1748513591355 implements MigrationInterface {
    name = 'AddUserDateToQuote1748513591355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before adding it
        const hasColumn = await queryRunner.hasColumn('quote', 'user_date');
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "quote" ADD "user_date" date`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before dropping it
        const hasColumn = await queryRunner.hasColumn('quote', 'user_date');
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "quote" DROP COLUMN "user_date"`);
        }
    }
}

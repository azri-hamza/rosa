import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateClientEntity1747918905842 implements MigrationInterface {
    name = 'UpdateClientEntity1747918905842'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "clients" DROP CONSTRAINT "UQ_dee191292bf46626dfb722269c7"
        `);
        await queryRunner.query(`
            ALTER TABLE "clients" DROP COLUMN "referenceId"
        `);
        await queryRunner.query(`
            ALTER TABLE "clients" DROP COLUMN "taxIdentificationNumber"
        `);
        await queryRunner.query(`
            ALTER TABLE "clients" DROP COLUMN "phoneNumber"
        `);
        await queryRunner.query(`
            ALTER TABLE "clients"
            ADD "reference_id" uuid NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "clients"
            ADD CONSTRAINT "UQ_b954a34ef95f1b22f897deee309" UNIQUE ("reference_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "clients"
            ADD "tax_identification_number" character varying(50)
        `);
        await queryRunner.query(`
            ALTER TABLE "clients"
            ADD "phone_number" character varying(20)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "clients" DROP COLUMN "phone_number"
        `);
        await queryRunner.query(`
            ALTER TABLE "clients" DROP COLUMN "tax_identification_number"
        `);
        await queryRunner.query(`
            ALTER TABLE "clients" DROP CONSTRAINT "UQ_b954a34ef95f1b22f897deee309"
        `);
        await queryRunner.query(`
            ALTER TABLE "clients" DROP COLUMN "reference_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "clients"
            ADD "phoneNumber" character varying(20)
        `);
        await queryRunner.query(`
            ALTER TABLE "clients"
            ADD "taxIdentificationNumber" character varying(50)
        `);
        await queryRunner.query(`
            ALTER TABLE "clients"
            ADD "referenceId" uuid NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "clients"
            ADD CONSTRAINT "UQ_dee191292bf46626dfb722269c7" UNIQUE ("referenceId")
        `);
    }

}

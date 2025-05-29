import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClientEntity1747857007985 implements MigrationInterface {
    name = 'CreateClientEntity1747857007985'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "clients" (
                "id" SERIAL NOT NULL,
                "referenceId" uuid NOT NULL,
                "name" character varying NOT NULL,
                "taxIdentificationNumber" character varying(50),
                "phoneNumber" character varying(20),
                "address" character varying NOT NULL,
                CONSTRAINT "UQ_dee191292bf46626dfb722269c7" UNIQUE ("referenceId"),
                CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "clients"
        `);
    }

}

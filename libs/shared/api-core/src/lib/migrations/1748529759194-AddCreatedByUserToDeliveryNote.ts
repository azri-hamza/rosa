import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedByUserToDeliveryNote1748529759194 implements MigrationInterface {
    name = 'AddCreatedByUserToDeliveryNote1748529759194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP CONSTRAINT "FK_delivery_note_item_delivery_note"`);
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP CONSTRAINT "FK_delivery_note_client"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_delivery_note_item_delivery_note"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_delivery_note_item_product"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_delivery_note_client"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_delivery_note_year"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_delivery_note_delivery_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_delivery_note_status"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD "created_by_user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "product_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "product_id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "quote" ALTER COLUMN "reference_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "quote" ALTER COLUMN "reference_id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP CONSTRAINT "PK_delivery_note_item_id"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD CONSTRAINT "PK_4266986290f47fdb8c77c07641e" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP COLUMN "delivery_note_id"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD "delivery_note_id" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP COLUMN "product_id"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD "product_id" bigint`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP CONSTRAINT "PK_delivery_note_id"`);
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD CONSTRAINT "PK_b2e8966e12465b34021b9a2c6eb" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ALTER COLUMN "reference_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ALTER COLUMN "reference_id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ALTER COLUMN "delivery_date" SET DEFAULT ('now'::text)::date`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD CONSTRAINT "FK_750fadcc87b9eae4f9c9c148534" FOREIGN KEY ("delivery_note_id") REFERENCES "delivery_note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD CONSTRAINT "FK_7d1bc80ae8417b3292076804208" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD CONSTRAINT "FK_b398a4cda6ab791765356ad9201" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD CONSTRAINT "FK_0e57b344197b6062e60d87bba76" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP CONSTRAINT "FK_0e57b344197b6062e60d87bba76"`);
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP CONSTRAINT "FK_b398a4cda6ab791765356ad9201"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP CONSTRAINT "FK_7d1bc80ae8417b3292076804208"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP CONSTRAINT "FK_750fadcc87b9eae4f9c9c148534"`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ALTER COLUMN "delivery_date" SET DEFAULT CURRENT_DATE`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ALTER COLUMN "reference_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ALTER COLUMN "reference_id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP CONSTRAINT "PK_b2e8966e12465b34021b9a2c6eb"`);
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD CONSTRAINT "PK_delivery_note_id" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "delivery_note" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP COLUMN "product_id"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD "product_id" integer`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP COLUMN "delivery_note_id"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD "delivery_note_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP CONSTRAINT "PK_4266986290f47fdb8c77c07641e"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD CONSTRAINT "PK_delivery_note_item_id" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "quote" ALTER COLUMN "reference_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "quote" ALTER COLUMN "reference_id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "product_id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "product_id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP COLUMN "created_by_user_id"`);
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_status" ON "delivery_note" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_delivery_date" ON "delivery_note" ("delivery_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_year" ON "delivery_note" ("year") `);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_client" ON "delivery_note" ("client_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_item_product" ON "delivery_note_item" ("product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_item_delivery_note" ON "delivery_note_item" ("delivery_note_id") `);
        await queryRunner.query(`ALTER TABLE "delivery_note" ADD CONSTRAINT "FK_delivery_note_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" ADD CONSTRAINT "FK_delivery_note_item_delivery_note" FOREIGN KEY ("delivery_note_id") REFERENCES "delivery_note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

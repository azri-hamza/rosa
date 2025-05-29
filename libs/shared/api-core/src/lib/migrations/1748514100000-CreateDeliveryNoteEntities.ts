import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDeliveryNoteEntities1748514100000 implements MigrationInterface {
    name = 'CreateDeliveryNoteEntities1748514100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create delivery_note table
        await queryRunner.query(`
            CREATE TABLE "delivery_note" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "reference_id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "year" integer NOT NULL DEFAULT EXTRACT(year FROM CURRENT_DATE),
                "sequence_number" integer NOT NULL DEFAULT 1,
                "delivery_date" date NOT NULL DEFAULT CURRENT_DATE,
                "delivery_address" text,
                "notes" text,
                "status" character varying(20) NOT NULL DEFAULT 'pending',
                "client_id" integer,
                CONSTRAINT "UQ_delivery_note_reference_id" UNIQUE ("reference_id"),
                CONSTRAINT "PK_delivery_note_id" PRIMARY KEY ("id")
            )
        `);

        // Create delivery_note_item table
        await queryRunner.query(`
            CREATE TABLE "delivery_note_item" (
                "id" SERIAL NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "product_name" character varying NOT NULL DEFAULT '',
                "description" text DEFAULT '',
                "quantity" integer NOT NULL DEFAULT 0,
                "delivered_quantity" integer NOT NULL DEFAULT 0,
                "unit_price" numeric(10,2) NOT NULL DEFAULT 0,
                "total_price" numeric(10,2) NOT NULL DEFAULT 0,
                "delivery_note_id" integer NOT NULL,
                "product_id" integer,
                CONSTRAINT "PK_delivery_note_item_id" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraint for delivery_note_item -> delivery_note
        await queryRunner.query(`
            ALTER TABLE "delivery_note_item" 
            ADD CONSTRAINT "FK_delivery_note_item_delivery_note" 
            FOREIGN KEY ("delivery_note_id") REFERENCES "delivery_note"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add foreign key constraint for delivery_note -> clients (corrected table name)
        await queryRunner.query(`
            ALTER TABLE "delivery_note" 
            ADD CONSTRAINT "FK_delivery_note_client" 
            FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Note: Foreign key constraint for product table is commented out
        // until product table exists in the database
        // TODO: Add this constraint once product table exists:
        // ALTER TABLE "delivery_note_item" 
        // ADD CONSTRAINT "FK_delivery_note_item_product" 
        // FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION

        // Create indexes for better performance
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_client" ON "delivery_note" ("client_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_year" ON "delivery_note" ("year")`);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_delivery_date" ON "delivery_note" ("delivery_date")`);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_status" ON "delivery_note" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_item_delivery_note" ON "delivery_note_item" ("delivery_note_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_note_item_product" ON "delivery_note_item" ("product_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "delivery_note" DROP CONSTRAINT "FK_delivery_note_client"`);
        await queryRunner.query(`ALTER TABLE "delivery_note_item" DROP CONSTRAINT "FK_delivery_note_item_delivery_note"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_delivery_note_item_product"`);
        await queryRunner.query(`DROP INDEX "IDX_delivery_note_item_delivery_note"`);
        await queryRunner.query(`DROP INDEX "IDX_delivery_note_status"`);
        await queryRunner.query(`DROP INDEX "IDX_delivery_note_delivery_date"`);
        await queryRunner.query(`DROP INDEX "IDX_delivery_note_year"`);
        await queryRunner.query(`DROP INDEX "IDX_delivery_note_client"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "delivery_note_item"`);
        await queryRunner.query(`DROP TABLE "delivery_note"`);
    }
} 
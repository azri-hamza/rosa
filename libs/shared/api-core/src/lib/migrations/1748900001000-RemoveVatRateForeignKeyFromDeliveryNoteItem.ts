import { MigrationInterface, QueryRunner, TableForeignKey, TableColumn } from "typeorm";

export class RemoveVatRateForeignKeyFromDeliveryNoteItem1748900001000 implements MigrationInterface {
    name = 'RemoveVatRateForeignKeyFromDeliveryNoteItem1748900001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraint for vat_rate_id
        const table = await queryRunner.getTable("delivery_note_item");
        const foreignKey = table!.foreignKeys.find(fk => fk.columnNames.indexOf("vat_rate_id") !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey("delivery_note_item", foreignKey);
        }

        // Drop the vat_rate_id column
        await queryRunner.dropColumn("delivery_note_item", "vat_rate_id");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add vat_rate_id column back
        await queryRunner.addColumn("delivery_note_item", new TableColumn({
            name: "vat_rate_id",
            type: "bigint",
            isNullable: true
        }));

        // Add foreign key constraint back
        await queryRunner.createForeignKey("delivery_note_item", new TableForeignKey({
            columnNames: ["vat_rate_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "vat_rates",
            onDelete: "SET NULL"
        }));
    }
} 
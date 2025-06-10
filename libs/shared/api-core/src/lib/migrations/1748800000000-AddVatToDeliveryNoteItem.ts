import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddVatToDeliveryNoteItem1748800000000 implements MigrationInterface {
    name = 'AddVatToDeliveryNoteItem1748800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add VAT rate column (stored for historical purposes)
        await queryRunner.addColumn("delivery_note_item", new TableColumn({
            name: "vat_rate",
            type: "decimal",
            precision: 5,
            scale: 4,
            isNullable: true,
            comment: "VAT rate applied to this item (stored for historical purposes)"
        }));

        // Add VAT amount column
        await queryRunner.addColumn("delivery_note_item", new TableColumn({
            name: "vat_amount",
            type: "decimal",
            precision: 10,
            scale: 2,
            default: 0,
            comment: "VAT amount calculated"
        }));

        // Add gross total price column
        await queryRunner.addColumn("delivery_note_item", new TableColumn({
            name: "gross_total_price",
            type: "decimal",
            precision: 10,
            scale: 2,
            default: 0,
            comment: "Total price including VAT"
        }));

        // Add vat_rate_id column for reference to VAT rate entity
        await queryRunner.addColumn("delivery_note_item", new TableColumn({
            name: "vat_rate_id",
            type: "bigint",
            isNullable: true
        }));

        // Add foreign key constraint for vat_rate_id
        await queryRunner.createForeignKey("delivery_note_item", new TableForeignKey({
            columnNames: ["vat_rate_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "vat_rates",
            onDelete: "SET NULL"
        }));

        // Update comments for existing price columns
        await queryRunner.query(`
            COMMENT ON COLUMN delivery_note_item.unit_price IS 'Net unit price before VAT';
            COMMENT ON COLUMN delivery_note_item.total_price IS 'Net total price before VAT';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraint
        const table = await queryRunner.getTable("delivery_note_item");
        const foreignKey = table!.foreignKeys.find(fk => fk.columnNames.indexOf("vat_rate_id") !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey("delivery_note_item", foreignKey);
        }

        // Drop columns
        await queryRunner.dropColumn("delivery_note_item", "vat_rate_id");
        await queryRunner.dropColumn("delivery_note_item", "gross_total_price");
        await queryRunner.dropColumn("delivery_note_item", "vat_amount");
        await queryRunner.dropColumn("delivery_note_item", "vat_rate");

        // Restore original comments
        await queryRunner.query(`
            COMMENT ON COLUMN delivery_note_item.unit_price IS NULL;
            COMMENT ON COLUMN delivery_note_item.total_price IS NULL;
        `);
    }
} 
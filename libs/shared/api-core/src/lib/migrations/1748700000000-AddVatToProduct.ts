import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";

export class AddVatToProduct1748700000000 implements MigrationInterface {
    name = 'AddVatToProduct1748700000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add net_price column to product table
        await queryRunner.addColumn("product", new TableColumn({
            name: "net_price",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: "Net price before VAT"
        }));

        // Add vat_rate_id column to product table
        await queryRunner.addColumn("product", new TableColumn({
            name: "vat_rate_id",
            type: "bigint",
            isNullable: true
        }));

        // Add foreign key constraint for vat_rate_id
        await queryRunner.createForeignKey("product", new TableForeignKey({
            columnNames: ["vat_rate_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "vat_rates",
            onDelete: "SET NULL"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraint
        const table = await queryRunner.getTable("product");
        const foreignKey = table!.foreignKeys.find(fk => fk.columnNames.indexOf("vat_rate_id") !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey("product", foreignKey);
        }

        // Drop columns
        await queryRunner.dropColumn("product", "vat_rate_id");
        await queryRunner.dropColumn("product", "net_price");
    }
} 
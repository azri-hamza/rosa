import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateVatRateEntity1748600000000 implements MigrationInterface {
    name = 'CreateVatRateEntity1748600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "vat_rates",
                columns: [
                    {
                        name: "id",
                        type: "bigint",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "name",
                        type: "varchar",
                        length: "100",
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: "rate",
                        type: "decimal",
                        precision: 5,
                        scale: 4,
                        isNullable: false,
                        comment: "VAT rate as decimal (e.g., 0.2000 for 20%)",
                    },
                    {
                        name: "percentage",
                        type: "decimal",
                        precision: 5,
                        scale: 2,
                        isNullable: false,
                        comment: "VAT rate as percentage (e.g., 20.00 for 20%)",
                    },
                    {
                        name: "description",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "is_active",
                        type: "boolean",
                        default: true,
                        isNullable: false,
                    },
                    {
                        name: "is_default",
                        type: "boolean",
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: "country_code",
                        type: "varchar",
                        length: "10",
                        isNullable: true,
                        comment: "Country code for country-specific VAT rates",
                    },
                    {
                        name: "effective_from",
                        type: "timestamp with time zone",
                        isNullable: true,
                        comment: "Date when this VAT rate becomes effective",
                    },
                    {
                        name: "effective_to",
                        type: "timestamp with time zone",
                        isNullable: true,
                        comment: "Date when this VAT rate expires",
                    },
                    {
                        name: "created_at",
                        type: "timestamp with time zone",
                        default: "now()",
                        isNullable: false,
                    },
                    {
                        name: "updated_at",
                        type: "timestamp with time zone",
                        default: "now()",
                        isNullable: false,
                    },
                    {
                        name: "deleted_at",
                        type: "timestamp with time zone",
                        isNullable: true,
                    },
                ],
                indices: [
                    {
                        name: "IDX_vat_rates_name",
                        columnNames: ["name"],
                        isUnique: true,
                    },
                    {
                        name: "IDX_vat_rates_rate",
                        columnNames: ["rate"],
                    },
                    {
                        name: "IDX_vat_rates_is_active",
                        columnNames: ["is_active"],
                    },
                    {
                        name: "IDX_vat_rates_is_default",
                        columnNames: ["is_default"],
                    },
                    {
                        name: "IDX_vat_rates_country_code",
                        columnNames: ["country_code"],
                    },
                    {
                        name: "IDX_vat_rates_effective_dates",
                        columnNames: ["effective_from", "effective_to"],
                    },
                ],
            }),
            true
        );

        // Insert default VAT rates for Tunisia
        await queryRunner.query(`
            INSERT INTO vat_rates (name, rate, percentage, description, is_active, is_default, country_code) VALUES
            ('Standard Rate - Tunisia', 0.1900, 19.00, 'Standard VAT rate for Tunisia', true, true, 'TN'),
            ('Reduced Rate - Tunisia', 0.1300, 13.00, 'Reduced VAT rate for Tunisia', true, false, 'TN'),
            ('Low Rate - Tunisia', 0.0700, 7.00, 'Low VAT rate for Tunisia', true, false, 'TN'),
            ('Zero Rate - Tunisia', 0.0000, 0.00, 'Zero VAT rate for exempt items in Tunisia', true, false, 'TN')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop table (this will automatically drop all indexes)
        await queryRunner.dropTable("vat_rates");
    }
} 
import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from 'bcrypt';

export class AddPasswordAndRolesToUser1747918905843 implements MigrationInterface {
    name = 'AddPasswordAndRolesToUser1747918905843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add password column with a default hashed value
        const salt = await bcrypt.genSalt();
        const defaultPassword = await bcrypt.hash('changeme', salt);
        
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN "password" character varying NOT NULL DEFAULT '${defaultPassword}'
        `);

        // Remove the default constraint after adding the column
        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "password" DROP DEFAULT
        `);

        // Add roles column as a varchar array with default empty array
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN "roles" character varying[] NOT NULL DEFAULT '{}'
        `);

        // Add audit columns if they don't exist
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            DROP COLUMN "password",
            DROP COLUMN "roles",
            DROP COLUMN "created_at",
            DROP COLUMN "updated_at",
            DROP COLUMN "deleted_at"
        `);
    }
} 
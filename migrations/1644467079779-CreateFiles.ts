import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFiles1644467079779 implements MigrationInterface {
    name = 'CreateFiles1644467079779';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `create table if not exists files( id int auto_increment primary key, fileName varchar(255) not null, originFilePath varchar(255) not null, convertedFilePath varchar(255) not null, authorId int null, createdAt datetime default CURRENT_TIMESTAMP not null, updatedAt datetime default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP not null);`,
        );
        await queryRunner.query(
            `create index files_authorId_index on files(authorId); `,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX `files_authorId_index` ON `files`');
        await queryRunner.query('DROP TABLE `files`');
    }
}

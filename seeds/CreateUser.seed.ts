import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';

import { User } from '../src/user/entities/user.entity';

export default class CreateUser implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    console.log(`run seeder`);
    await connection
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          name: 'admin',
          username: 'admin',
          email: 'admin@admin.com',
          roles: ['ADMIN'],
          password: '$2b$10$Pul9uVkkqr0DLRpwVht/AeJ9Abcy7EQhxHgnUWp1XfhHgP/Kv22NK',
          isAccountDisabled: false,
        },
      ])
      .execute();
  }
}

import { NotFoundException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { File } from '../entities/file.entity';

@EntityRepository(File)
export class FileRepository extends Repository<File> {
  async getById(id: number): Promise<File> {
    const file = await this.findOne(id);
    if (!file) {
      throw new NotFoundException();
    }

    return file;
  }
}

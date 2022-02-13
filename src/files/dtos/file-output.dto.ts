import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { AuthorOutput } from './author-output.dto';

export class FileOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  fileName: string;

  @Expose()
  @ApiProperty()
  originFilePath: string;

  @Expose()
  @ApiProperty()
  convertedFilePath: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  @Expose()
  @Type(() => AuthorOutput)
  @ApiProperty()
  author: AuthorOutput;
}

export class FileConvertedOutput {
  @Expose()
  @ApiProperty()
  originFilePath: string;

  @Expose()
  @ApiProperty()
  convertedFilePath: string;
}

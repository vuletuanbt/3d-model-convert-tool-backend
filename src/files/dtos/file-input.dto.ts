import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFileInput {
  @ApiProperty()
  // @IsNotEmpty()
  // @IsString()
  name: string;

  // @ApiProperty()
  // // @IsNotEmpty()
  // file: any;
}

export class UpdateFileInput {
  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  file: any;
}

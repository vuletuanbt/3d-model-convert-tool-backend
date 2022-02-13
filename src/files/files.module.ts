import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtAuthStrategy } from '../auth/strategies/jwt-auth.strategy';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { FileController } from './controllers/file.controller';
import { PublicController } from './controllers/public.controller';
import { FileRepository } from './repositories/file.repository';
import { FileService } from './services/file.service';

@Module({
  imports: [
    SharedModule,
    TypeOrmModule.forFeature([FileRepository]),
    UserModule,
  ],
  providers: [FileService, JwtAuthStrategy],
  controllers: [FileController, PublicController],
  exports: [FileService],
})
export class FileModule {}

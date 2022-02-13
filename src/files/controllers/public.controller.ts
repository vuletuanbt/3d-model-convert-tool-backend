import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import fsExtra from 'fs-extra';
import { join } from 'path';
import { Observable, of } from 'rxjs';

import { AppLogger } from '../../shared/logger/logger.service';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { FileService } from '../services/file.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly fileService: FileService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(PublicController.name);
  }

  @Get('converted/:userId/:fileName')
  async downloadConvertedFile(
    @ReqContext() ctx: RequestContext,
    @Param('fileName') fileName,
    @Param('userId') userId,
    @Res() res,
  ): Promise<Observable<any>> {
    const convertedFolder = this.fileService.getConvertFolder(userId);
    const file = `${convertedFolder}/${fileName}`;
    if (!fsExtra.existsSync(file)) {
      throw new BadRequestException('File not found');
    }
    return of(res.sendFile(join(process.cwd(), file)));
  }

  @Get('origin/:userId/:fileName')
  async downloadOriginFile(
    @ReqContext() ctx: RequestContext,
    @Param('fileName') fileName,
    @Param('userId') userId,
    @Res() res,
  ): Promise<Observable<any>> {
    const originFolder = this.fileService.getOriginFolder(userId);
    const file = `${originFolder}/${fileName}`;
    if (!fsExtra.existsSync(file)) {
      throw new BadRequestException('File not found');
    }
    return of(res.sendFile(join(process.cwd(), file)));
  }
}

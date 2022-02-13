import {
  BadRequestException,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '../../shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '../../shared/dtos/pagination-params.dto';
import { AppLogger } from '../../shared/logger/logger.service';
import { ReqContext } from '../../shared/request-context/req-context.decorator';
import { RequestContext } from '../../shared/request-context/request-context.dto';
import { fileUploadOptions } from '../configs/file';
import { FileOutput } from '../dtos/file-output.dto';
import { FileService } from '../services/file.service';

@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(FileController.name);
  }

  @Get()
  @ApiOperation({
    summary: 'Get files as a list API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([FileOutput]),
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async index(
    @ReqContext() ctx: RequestContext,
    @Query() query: PaginationParamsDto,
  ): Promise<BaseApiResponse<FileOutput[]>> {
    this.logger.log(ctx, `${this.index.name} was called`);

    const { files, count } = await this.fileService.getFiles(
      ctx,
      query.limit,
      query.offset,
    );

    return { data: files, meta: { count } };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get file by ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(FileOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  async show(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<FileOutput>> {
    this.logger.log(ctx, `${this.show.name} was called`);

    const file = await this.fileService.getFileById(ctx, id);
    return { data: file, meta: {} };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: SwaggerBaseApiResponse([FileOutput]),
  })
  @UseInterceptors(FileInterceptor('file', fileUploadOptions))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @ReqContext() ctx: RequestContext,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    if (await this.fileService.isMaximumUploadedFile(ctx)) {
      throw new BadRequestException("You've reached maximum uploaded file");
    }

    if (await this.fileService.isMaximumConvertedFile(ctx)) {
      throw new BadRequestException(
        "You've reached maximum converted file in this month",
      );
    }
    const data = await this.fileService.convert(ctx, file);
    return { data, meta: {} };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete file by id API',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  async deleteFile(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<void> {
    this.logger.log(ctx, `${this.deleteFile.name} was called`);

    const file = await this.fileService.getFileById(ctx, id);
    if (!file) {
      throw new BadRequestException(`The file with id ${id} doesnt exist`);
    }
    return this.fileService.deleteFile(ctx, file);
  }
}

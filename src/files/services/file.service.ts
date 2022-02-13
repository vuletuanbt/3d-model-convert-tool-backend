import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import decompress from 'decompress';
import fsExtra from 'fs-extra';
import gltfPipeline from 'gltf-pipeline';
import moment from 'moment';
import path from 'path';
import { Actor } from 'src/shared/acl/actor.constant';
import { RequestContext } from 'src/shared/request-context/request-context.dto';
import { UserService } from 'src/user/services/user.service';
import { Raw } from 'typeorm';

import { AppLogger } from '../../shared/logger/logger.service';
import { User } from '../../user/entities/user.entity';
import { CreateFileInput } from '../dtos/file-input.dto';
import { FileConvertedOutput, FileOutput } from '../dtos/file-output.dto';
import { File } from '../entities/file.entity';
import { FileRepository } from '../repositories/file.repository';
@Injectable()
export class FileService {
  constructor(
    private repository: FileRepository,
    private userService: UserService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(FileService.name);
  }

  async getFiles(
    ctx: RequestContext,
    limit: number,
    offset: number,
  ): Promise<{ files: FileOutput[]; count: number }> {
    this.logger.log(ctx, `${this.getFiles.name} was called`);

    const author: Actor = ctx.user;

    this.logger.log(ctx, `calling ${FileRepository.name}.findAndCount`);
    const [files, count] = await this.repository.findAndCount({
      where: {
        author,
      },
      take: limit,
      skip: offset,
      order: {
        createdAt: 'DESC',
      },
    });

    const filesOutput = plainToClass(FileOutput, files, {
      excludeExtraneousValues: true,
    });

    return { files: filesOutput, count };
  }

  async getFileById(ctx: RequestContext, id: number): Promise<FileOutput> {
    this.logger.log(ctx, `${this.getFileById.name} was called`);

    const actor: Actor = ctx.user;

    this.logger.log(ctx, `calling ${FileRepository.name}.getFileById`);
    const file = await this.repository.getById(id);

    return plainToClass(FileOutput, file, { excludeExtraneousValues: true });
  }

  async isMaximumUploadedFile(ctx: RequestContext): Promise<boolean> {
    const total = await this.getTotalUse(ctx);
    return total >= 100;
  }

  async isMaximumConvertedFile(ctx: RequestContext): Promise<boolean> {
    const total = await this.getTotalUseInThisMonth(ctx);
    console.log(`Total in this month: ${total}`);
    return total >= 20;
  }

  async getTotalUse(ctx: RequestContext): Promise<number> {
    const actor: Actor = ctx.user;
    const total = await this.repository.count({ authorId: actor.id });
    return total;
  }

  async getTotalUseInThisMonth(ctx: RequestContext): Promise<number> {
    const actor: Actor = ctx.user;
    const startOfMonth = moment(new Date())
      .startOf('month')
      .format('YYYY-MM-DD 00:00:000');
    const endOfMonth = moment(new Date())
      .endOf('month')
      .format('YYYY-MM-DD 23:59:59');
    const total = await this.repository.count({
      authorId: actor.id,
      createdAt: Raw(
        (alias) => `${alias} >= :startOfMonth && ${alias} <= :endOfMonth`,
        { startOfMonth, endOfMonth },
      ),
    });
    return total;
  }

  getFileType(file: Express.Multer.File) {
    const [, extension] = file.originalname.split('.');
    if (!['zip', 'glb'].includes(extension)) {
      return null;
    }
    return extension;
  }

  findInDir(dir: string, filter, fileList = []) {
    const files = fsExtra.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const fileStat = fsExtra.lstatSync(filePath);

      if (fileStat.isDirectory()) {
        this.findInDir(filePath, filter, fileList);
      } else if (filter.test(filePath)) {
        fileList.push(filePath);
      }
    });

    return fileList;
  }

  async convertToGlb(
    originFilePath: string,
    convertedFilePath: string,
    resourceDirectory: string,
  ): Promise<FileConvertedOutput> {
    const options = {
      resourceDirectory,
    };
    const gltfToGlb = gltfPipeline.gltfToGlb;
    const gltf = fsExtra.readJsonSync(originFilePath);
    const steam = await gltfToGlb(gltf, options);
    fsExtra.writeFileSync(convertedFilePath, steam.glb);
    return {
      originFilePath: this.trimDot(originFilePath),
      convertedFilePath: this.trimDot(convertedFilePath),
    };
  }

  trimDot(path) {
    return path.replace(/\.\/upload/g, '/upload');
  }

  async convertToGltf(
    originFilePath: string,
    convertedFilePath: string,
  ): Promise<FileConvertedOutput> {
    const glbToGltf = gltfPipeline.glbToGltf;
    const glb = fsExtra.readFileSync(originFilePath);
    const results = await glbToGltf(glb);
    fsExtra.writeJsonSync(convertedFilePath, results.gltf);
    return {
      originFilePath: this.trimDot(originFilePath),
      convertedFilePath: this.trimDot(convertedFilePath),
    };
  }

  getConvertFolder(userId: number): string {
    const root = './upload';
    if (!fsExtra.existsSync(root)) {
      fsExtra.mkdirSync(root);
    }
    const convertFolder = `${root}/converted`;
    if (!fsExtra.existsSync(convertFolder)) {
      fsExtra.mkdirSync(convertFolder);
    }

    const userFolder = `${convertFolder}/${userId}`;

    if (!fsExtra.existsSync(userFolder)) {
      fsExtra.mkdirSync(userFolder);
    }

    return userFolder;
  }

  getOriginFolder(userId: number): string {
    const root = './upload';
    if (!fsExtra.existsSync(root)) {
      fsExtra.mkdirSync(root);
    }
    const convertFolder = `${root}/origin`;
    if (!fsExtra.existsSync(convertFolder)) {
      fsExtra.mkdirSync(convertFolder);
    }

    const userFolder = `${convertFolder}/${userId}`;

    if (!fsExtra.existsSync(userFolder)) {
      fsExtra.mkdirSync(userFolder);
    }

    return userFolder;
  }

  async convert(
    ctx: RequestContext,
    originFile: Express.Multer.File,
  ): Promise<FileOutput> {
    this.logger.log(ctx, `${this.convert.name} was called`);
    const actor: Actor = ctx.user;

    let convertedFile = '';
    let filesPath: FileConvertedOutput | any = {};

    const userFile = `${this.getOriginFolder(actor.id)}/${originFile.filename}`;
    // move file to user folder
    fsExtra.moveSync(originFile.path, userFile);
    const convertedFileName = originFile.filename.split('.')[0];

    if (this.getFileType(originFile) == 'glb') {
      convertedFile = `${this.getConvertFolder(
        actor.id,
      )}/${convertedFileName}.gltf`;
      filesPath = await this.convertToGltf(userFile, convertedFile);
    }

    if (this.getFileType(originFile) == 'zip') {
      const upzipFolder = `${this.getOriginFolder(
        actor.id,
      )}/${convertedFileName}`;
      await decompress(userFile, upzipFolder);
      convertedFile = `${this.getConvertFolder(
        actor.id,
      )}/${convertedFileName}.glb`;
      const [decompressedFile] = this.findInDir(upzipFolder, /\.gltf$/);
      if (!decompressedFile) {
        fsExtra.remove(upzipFolder);
        fsExtra.remove(userFile);
        throw new HttpException(`Could not find .gltf`, HttpStatus.BAD_REQUEST);
      }

      filesPath = await this.convertToGlb(
        decompressedFile,
        convertedFile,
        upzipFolder,
      );
    }

    const file = plainToClass(File, {
      fileName: originFile.filename,
      author: plainToClass(User, ctx.user),
      ...(filesPath ?? {}),
    });

    this.logger.log(ctx, `calling ${FileRepository.name}.save`);
    const savedFile = await this.repository.save(file);

    return plainToClass(FileOutput, savedFile, {
      excludeExtraneousValues: true,
    });
  }

  async deleteFile(ctx: RequestContext, file: any) {
    // delete converted file
    fsExtra.remove(`.${file.convertedFilePath}`);
    const [fileName, fileType] = file.fileName.split('.');
    if (fileType == 'glb') {
      fsExtra.remove(`.${file.originFilePath}`);
    }

    if (fileType == 'zip') {
      const originFolder = this.getOriginFolder(ctx.user.id);
      fsExtra.remove(`${originFolder}/${file.fileName}`);
      fsExtra.remove(`${originFolder}/${fileName}`);
    }

    // delete origin file
    this.repository.remove(file);
  }
}

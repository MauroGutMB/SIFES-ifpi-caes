import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { validarAssinaturaArquivo } from './file-signature.util';

/** Pipe reutilizável para checar os magic bytes de um upload contra os mimeTypes esperados —
 * complementa o `ParseFilePipeBuilder.addFileTypeValidator`, que só compara o header
 * `Content-Type` (controlado pelo cliente, falsificável). */
@Injectable()
export class FileSignatureValidationPipe implements PipeTransform {
  constructor(private readonly mimeTypesPermitidos: string[]) {}

  transform(file?: Express.Multer.File) {
    if (
      file &&
      !validarAssinaturaArquivo(file.buffer, this.mimeTypesPermitidos)
    ) {
      throw new BadRequestException(
        'O conteúdo do arquivo não corresponde ao tipo declarado',
      );
    }
    return file;
  }
}

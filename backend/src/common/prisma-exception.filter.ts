import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

/**
 * Vários `findOne` usam `findUniqueOrThrow` direto pela conveniência de não checar `null`
 * manualmente — mas isso deixa o erro cru do Prisma (ex.: P2025) vazar como 500 genérico se
 * ninguém tratar. Esse filtro global converte os erros conhecidos do Prisma na resposta HTTP
 * correta, sem precisar de try/catch espalhado em cada service.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, message } = this.mapear(exception);
    response.status(status).json({ statusCode: status, message });
  }

  private mapear(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (exception.code) {
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Registro não encontrado',
        };
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Já existe um registro com esse valor único',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message:
            'Operação inválida: existem registros relacionados a este recurso',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro interno',
        };
    }
  }
}

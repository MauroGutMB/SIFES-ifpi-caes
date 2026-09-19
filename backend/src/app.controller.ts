import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiAutenticado } from './common/swagger-auth.decorator';

@Controller()
@ApiAutenticado()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health-check',
    description:
      'Rota simples de verificação de que a API está no ar. Exige autenticação (guard global).',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}

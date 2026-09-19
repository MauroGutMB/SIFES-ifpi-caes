import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';
import { LogAcao } from '../logs/log-acao.decorator';
import { ProfessoresService } from './professores.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { ProfessorCriadoDto, ProfessorDto } from './dto/professor.dto';

@ApiTags('professores')
@Roles(Role.ADMIN)
@Controller('professores')
export class ProfessoresController {
  constructor(private readonly service: ProfessoresService) {}

  @Post()
  @ApiOkResponse({ type: ProfessorCriadoDto })
  create(@Body() dto: CreateProfessorDto): Promise<ProfessorCriadoDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: ProfessorDto, isArray: true })
  findAll(): Promise<ProfessorDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @LogAcao(({ resultado }) => ({
    acao: 'Editou professor',
    alvo: (resultado as { nome?: string })?.nome ?? 'professor',
  }))
  update(@Param('id') id: string, @Body() dto: UpdateProfessorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @LogAcao(({ resultado }) => ({
    acao: 'Excluiu professor',
    alvo: (resultado as { nome?: string })?.nome ?? 'professor',
  }))
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

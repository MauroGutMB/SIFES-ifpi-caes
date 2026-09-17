import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';
import { AlunosService } from './alunos.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { VincularTurmaDto } from './dto/vincular-turma.dto';
import { AlunoCriadoDto, AlunoDto } from './dto/aluno.dto';

@ApiTags('alunos')
@Roles(Role.ADMIN)
@Controller('alunos')
export class AlunosController {
  constructor(private readonly service: AlunosService) {}

  @Post()
  @ApiOkResponse({ type: AlunoCriadoDto })
  create(@Body() dto: CreateAlunoDto): Promise<AlunoCriadoDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: AlunoDto, isArray: true })
  findAll(@Query('turmaId') turmaId?: string): Promise<AlunoDto[]> {
    return this.service.findAll(turmaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAlunoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/turma')
  vincularTurma(@Param('id') id: string, @Body() dto: VincularTurmaDto) {
    return this.service.vincularTurma(id, dto.turmaId);
  }

  @Delete(':id/turma')
  desligarTurma(@Param('id') id: string) {
    return this.service.desligarTurma(id);
  }

  @Post(':id/materias/:materiaId')
  adicionarMateria(
    @Param('id') id: string,
    @Param('materiaId') materiaId: string,
  ) {
    return this.service.adicionarMateria(id, materiaId);
  }

  @Delete(':id/materias/:materiaId')
  removerMateria(
    @Param('id') id: string,
    @Param('materiaId') materiaId: string,
  ) {
    return this.service.removerMateria(id, materiaId);
  }
}

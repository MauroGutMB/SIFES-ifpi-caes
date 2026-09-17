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
import { SemestresService } from './semestres.service';
import { CreateSemestreDto } from './dto/create-semestre.dto';
import { UpdateSemestreDto } from './dto/update-semestre.dto';
import { SemestreDto } from './dto/semestre.dto';

@ApiTags('semestres')
@Roles(Role.ADMIN)
@Controller('semestres')
export class SemestresController {
  constructor(private readonly service: SemestresService) {}

  @Post()
  @ApiOkResponse({ type: SemestreDto })
  create(@Body() dto: CreateSemestreDto): Promise<SemestreDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: SemestreDto, isArray: true })
  findAll(): Promise<SemestreDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSemestreDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

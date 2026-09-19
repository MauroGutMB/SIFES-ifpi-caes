import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class VincularTurmaDto {
  @ApiProperty({ description: 'Id da turma a ser vinculada ao aluno' })
  @IsUUID()
  turmaId: string;
}

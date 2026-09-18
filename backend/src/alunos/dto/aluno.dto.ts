import { ApiProperty } from '@nestjs/swagger';
import { TurmaDto } from '../../turmas/dto/turma.dto';

export class AlunoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  matricula: string;

  @ApiProperty({ nullable: true, type: String })
  turmaId: string | null;

  @ApiProperty({ nullable: true, type: String })
  fotoUrl: string | null;
}

export class AlunoCriadoDto extends AlunoDto {
  @ApiProperty({
    description: 'Senha inicial gerada — mostrar ao admin uma única vez',
  })
  senhaInicial: string;
}

export class AlunoMeDto extends AlunoDto {
  @ApiProperty({ type: TurmaDto, nullable: true })
  turma: TurmaDto | null;
}

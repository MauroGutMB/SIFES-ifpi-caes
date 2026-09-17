import { ApiProperty } from '@nestjs/swagger';

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
}

export class AlunoCriadoDto extends AlunoDto {
  @ApiProperty({
    description: 'Senha inicial gerada — mostrar ao admin uma única vez',
  })
  senhaInicial: string;
}

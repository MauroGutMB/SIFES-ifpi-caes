import { ApiProperty } from '@nestjs/swagger';

export class ProfessorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  email: string;
}

export class ProfessorCriadoDto extends ProfessorDto {
  @ApiProperty({
    description: 'Senha inicial gerada — mostrar ao admin uma única vez',
  })
  senhaInicial: string;
}

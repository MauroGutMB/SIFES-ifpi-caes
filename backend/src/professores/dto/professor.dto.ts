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

  @ApiProperty({ nullable: true, type: String })
  fotoUrl: string | null;
}

export class ProfessorCriadoDto extends ProfessorDto {
  @ApiProperty({
    description: 'Senha inicial gerada — mostrar ao admin uma única vez',
  })
  senhaInicial: string;
}

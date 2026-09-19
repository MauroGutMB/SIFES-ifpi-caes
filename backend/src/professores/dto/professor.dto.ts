import { ApiProperty } from '@nestjs/swagger';

export class ProfessorDto {
  @ApiProperty({ description: 'Id do professor' })
  id: string;

  @ApiProperty({ description: 'Id da conta de login (User) vinculada' })
  userId: string;

  @ApiProperty({ description: 'Nome completo do professor' })
  nome: string;

  @ApiProperty({
    description: 'E-mail — também usado como login',
    example: 'joao.souza@ifpi.edu.br',
  })
  email: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'URL da foto de perfil, ou null se não tiver foto',
  })
  fotoUrl: string | null;
}

export class ProfessorCriadoDto extends ProfessorDto {
  @ApiProperty({
    description: 'Senha inicial gerada — mostrar ao admin uma única vez',
  })
  senhaInicial: string;
}

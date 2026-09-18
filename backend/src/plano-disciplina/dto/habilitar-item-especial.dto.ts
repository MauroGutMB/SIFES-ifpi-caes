import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class HabilitarItemEspecialDto {
  @ApiProperty({
    description:
      'Se o item especial (recuperação, prova final) vale pra nota deste aluno',
  })
  @IsBoolean()
  habilitado: boolean;
}

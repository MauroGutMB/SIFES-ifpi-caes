import { PartialType } from '@nestjs/swagger';
import { CreateItemAvaliacaoDto } from './create-item-avaliacao.dto';

export class UpdateItemAvaliacaoDto extends PartialType(
  CreateItemAvaliacaoDto,
) {}

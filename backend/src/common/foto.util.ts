import { join } from 'path';

export const MAX_FOTO_BYTES = 2 * 1024 * 1024; // 2MB
export const FOTO_MIME_REGEX = /^image\/(jpeg|png)$/;

export const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export const UPLOADS_ROOT =
  process.env.UPLOADS_DIR ?? join(process.cwd(), 'uploads');
export const FOTOS_DIR = join(UPLOADS_ROOT, 'fotos');
export const FOTOS_PENDENTES_DIR = join(UPLOADS_ROOT, 'fotos-pendentes');
export const MATERIAIS_AULA_DIR = join(UPLOADS_ROOT, 'materiais-aula');
export const ENTREGAS_DIR = join(UPLOADS_ROOT, 'entregas');

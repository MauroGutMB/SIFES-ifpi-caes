/*
  Warnings:

  - Added the required column `peso` to the `itens_avaliacao` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ModoItemEspecial" AS ENUM ('PONDERADA', 'SUBSTITUI_ITEM', 'SUBSTITUI_MEDIA');

-- AlterTable
ALTER TABLE "itens_avaliacao" ADD COLUMN     "especial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "itemSubstituidoId" TEXT,
ADD COLUMN     "modoEspecial" "ModoItemEspecial",
ADD COLUMN     "notaMetaMinima" DECIMAL(5,2),
ADD COLUMN     "peso" DECIMAL(6,2);

-- Backfill: peso inicial 1 pra todo item já existente — cada item conta igual na média até
-- o professor customizar pesos pela regra de aprovação.
UPDATE "itens_avaliacao" SET "peso" = 1 WHERE "peso" IS NULL;

ALTER TABLE "itens_avaliacao" ALTER COLUMN "peso" SET NOT NULL;

-- CreateTable
CREATE TABLE "itens_especiais_alunos" (
    "id" TEXT NOT NULL,
    "itemAvaliacaoId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,

    CONSTRAINT "itens_especiais_alunos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "itens_especiais_alunos_itemAvaliacaoId_alunoId_key" ON "itens_especiais_alunos"("itemAvaliacaoId", "alunoId");

-- AddForeignKey
ALTER TABLE "itens_avaliacao" ADD CONSTRAINT "itens_avaliacao_itemSubstituidoId_fkey" FOREIGN KEY ("itemSubstituidoId") REFERENCES "itens_avaliacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_especiais_alunos" ADD CONSTRAINT "itens_especiais_alunos_itemAvaliacaoId_fkey" FOREIGN KEY ("itemAvaliacaoId") REFERENCES "itens_avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_especiais_alunos" ADD CONSTRAINT "itens_especiais_alunos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

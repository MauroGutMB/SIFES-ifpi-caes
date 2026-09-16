-- CreateEnum
CREATE TYPE "StatusSolicitacaoFoto" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');

-- CreateTable
CREATE TABLE "solicitacoes_foto" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "arquivoStagingUrl" TEXT NOT NULL,
    "status" "StatusSolicitacaoFoto" NOT NULL DEFAULT 'PENDENTE',
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidaEm" TIMESTAMP(3),

    CONSTRAINT "solicitacoes_foto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "solicitacoes_foto" ADD CONSTRAINT "solicitacoes_foto_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

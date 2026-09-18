-- CreateTable
CREATE TABLE "pendencias_resolvidas" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "resolvidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pendencias_resolvidas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pendencias_resolvidas_alunoId_materiaId_key" ON "pendencias_resolvidas"("alunoId", "materiaId");

-- AddForeignKey
ALTER TABLE "pendencias_resolvidas" ADD CONSTRAINT "pendencias_resolvidas_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "alunos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendencias_resolvidas" ADD CONSTRAINT "pendencias_resolvidas_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

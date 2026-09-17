/*
  Warnings:

  - You are about to drop the column `diaSemana` on the `materias` table. All the data in the column will be lost.
  - You are about to drop the column `horaInicio` on the `materias` table. All the data in the column will be lost.
  - Added the required column `nome` to the `materias` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "materias" DROP COLUMN "diaSemana",
DROP COLUMN "horaInicio",
ADD COLUMN     "nome" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "horarios_materia" (
    "id" TEXT NOT NULL,
    "materiaId" TEXT NOT NULL,
    "diaSemana" "DiaSemana" NOT NULL,
    "horaInicio" TEXT NOT NULL,

    CONSTRAINT "horarios_materia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "horarios_materia_materiaId_diaSemana_horaInicio_key" ON "horarios_materia"("materiaId", "diaSemana", "horaInicio");

-- AddForeignKey
ALTER TABLE "horarios_materia" ADD CONSTRAINT "horarios_materia_materiaId_fkey" FOREIGN KEY ("materiaId") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

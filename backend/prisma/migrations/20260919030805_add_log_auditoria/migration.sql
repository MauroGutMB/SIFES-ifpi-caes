-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "alvo" TEXT NOT NULL,
    "usuarioId" TEXT,
    "usuarioNome" TEXT NOT NULL,
    "semestreId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_semestreId_fkey" FOREIGN KEY ("semestreId") REFERENCES "semestres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

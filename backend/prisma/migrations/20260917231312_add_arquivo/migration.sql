-- CreateTable
CREATE TABLE "arquivos" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "conteudo" BYTEA NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivos_pkey" PRIMARY KEY ("id")
);

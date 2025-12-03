-- AlterTable
ALTER TABLE "Mesa" ADD COLUMN     "usuarioId" INTEGER;

-- AddForeignKey
ALTER TABLE "Mesa" ADD CONSTRAINT "Mesa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

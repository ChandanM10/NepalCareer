import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __prismaSchemaHash: string | undefined
}

// Bust cache if schema has changed (check by looking for new model)
const currentHash = 'v3-watchsource-notification'

export const db =
  (globalForPrisma.__prismaSchemaHash === currentHash && globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : new PrismaClient({
        log: ['error', 'warn'],
      })

globalForPrisma.prisma = db
globalForPrisma.__prismaSchemaHash = currentHash

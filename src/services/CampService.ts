import prisma from '../config/prisma';

export class CampService {
  static async distributeRevenue(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { subSessions: { include: { spins: true } } },
    });

    if (!session) return;

    const totalSpins = session.subSessions.reduce((acc, ss) => acc + ss.spins.length, 0);
    const camps = await prisma.camp.findMany();

    for (const camp of camps) {
      if (!camp.ownerId) continue;

      // Revenue logic: 0.1 tokens per spin in the session * camp revenue rate
      const revenue = (totalSpins * 0.1) * Number(camp.revenueRate);

      if (revenue > 0) {
        await prisma.$transaction([
          // 1. Update User Balance
          prisma.user.update({
            where: { id: camp.ownerId },
            data: { balance: { increment: revenue } },
          }),
          // 2. Log in Ledger
          prisma.tokenLedger.create({
            data: {
              userId: camp.ownerId,
              amount: revenue,
              type: 'REVENUE',
              referenceId: camp.id,
            },
          }),
          // 3. Log Camp Earning
          prisma.campEarning.create({
            data: {
              campId: camp.id,
              userId: camp.ownerId,
              amount: revenue,
              sessionId,
            },
          }),
        ]);
      }
    }
  }
}

import prisma from '../config/prisma';

export class SquadService {
  static async createSquad(name: string, leaderId: string) {
    return await prisma.squad.create({
      data: {
        name,
        leaderId,
        members: {
          connect: { id: leaderId },
        },
      },
      include: { members: true },
    });
  }

  static async joinSquad(squadId: string, userId: string) {
    return await prisma.squad.update({
      where: { id: squadId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: { members: true },
    });
  }

  static async leaveSquad(squadId: string, userId: string) {
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: { members: true },
    });

    if (!squad) throw new Error('Squad not found');
    if (squad.leaderId === userId) throw new Error('Leader cannot leave squad. Dissolve it instead.');

    return await prisma.squad.update({
      where: { id: squadId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
      include: { members: true },
    });
  }

  static async getSquadDetails(squadId: string) {
    return await prisma.squad.findUnique({
      where: { id: squadId },
      include: { members: true, tokenLedger: true },
    });
  }
}

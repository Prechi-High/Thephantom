require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting V4 Revised Seed...');

  const ruleName = 'V4 Hybrid Competitive';

  // 1. Session Rules with Hybrid Elimination
  const eliminationPhaseRules = {
    phases: [
        {
            name: 'Phase 1',
            rounds: [
                { round: 1, target: 15, bottomEliminatePercent: 10 },
                { round: 2, target: 25, bottomEliminatePercent: 10 },
                { round: 3, target: 40, bottomEliminatePercent: 10 }
            ]
        },
        {
            name: 'Phase 2',
            rounds: [
                { round: 1, target: 60, bottomEliminatePercent: 15 },
                { round: 2, target: 80, bottomEliminatePercent: 15 },
                { round: 3, target: 100, bottomEliminatePercent: 15 }
            ]
        },
        {
            name: 'Phase 3',
            rounds: [
                { round: 1, target: 130, bottomEliminatePercent: 20 },
                { round: 2, target: 160, bottomEliminatePercent: 20 }
            ]
        }
    ]
  };

  await prisma.sessionRule.deleteMany({ where: { name: ruleName } });

  const sessionRule = await prisma.sessionRule.create({
    data: {
        name: ruleName,
        entryFee: 10.0,
        showdownDuration: 90,
        capacityPerSubSession: 40,
        botRatio: 0.99,
        eliminationPhaseRules
    }
  });

  // 2. Cleanup
  await prisma.sessionRegistration.deleteMany({});
  await prisma.subSessionPlayer.deleteMany({});
  await prisma.spin.deleteMany({});
  await prisma.subSession.deleteMany({});
  await prisma.session.deleteMany({});

  // 3. Create Session
  const session = await prisma.session.create({
    data: {
      name: 'V4 Revised Battle #1',
      startTime: new Date(Date.now() + 60000),
      rulesId: sessionRule.id,
      prizePool: 0 
    }
  });

  // 4. Ensure we have enough bots (150 total for overflow test)
  const currentBots = await prisma.user.count({ where: { type: 'BOT' } });
  if (currentBots < 150) {
      console.log(`Seeding ${150 - currentBots} additional bots...`);
      const bots = [];
      for (let i = currentBots + 1; i <= 150; i++) {
          bots.push({
              username: `Bot_V4_${i.toString().padStart(3, '0')}`,
              type: 'BOT',
              balance: 500
          });
      }
      await prisma.user.createMany({ data: bots });
  }

  console.log('V4 Revised Seed Complete. Session ID:', session.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

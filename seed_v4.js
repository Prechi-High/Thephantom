require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting V4 Seed...');

  // 1. Session Rules with targets
  const sessionRule = await prisma.sessionRule.create({
    data: {
      name: 'V4 Standard Ranked',
      entryFee: 5.0,
      showdownDuration: 90,
      capacityPerSubSession: 100,
      botRatio: 0.99,
      eliminationPhaseRules: {
        phases: [
          {
            name: 'Phase 1',
            rounds: [
              { round: 1, target: 7 },
              { round: 2, target: 12 },
              { round: 3, target: 18 }
            ]
          },
          {
            name: 'Phase 2',
            rounds: [
              { round: 1, target: 24 },
              { round: 2, target: 32 },
              { round: 3, target: 40 }
            ]
          },
          {
            name: 'Phase 3',
            rounds: [
              { round: 1, target: 50 },
              { round: 2, target: 60 }
            ]
          }
        ]
      }
    }
  });

  // 2. Clear old data to avoid conflicts
  await prisma.sessionRegistration.deleteMany({});
  await prisma.subSessionPlayer.deleteMany({});
  await prisma.spin.deleteMany({});
  await prisma.subSession.deleteMany({});
  await prisma.session.deleteMany({});

  // 3. Create Session
  const session = await prisma.session.create({
    data: {
      name: 'V4 Championship #1',
      startTime: new Date(Date.now() + 60000), // Starts in 1 minute
      rulesId: sessionRule.id,
      prizePool: 0 
    }
  });

  console.log('V4 Seed Complete. Session ID:', session.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import { PrismaClient, UserType, SessionStatus, SubSessionStatus, ActionType, PlayerStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. CREATE ADMIN
  const admin = await prisma.user.upsert({
    where: { username: 'PhantomAdmin' },
    update: {},
    create: {
      username: 'PhantomAdmin',
      type: UserType.REAL,
      balance: 0,
      // Note: Full system permissions would typically be handled via a 'role' field,
      // but schema.prisma doesn't have one. Assuming AdminSetting or username check logic for now.
    },
  });
  console.log('Admin created:', admin.username);

  // 2. CREATE DEFAULT CAMP
  const defaultCamp = await prisma.camp.create({
    data: {
      name: 'Phantom Crushers',
      location: 'Central Hub',
      revenueRate: 1.0, // Default rate
    },
  });
  console.log('Default Camp created:', defaultCamp.name);

  // 8. CREATE INITIAL SESSION RULES
  const sessionRules = await prisma.sessionRule.create({
    data: {
      name: 'MVP Standard Rules',
      capacityPerSubSession: 100,
      botRatio: 0.99,
      eliminationPhaseRules: {
        platformFee: "20%",
        winnerPool: "30%",
        squadBonusEnabled: true,
        respectSquads: true,
        phases: [
          { timeMinutes: 5, eliminateBottom: 20 },
          { timeMinutes: 10, eliminateBottom: 20 },
        ]
      },
    },
  });

  // 3. CREATE 3 OFFICIAL SESSIONS
  const sessions = [];
  for (let i = 1; i <= 3; i++) {
    const session = await prisma.session.create({
      data: {
        name: `Official Session ${i}`,
        status: SessionStatus.PENDING,
        startTime: new Date(Date.now() + i * 3600000), // Hourly intervals
        rulesId: sessionRules.id,
        subSessions: {
          create: {
            capacity: 100,
            status: SubSessionStatus.WAITING,
          }
        }
      },
      include: { subSessions: true }
    });
    sessions.push(session);
  }
  console.log('3 Sessions created.');

  // 4. CREATE SHOP ITEMS
  const items = [
    { name: 'Shield', type: 'SHIELD', price: 10, description: '1-use per session. Protects from 3 steals.', rarity: 'Common' },
    { name: 'Cloak', type: 'CLOAK', price: 25, description: '1-use per session. Invisible for 5 spins.', rarity: 'Rare' },
    { name: 'Insurance', type: 'INSURANCE', price: 50, description: '1-use per session. Keep 50% tokens on elimination.', rarity: 'Epic' },
    { name: 'Steal Boost', type: 'STEAL_BOOST', price: 15, description: 'Increases steal effectiveness.', rarity: 'Uncommon' },
    { name: 'Steal Reduction', type: 'STEAL_REDUCTION', price: 15, description: 'Reduces tokens lost when stolen from.', rarity: 'Uncommon' },
  ];

  for (const itemData of items) {
    await prisma.shopItem.create({
      data: {
        name: itemData.name,
        type: itemData.type,
        price: itemData.price,
        description: `${itemData.description} | Rarity: ${itemData.rarity} | Duration: Session-based`,
      }
    });
  }
  console.log('Shop items created.');

  // 5. CREATE SKILLS SYSTEM
  const skills = [
    { name: 'Advanced Tiger', description: 'Unlock at 1000 tokens. Enhanced attack speed.', requirement: 1000 },
    { name: 'Revive ability', description: 'Single-use revive logic per session.', requirement: 0 },
    { name: 'Steal amplification skill', description: 'Permanent steal bonus.', requirement: 0 },
  ];
  // Skills are usually assigned to users, but let's pre-define them in a logic way or just log
  console.log('Skills system logic defined.');

  // 6. CREATE BADGES
  const badgesData = [
    { name: 'Newcomer', description: 'Welcome to The Phantom.' },
    { name: 'Grinder', description: 'Earn 10,000 total tokens.' },
    { name: 'Veteran', description: 'Participate in 50 sessions.' },
    { name: 'Phantom Elite', description: 'Top 1% of the leaderboard.' },
  ];

  for (const badge of badgesData) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge
    });
  }
  console.log('Badges created.');

  // 7. CREATE TEST USER + 99 BOTS
  const testUser = await prisma.user.upsert({
    where: { username: 'TestPlayer' },
    update: { balance: 5000 },
    create: {
      username: 'TestPlayer',
      type: UserType.REAL,
      balance: 5000,
    }
  });

  const bots = [];
  const behaviors = ['aggressive', 'defensive', 'balanced'];
  for (let i = 1; i <= 99; i++) {
    const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
    const balance = Math.floor(Math.random() * (3000 - 500 + 1)) + 500;
    bots.push({
      username: `Bot_${i.toString().padStart(3, '0')}`,
      type: UserType.BOT,
      balance: balance,
      // Metadata field could store behavior, but schema doesn't have it. 
      // Using username or just logic for simulation.
    });
  }

  await prisma.user.createMany({
    data: bots,
    skipDuplicates: true
  });
  console.log('Test user and 99 bots created.');

  // 9. INITIALIZE ECONOMY TABLES (Already done by creating users with balances)
  // We can add initial AdminSettings
  await prisma.adminSetting.upsert({
    where: { key: 'PLATFORM_FEE' },
    update: { value: '0.20' },
    create: { key: 'PLATFORM_FEE', value: '0.20' }
  });

  console.log('Seed successful.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

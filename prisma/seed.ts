import { PrismaClient, UserRole, WasteTypeCode } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const WASTE_FEES: Record<WasteTypeCode, number> = {
  PLASTIC: 40,
  PAPER: 35,
  METAL: 50,
  GLASS: 45,
  ELECTRONIC: 80,
  MIXED: 55,
};

const WASTE_KEYS: Record<WasteTypeCode, string> = {
  PLASTIC: 'waste.plastic',
  PAPER: 'waste.paper',
  METAL: 'waste.metal',
  GLASS: 'waste.glass',
  ELECTRONIC: 'waste.electronic',
  MIXED: 'waste.mixed',
};

async function main() {
  const password = process.env.SEED_PASSWORD ?? 'ChangeMeInDevOnly!';
  const hash = await bcrypt.hash(password, 12);

  for (const code of Object.keys(WASTE_FEES) as WasteTypeCode[]) {
    await prisma.wasteType.upsert({
      where: { code },
      update: { flatFeeMad: WASTE_FEES[code] },
      create: {
        code,
        nameKey: WASTE_KEYS[code],
        flatFeeMad: WASTE_FEES[code],
        active: true,
      },
    });
  }

  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Demo B2B Casablanca',
      taxId: 'MA-DEMO-001',
      billingEmail: 'billing@demo.ma',
    },
  });

  const users: { email: string; name: string; role: UserRole; orgId?: string }[] = [
    { email: 'admin@greencollect.ma', name: 'Admin', role: 'ADMIN' },
    { email: 'dispatcher@greencollect.ma', name: 'Dispatcher', role: 'DISPATCHER' },
    { email: 'collector1@greencollect.ma', name: 'Collector One', role: 'COLLECTOR' },
    { email: 'collector2@greencollect.ma', name: 'Collector Two', role: 'COLLECTOR' },
    { email: 'user1@greencollect.ma', name: 'User One', role: 'USER' },
    { email: 'user2@greencollect.ma', name: 'User Two', role: 'USER' },
    { email: 'b2b@greencollect.ma', name: 'B2B User', role: 'USER', orgId: org.id },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: hash, status: 'ACTIVE' },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        status: 'ACTIVE',
        passwordHash: hash,
        locale: 'fr',
        organizationId: u.orgId,
      },
    });
  }

  const user1 = await prisma.user.findUniqueOrThrow({ where: { email: 'user1@greencollect.ma' } });
  const plastic = await prisma.wasteType.findUniqueOrThrow({ where: { code: 'PLASTIC' } });

  const address = await prisma.address.upsert({
    where: { id: '00000000-0000-4000-8000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000010',
      userId: user1.id,
      label: 'Home',
      line1: 'Bd Zerktouni',
      district: 'Maarif',
      city: 'Casablanca',
      latitude: 33.5731,
      longitude: -7.5898,
      isDefault: true,
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.pickup.upsert({
    where: { id: '00000000-0000-4000-8000-000000000020' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000020',
      customerId: user1.id,
      addressId: address.id,
      wasteTypeId: plastic.id,
      status: 'REQUESTED',
      scheduledDate: tomorrow,
      timeWindowStart: '09:00',
      timeWindowEnd: '12:00',
      feeAmountMad: plastic.flatFeeMad,
      paymentStatus: 'PENDING',
    },
  });

  console.log('Seed complete. Login: user1@greencollect.ma /', password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:/Users/vaibhaw/Developer/KLINK/packages/database/prisma/dev.db'
    }
  }
});

async function main() {
  console.log('🚜 Seeding initial yard delivery fleet vehicles...');

  const suppliers = await prisma.supplier.findMany();
  console.log(`Found ${suppliers.length} suppliers.`);

  const gupta = suppliers.find((s) => s.businessName.includes('Gupta'));
  const singh = suppliers.find((s) => s.businessName.includes('Singh'));
  const durga = suppliers.find((s) => s.businessName.includes('Durga'));

  const vehiclesData: any[] = [];

  if (gupta) {
    vehiclesData.push(
      {
        supplierId: gupta.id,
        vehicleNumber: 'BR-07-T-8899',
        vehicleType: 'TRACTOR_TROLLEY',
        driverName: 'Ramvilas Paswan',
        driverPhone: '9800011122',
        capacityInfo: '100 Bags / 150 CFT',
        status: 'AVAILABLE'
      },
      {
        supplierId: gupta.id,
        vehicleNumber: 'BR-07-GB-4421',
        vehicleType: 'TIPPER_TRUCK',
        driverName: 'Santosh Yadav',
        driverPhone: '9800011123',
        capacityInfo: '200 Bags / 300 CFT',
        status: 'AVAILABLE'
      },
      {
        supplierId: gupta.id,
        vehicleNumber: 'BR-07-P-1012',
        vehicleType: 'CHHOTA_HATHI',
        driverName: 'Munna Sah',
        driverPhone: '9800011124',
        capacityInfo: '50 Bags / 1.5 Tonnes',
        status: 'AVAILABLE'
      }
    );
  }

  if (singh) {
    vehiclesData.push(
      {
        supplierId: singh.id,
        vehicleNumber: 'BR-07-TA-6543',
        vehicleType: 'TRACTOR_TROLLEY',
        driverName: 'Suresh Sharma',
        driverPhone: '9800022233',
        capacityInfo: '3 Tonnes Sariya',
        status: 'AVAILABLE'
      },
      {
        supplierId: singh.id,
        vehicleNumber: 'BR-07-TR-9988',
        vehicleType: 'TIPPER_TRUCK',
        driverName: 'Rakesh Singh',
        driverPhone: '9800022234',
        capacityInfo: '8 Tonnes TMT Rebar',
        status: 'AVAILABLE'
      }
    );
  }

  if (durga) {
    vehiclesData.push(
      {
        supplierId: durga.id,
        vehicleNumber: 'BR-07-T-3311',
        vehicleType: 'TRACTOR_TROLLEY',
        driverName: 'Baidyanath Mukhiya',
        driverPhone: '9800033344',
        capacityInfo: '150 CFT Sand / Gitti',
        status: 'AVAILABLE'
      },
      {
        supplierId: durga.id,
        vehicleNumber: 'BR-07-D-7788',
        vehicleType: 'TIPPER_TRUCK',
        driverName: 'Anil Mahto',
        driverPhone: '9800033345',
        capacityInfo: '600 CFT Heavy Tipper',
        status: 'AVAILABLE'
      }
    );
  }

  for (const v of vehiclesData) {
    const existing = await prisma.supplierVehicle.findFirst({
      where: { supplierId: v.supplierId, vehicleNumber: v.vehicleNumber }
    });
    if (!existing) {
      await prisma.supplierVehicle.create({ data: v });
      console.log(`  + Created vehicle ${v.vehicleNumber} (${v.vehicleType}) for ${v.driverName}`);
    } else {
      console.log(`  = Already exists: ${v.vehicleNumber}`);
    }
  }

  const count = await prisma.supplierVehicle.count();
  console.log(`✅ Total vehicles in database: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for KLINK (Darbhanga Marketplace)...');

  // 1. Geo: State & Districts
  const bihar = await prisma.state.upsert({
    where: { code: 'BR' },
    update: {},
    create: {
      code: 'BR',
      name: 'Bihar',
      isActive: true
    }
  });

  const darbhanga = await prisma.district.upsert({
    where: { code: 'DARBHANGA' },
    update: {},
    create: {
      stateId: bihar.id,
      code: 'DARBHANGA',
      name: 'Darbhanga',
      isActive: true
    }
  });

  const madhubani = await prisma.district.upsert({
    where: { code: 'MADHUBANI' },
    update: {},
    create: {
      stateId: bihar.id,
      code: 'MADHUBANI',
      name: 'Madhubani',
      isActive: true
    }
  });

  const samastipur = await prisma.district.upsert({
    where: { code: 'SAMASTIPUR' },
    update: {},
    create: {
      stateId: bihar.id,
      code: 'SAMASTIPUR',
      name: 'Samastipur',
      isActive: true
    }
  });

  console.log('📍 Seeded Bihar, Darbhanga, Madhubani, Samastipur');

  // 2. Categories
  const categoriesData = [
    { slug: 'cement', name: 'Cement', hindiName: 'सीमेंट', sortOrder: 1, iconUrl: '🏗️' },
    { slug: 'sariya', name: 'Steel / Sariya', hindiName: 'सरिया / TMT', sortOrder: 2, iconUrl: '🔩' },
    { slug: 'balu', name: 'Sand / Balu', hindiName: 'बालू / रेत', sortOrder: 3, iconUrl: '⏳' },
    { slug: 'gitti', name: 'Aggregate / Gitti', hindiName: 'गिट्टी', sortOrder: 4, iconUrl: '🪨' },
    { slug: 'eent', name: 'Bricks / Eent', hindiName: 'ईंट', sortOrder: 5, iconUrl: '🧱' },
    { slug: 'blocks', name: 'Blocks / AAC', hindiName: 'ब्लॉक्स', sortOrder: 6, iconUrl: '🏛️' }
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    categories[cat.slug] = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat
    });
  }

  // 3. Brands
  const brandsData = [
    'UltraTech',
    'ACC',
    'Ambuja',
    'Dalmia',
    'Shree Cement',
    'JK Cement',
    'Tata Tiscon',
    'Jindal Panther',
    'Balmukund',
    'Kamdhenu',
    'Shyam Steel',
    'Birla Gold',
    'Siporex',
    'Magicrete'
  ];
  const brands: Record<string, any> = {};
  for (const brandName of brandsData) {
    brands[brandName] = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName }
    });
  }

  // 4. Master Products Catalog (Roadmap Section 4)
  const masterProductsData = [
    // --- CEMENT ---
    {
      name: 'UltraTech PPC Cement 50kg',
      categoryId: categories['cement'].id,
      brandId: brands['UltraTech'].id,
      defaultUnit: 'BAG',
      description: 'Portland Pozzolana Cement for heavy construction, foundation and slab casting.'
    },
    {
      name: 'UltraTech Weather Pro 50kg',
      categoryId: categories['cement'].id,
      brandId: brands['UltraTech'].id,
      defaultUnit: 'BAG',
      description: 'Water-repellent micro-engineered active formula for dampness protection.'
    },
    {
      name: 'UltraTech Super 53 Grade OPC 50kg',
      categoryId: categories['cement'].id,
      brandId: brands['UltraTech'].id,
      defaultUnit: 'BAG',
      description: 'Ordinary Portland Cement 53 Grade for rapid high early strength.'
    },
    {
      name: 'ACC Suraksha Power PPC 50kg',
      categoryId: categories['cement'].id,
      brandId: brands['ACC'].id,
      defaultUnit: 'BAG',
      description: 'Premium slag and pozzolana engineered water-resistant cement.'
    },
    {
      name: 'ACC Concrete+ 50kg',
      categoryId: categories['cement'].id,
      brandId: brands['ACC'].id,
      defaultUnit: 'BAG',
      description: 'Formulated with micro-fine particles for dense, durable cast concrete.'
    },
    {
      name: 'Ambuja Kawach 50kg',
      categoryId: categories['cement'].id,
      brandId: brands['Ambuja'].id,
      defaultUnit: 'BAG',
      description: 'Specially treated water-shield cement preventing efflorescence.'
    },
    {
      name: 'Ambuja Plus Roof Special 50kg',
      categoryId: categories['cement'].id,
      brandId: brands['Ambuja'].id,
      defaultUnit: 'BAG',
      description: 'Advanced silicate gel technology optimized specifically for roof slabs.'
    },
    {
      name: 'Dalmia DSP PPC 50kg',
      categoryId: categories['cement'].id,
      brandId: brands['Dalmia'].id,
      defaultUnit: 'BAG',
      description: 'Durex Silico Protected specialized high performance slag cement.'
    },
    {
      name: 'Shree Jung Rodhak Cement 50kg',
      categoryId: categories['cement'].id,
      brandId: brands['Shree Cement'].id,
      defaultUnit: 'BAG',
      description: 'Rust-resistant high durability blend for humid climates.'
    },
    {
      name: 'JK Super Cement 50kg',
      categoryId: categories['cement'].id,
      brandId: brands['JK Cement'].id,
      defaultUnit: 'BAG',
      description: 'Reliable all-purpose construction cement.'
    },

    // --- STEEL / SARIYA / TMT ---
    {
      name: 'Tata Tiscon 550D TMT Bar 8mm',
      categoryId: categories['sariya'].id,
      brandId: brands['Tata Tiscon'].id,
      defaultUnit: 'KG',
      description: '8mm primary tie and stirrup ductile reinforcement rebar.'
    },
    {
      name: 'Tata Tiscon 550D TMT Bar 10mm',
      categoryId: categories['sariya'].id,
      brandId: brands['Tata Tiscon'].id,
      defaultUnit: 'KG',
      description: 'High ductile earthquake-resistant Fe550D certified steel for slabs.'
    },
    {
      name: 'Tata Tiscon 550D TMT Bar 12mm',
      categoryId: categories['sariya'].id,
      brandId: brands['Tata Tiscon'].id,
      defaultUnit: 'KG',
      description: 'Standard 12mm pillar, beam and lintel reinforcement sariya.'
    },
    {
      name: 'Tata Tiscon 550D TMT Bar 16mm',
      categoryId: categories['sariya'].id,
      brandId: brands['Tata Tiscon'].id,
      defaultUnit: 'KG',
      description: '16mm heavy pillar and load-bearing column rebar.'
    },
    {
      name: 'Tata Tiscon 550D TMT Bar 20mm',
      categoryId: categories['sariya'].id,
      brandId: brands['Tata Tiscon'].id,
      defaultUnit: 'KG',
      description: '20mm multi-storey commercial column and footing bar.'
    },
    {
      name: 'Jindal Panther Fe550D TMT Rebar 10mm',
      categoryId: categories['sariya'].id,
      brandId: brands['Jindal Panther'].id,
      defaultUnit: 'KG',
      description: 'High strength, excellent bendability and low carbon Fe550D rebar.'
    },
    {
      name: 'Jindal Panther Fe550D TMT Rebar 12mm',
      categoryId: categories['sariya'].id,
      brandId: brands['Jindal Panther'].id,
      defaultUnit: 'KG',
      description: 'Engineered for pillars and beams with superior rib pattern bonding.'
    },
    {
      name: 'Jindal Panther Fe550D TMT Rebar 16mm',
      categoryId: categories['sariya'].id,
      brandId: brands['Jindal Panther'].id,
      defaultUnit: 'KG',
      description: '16mm heavy reinforcement rebar.'
    },
    {
      name: 'Balmukund Super Fe500D 10mm',
      categoryId: categories['sariya'].id,
      brandId: brands['Balmukund'].id,
      defaultUnit: 'KG',
      description: 'Regional Bihar-trusted Fe500D construction sariya.'
    },
    {
      name: 'Balmukund Super Fe500D 12mm',
      categoryId: categories['sariya'].id,
      brandId: brands['Balmukund'].id,
      defaultUnit: 'KG',
      description: 'Reliable regional Fe500D construction sariya for residential homes.'
    },
    {
      name: 'Kamdhenu Nxt Fe550D 12mm',
      categoryId: categories['sariya'].id,
      brandId: brands['Kamdhenu'].id,
      defaultUnit: 'KG',
      description: 'Double rib pattern engineered for 2.5x concrete grip.'
    },
    {
      name: 'Shyam Steel Fe500D 12mm',
      categoryId: categories['sariya'].id,
      brandId: brands['Shyam Steel'].id,
      defaultUnit: 'KG',
      description: 'Superior ductility and corrosion resistance.'
    },

    // --- SAND / BALU ---
    {
      name: 'Koel River Coarse Red Sand (Lal Balu)',
      categoryId: categories['balu'].id,
      brandId: null,
      defaultUnit: 'CFT',
      description: 'Coarse washed red river sand without silt, optimal for roof slab casting.'
    },
    {
      name: 'Sone River Medium Coarse Sand',
      categoryId: categories['balu'].id,
      brandId: null,
      defaultUnit: 'CFT',
      description: 'Clean medium grain golden river sand for masonry and brick laying.'
    },
    {
      name: 'M-Sand (Manufactured Sand Concrete Grade)',
      categoryId: categories['balu'].id,
      brandId: null,
      defaultUnit: 'CFT',
      description: 'Zero silt engineered crushed stone sand compliant with IS 383 Zone II.'
    },
    {
      name: 'Plastering Fine White River Sand',
      categoryId: categories['balu'].id,
      brandId: null,
      defaultUnit: 'CFT',
      description: 'Fine sieved sand for smooth crack-free wall plastering.'
    },

    // --- AGGREGATE / GITTI ---
    {
      name: 'Pakur 20mm Blue Metal Gitti',
      categoryId: categories['gitti'].id,
      brandId: null,
      defaultUnit: 'CFT',
      description: 'Heavy duty Pakur black/blue granite aggregate 20mm for concrete casting.'
    },
    {
      name: 'Pakur 10mm Down Aggregate',
      categoryId: categories['gitti'].id,
      brandId: null,
      defaultUnit: 'CFT',
      description: '10mm small stone chips for column and thin beam concrete mix.'
    },
    {
      name: '40mm Foundation Stone Metal',
      categoryId: categories['gitti'].id,
      brandId: null,
      defaultUnit: 'CFT',
      description: 'Heavy 40mm broken blue rock for base foundation and road underbed.'
    },
    {
      name: 'Crushed Stone Dust (Chuna / Powder)',
      categoryId: categories['gitti'].id,
      brandId: null,
      defaultUnit: 'CFT',
      description: 'Clean stone dust for paver blocks, subbase filling and mortar mixes.'
    },

    // --- BRICKS / EENT ---
    {
      name: 'Red Clay Kiln Brick (1 Number Eent)',
      categoryId: categories['eent'].id,
      brandId: null,
      defaultUnit: 'PIECE',
      description: 'First class kiln burned traditional red clay building brick (9x4x3 inch).'
    },
    {
      name: 'Red Clay Kiln Brick (2 Number Eent)',
      categoryId: categories['eent'].id,
      brandId: null,
      defaultUnit: 'PIECE',
      description: 'Standard second grade red brick for compound walls and partitions.'
    },
    {
      name: 'High Strength Fly Ash Bricks',
      categoryId: categories['eent'].id,
      brandId: null,
      defaultUnit: 'PIECE',
      description: 'Uniform, smooth machine pressed thermal resistant fly ash bricks.'
    },
    {
      name: 'Concrete Solid Cement Masonry Bricks',
      categoryId: categories['eent'].id,
      brandId: null,
      defaultUnit: 'PIECE',
      description: 'High compressive strength solid concrete building bricks.'
    },

    // --- BLOCKS / AAC ---
    {
      name: 'Standard AAC Lightweight Block 4-inch',
      categoryId: categories['blocks'].id,
      brandId: brands['Magicrete'] ? brands['Magicrete'].id : null,
      defaultUnit: 'PIECE',
      description: 'Autoclaved Aerated Concrete Block 600x200x100 mm for internal walls.'
    },
    {
      name: 'Standard AAC Lightweight Block 6-inch',
      categoryId: categories['blocks'].id,
      brandId: brands['Magicrete'] ? brands['Magicrete'].id : null,
      defaultUnit: 'PIECE',
      description: 'Autoclaved Aerated Concrete Block 600x200x150 mm for external walls.'
    },
    {
      name: 'Standard AAC Lightweight Block 8-inch',
      categoryId: categories['blocks'].id,
      brandId: brands['Magicrete'] ? brands['Magicrete'].id : null,
      defaultUnit: 'PIECE',
      description: 'Heavy duty 8-inch thermal insulated AAC Block 600x200x200 mm.'
    },
    {
      name: 'Concrete Hollow Boundary Blocks',
      categoryId: categories['blocks'].id,
      brandId: null,
      defaultUnit: 'PIECE',
      description: 'Modular hollow cement blocks 400x200x200 mm for boundary fencing.'
    }
  ];

  const masterProducts: any[] = [];
  for (const mp of masterProductsData) {
    const existing = await prisma.masterProduct.findFirst({
      where: { name: mp.name }
    });
    if (existing) {
      masterProducts.push(existing);
    } else {
      const created = await prisma.masterProduct.create({
        data: mp
      });
      masterProducts.push(created);
    }
  }
  console.log(`📦 Seeded ${masterProducts.length} Master Products`);

  // 5. Users & Roles
  const adminPassword = await bcrypt.hash('admin123', 10);
  const supplierPassword = await bcrypt.hash('supplier123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  // Admin User
  await prisma.user.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: {
      phone: '9999999999',
      passwordHash: adminPassword,
      role: 'ADMIN'
    }
  });

  // 5. Suppliers (3 Active Dealers & Yards in Darbhanga)
  // Supplier 1: Gupta Building Materials
  const supplierUser1 = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      phone: '9876543210',
      passwordHash: supplierPassword,
      role: 'SUPPLIER'
    }
  });

  const supplier1 = await prisma.supplier.upsert({
    where: { userId: supplierUser1.id },
    update: {
      businessName: 'Gupta Building Materials',
      ownerName: 'Manoj Gupta',
      phone: '9876543210',
      address: 'Near Donar Chowk, Darbhanga',
      districtId: darbhanga.id,
      gstin: '10AAACG1234F1Z5',
      status: 'ACTIVE',
      rating: 4.8,
      totalOrdersCount: 42,
      isVerified: true,
      description: 'Authorized UltraTech and Tata Tiscon dealer in Darbhanga. Direct stock of Koelwar sand and Pakur black stone chips.'
    },
    create: {
      userId: supplierUser1.id,
      businessName: 'Gupta Building Materials',
      ownerName: 'Manoj Gupta',
      phone: '9876543210',
      address: 'Near Donar Chowk, Darbhanga',
      districtId: darbhanga.id,
      gstin: '10AAACG1234F1Z5',
      status: 'ACTIVE',
      rating: 4.8,
      totalOrdersCount: 42,
      isVerified: true,
      description: 'Authorized UltraTech and Tata Tiscon dealer in Darbhanga. Direct stock of Koelwar sand and Pakur black stone chips.'
    }
  });

  // Supplier 2: Singh Traders & Steels
  const supplierUser2 = await prisma.user.upsert({
    where: { phone: '9876543211' },
    update: {},
    create: {
      phone: '9876543211',
      passwordHash: supplierPassword,
      role: 'SUPPLIER'
    }
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { userId: supplierUser2.id },
    update: {
      businessName: 'Singh Traders & Steels',
      ownerName: 'Rameshwar Singh',
      phone: '9876543211',
      address: 'Laheriasarai Main Road, Darbhanga',
      districtId: darbhanga.id,
      gstin: '10BBBCS5678F1Z9',
      status: 'ACTIVE',
      rating: 4.7,
      totalOrdersCount: 38,
      isVerified: true,
      description: 'Prime wholesale dealer for Tata Tiscon 550D, Jindal Panther, and Balmukund TMT. Bulk site delivery with digital weighbridge slip.'
    },
    create: {
      userId: supplierUser2.id,
      businessName: 'Singh Traders & Steels',
      ownerName: 'Rameshwar Singh',
      phone: '9876543211',
      address: 'Laheriasarai Main Road, Darbhanga',
      districtId: darbhanga.id,
      gstin: '10BBBCS5678F1Z9',
      status: 'ACTIVE',
      rating: 4.7,
      totalOrdersCount: 38,
      isVerified: true,
      description: 'Prime wholesale dealer for Tata Tiscon 550D, Jindal Panther, and Balmukund TMT. Bulk site delivery with digital weighbridge slip.'
    }
  });

  // Supplier 3: Maa Durga Aggregates & Bricks Depot
  const supplierUser3 = await prisma.user.upsert({
    where: { phone: '9876543212' },
    update: {},
    create: {
      phone: '9876543212',
      passwordHash: supplierPassword,
      role: 'SUPPLIER'
    }
  });

  const supplier3 = await prisma.supplier.upsert({
    where: { userId: supplierUser3.id },
    update: {
      businessName: 'Maa Durga Aggregates & Bricks Depot',
      ownerName: 'Rajeshwar Choudhary',
      phone: '9876543212',
      address: 'Benta-Mirzapur Bypass, Darbhanga',
      districtId: darbhanga.id,
      gstin: '10CCCMD9012F1Z3',
      status: 'ACTIVE',
      rating: 4.9,
      totalOrdersCount: 56,
      isVerified: true,
      description: 'Direct yard for Sone river sand, Pakur black 20mm/10mm gitti, Kiln-burnt 1st class red bricks, and Magicrete AAC blocks.'
    },
    create: {
      userId: supplierUser3.id,
      businessName: 'Maa Durga Aggregates & Bricks Depot',
      ownerName: 'Rajeshwar Choudhary',
      phone: '9876543212',
      address: 'Benta-Mirzapur Bypass, Darbhanga',
      districtId: darbhanga.id,
      gstin: '10CCCMD9012F1Z3',
      status: 'ACTIVE',
      rating: 4.9,
      totalOrdersCount: 56,
      isVerified: true,
      description: 'Direct yard for Sone river sand, Pakur black 20mm/10mm gitti, Kiln-burnt 1st class red bricks, and Magicrete AAC blocks.'
    }
  });

  // Supplier Service Areas
  for (const sup of [supplier1, supplier2, supplier3]) {
    await prisma.supplierServiceArea.upsert({
      where: { supplierId_districtId: { supplierId: sup.id, districtId: darbhanga.id } },
      update: {},
      create: { supplierId: sup.id, districtId: darbhanga.id }
    });
  }
  // Maa Durga also covers Madhubani
  await prisma.supplierServiceArea.upsert({
    where: { supplierId_districtId: { supplierId: supplier3.id, districtId: madhubani.id } },
    update: {},
    create: { supplierId: supplier3.id, districtId: madhubani.id }
  });

  console.log('🏬 Seeded 3 Active Suppliers: Gupta Building Materials, Singh Traders & Steels, Maa Durga Aggregates');

  // 6. Deep Supplier Products & Competitive Pricing Matrix
  const addSuppProduct = async (
    supplierId: string,
    prodNameMatch: string,
    price: number,
    unit: string,
    stock: number,
    minQty: number,
    freight: number
  ) => {
    const mp = masterProducts.find((p) => p.name.toLowerCase().includes(prodNameMatch.toLowerCase()));
    if (!mp) return;
    await prisma.supplierProduct.upsert({
      where: { supplierId_masterProductId: { supplierId, masterProductId: mp.id } },
      update: {
        sellingPrice: price,
        stockQuantity: stock,
        minOrderQty: minQty,
        deliveryCharge: freight,
        isAvailable: true
      },
      create: {
        supplierId,
        masterProductId: mp.id,
        sellingPrice: price,
        unit,
        stockQuantity: stock,
        minOrderQty: minQty,
        deliveryCharge: freight,
        isAvailable: true,
        lowStockThreshold: 15
      }
    });
  };

  // Supplier 1: Gupta Building Materials Products
  await addSuppProduct(supplier1.id, 'UltraTech Weather', 385, 'BAG', 320, 10, 250);
  await addSuppProduct(supplier1.id, 'ACC Suraksha', 390, 'BAG', 180, 10, 250);
  await addSuppProduct(supplier1.id, 'Dalmia DSP', 375, 'BAG', 150, 20, 250);
  await addSuppProduct(supplier1.id, 'Tata Tiscon 550D TMT Bar 12mm', 72, 'KG', 4500, 200, 300);
  await addSuppProduct(supplier1.id, 'Tata Tiscon 550D TMT Bar 10mm', 73, 'KG', 3000, 200, 300);
  await addSuppProduct(supplier1.id, 'Koel River', 65, 'CFT', 1400, 200, 350);
  await addSuppProduct(supplier1.id, 'Pakur 20mm', 85, 'CFT', 900, 100, 350);
  await addSuppProduct(supplier1.id, '1 Number Eent', 11, 'PIECE', 25000, 1000, 600);
  await addSuppProduct(supplier1.id, '6-inch', 115, 'PIECE', 800, 50, 400);

  // Supplier 2: Singh Traders & Steels Products (TMT & Cement Competitive rates)
  await addSuppProduct(supplier2.id, 'UltraTech Weather', 378, 'BAG', 110, 20, 400);
  await addSuppProduct(supplier2.id, 'Ambuja Kawach', 382, 'BAG', 240, 15, 350);
  await addSuppProduct(supplier2.id, 'Shree Jung Rodhak', 365, 'BAG', 200, 20, 300);
  await addSuppProduct(supplier2.id, 'Tata Tiscon 550D TMT Bar 8mm', 75, 'KG', 3500, 200, 350);
  await addSuppProduct(supplier2.id, 'Tata Tiscon 550D TMT Bar 10mm', 71.5, 'KG', 6000, 300, 400);
  await addSuppProduct(supplier2.id, 'Tata Tiscon 550D TMT Bar 12mm', 70.5, 'KG', 8500, 500, 450);
  await addSuppProduct(supplier2.id, 'Tata Tiscon 550D TMT Bar 16mm', 69.5, 'KG', 7000, 500, 450);
  await addSuppProduct(supplier2.id, 'Jindal Panther Fe550D TMT Rebar 12mm', 68.5, 'KG', 5000, 300, 400);
  await addSuppProduct(supplier2.id, 'Jindal Panther Fe550D TMT Rebar 16mm', 67.5, 'KG', 4500, 400, 400);
  await addSuppProduct(supplier2.id, 'Balmukund Super Fe500D 12mm', 64.5, 'KG', 6000, 250, 350);

  // Supplier 3: Maa Durga Aggregates & Bricks Depot Products
  await addSuppProduct(supplier3.id, 'Koel River', 62, 'CFT', 3500, 300, 300);
  await addSuppProduct(supplier3.id, 'Sone River', 58, 'CFT', 4000, 300, 300);
  await addSuppProduct(supplier3.id, 'Plastering Fine', 48, 'CFT', 2500, 200, 250);
  await addSuppProduct(supplier3.id, 'Pakur 10mm', 88, 'CFT', 1800, 150, 350);
  await addSuppProduct(supplier3.id, 'Pakur 20mm', 82, 'CFT', 2800, 200, 350);
  await addSuppProduct(supplier3.id, '40mm Foundation', 76, 'CFT', 1200, 200, 350);
  await addSuppProduct(supplier3.id, 'Crushed Stone Dust', 42, 'CFT', 2000, 200, 300);
  await addSuppProduct(supplier3.id, '1 Number Eent', 10.5, 'PIECE', 60000, 2000, 500);
  await addSuppProduct(supplier3.id, '2 Number Eent', 9.2, 'PIECE', 40000, 2000, 500);
  await addSuppProduct(supplier3.id, 'Fly Ash Bricks', 7.5, 'PIECE', 30000, 2000, 400);
  await addSuppProduct(supplier3.id, '6-inch', 110, 'PIECE', 1500, 50, 350);
  await addSuppProduct(supplier3.id, '8-inch', 145, 'PIECE', 1200, 50, 350);

  console.log('📦 Seeded competitive price comparison products for all 3 suppliers');

  // 7. 10 Consumer Users across Darbhanga Localities
  const customersData = [
    {
      phone: '9123456789',
      fullName: 'Ravi Kumar',
      address: 'House No 42, Ward 12, Bahadurpur',
      landmark: 'Near Saraswati Mandir',
      pincode: '846001',
      type: 'Individual Homeowner'
    },
    {
      phone: '9123456781',
      fullName: 'Amitesh Jha',
      address: 'Jha Constructions, VIP Road, Allalpatti',
      landmark: 'Opposite State Bank Colony',
      pincode: '846003',
      type: 'Residential Contractor'
    },
    {
      phone: '9123456782',
      fullName: 'Ramesh Prasad Yadav',
      address: 'Yadav Builders Site Office, Donar Gumti',
      landmark: 'Near Railway Crossing',
      pincode: '846004',
      type: 'Civil Contractor'
    },
    {
      phone: '9123456783',
      fullName: 'Sunil Chaudhary',
      address: 'Mithila Enclave Site, Benta',
      landmark: 'Near DMCH Gate No 2',
      pincode: '846002',
      type: 'Site Supervisor'
    },
    {
      phone: '9123456784',
      fullName: 'Vikramaditya Singh',
      address: 'Rajput Heights, Mirzapur Bypass Road',
      landmark: 'Near Mirzapur Bridge',
      pincode: '846004',
      type: 'Commercial Builder'
    },
    {
      phone: '9123456785',
      fullName: 'Mohammad Imran Ansari',
      address: 'Ansari Masonry Works, Tower Chowk',
      landmark: 'Behind Jama Masjid',
      pincode: '846001',
      type: 'Masonry Contractor'
    },
    {
      phone: '9123456786',
      fullName: 'Pooja Kumari',
      address: 'Plot 18, Kabirchak Residential Enclave',
      landmark: 'Near Power Grid',
      pincode: '846009',
      type: 'Homeowner'
    },
    {
      phone: '9123456787',
      fullName: 'Dharmendra Mahto',
      address: 'Subhankarpur Main Road',
      landmark: 'Near High School Ground',
      pincode: '846006',
      type: 'Infrastructure Contractor'
    },
    {
      phone: '9123456788',
      fullName: 'Anand Mohan Mishra',
      address: 'Mishra Niwas, Kamtaul Road',
      landmark: 'Near Sanskrit College',
      pincode: '847304',
      type: 'Institution Committee'
    },
    {
      phone: '9123456780',
      fullName: 'Alok Ranjan',
      address: 'Mithila Homes, Laheriasarai',
      landmark: 'Near Polo Ground',
      pincode: '846001',
      type: 'Apartment Developer'
    }
  ];

  const seededCustomers: Record<string, any> = {};

  for (const cData of customersData) {
    const userRec = await prisma.user.upsert({
      where: { phone: cData.phone },
      update: {},
      create: {
        phone: cData.phone,
        passwordHash: customerPassword,
        role: 'CUSTOMER'
      }
    });

    const custRec = await prisma.customer.upsert({
      where: { userId: userRec.id },
      update: {
        fullName: cData.fullName,
        phone: cData.phone,
        defaultDistrictId: darbhanga.id
      },
      create: {
        userId: userRec.id,
        fullName: cData.fullName,
        phone: cData.phone,
        defaultDistrictId: darbhanga.id
      }
    });

    await prisma.customerAddress.upsert({
      where: { id: `addr-${custRec.id}` },
      update: {
        addressLine: cData.address,
        landmark: cData.landmark,
        pincode: cData.pincode
      },
      create: {
        id: `addr-${custRec.id}`,
        customerId: custRec.id,
        districtId: darbhanga.id,
        addressLine: cData.address,
        landmark: cData.landmark,
        pincode: cData.pincode,
        isDefault: true
      }
    });

    seededCustomers[cData.phone] = custRec;
  }

  console.log('👥 Seeded 10 Realistic Consumers across Darbhanga');

  // 8. Realistic Orders & Udhaar Ledger Records
  // Order 1: Ravi Kumar -> Gupta Building Materials
  const spGuptaCement = await prisma.supplierProduct.findFirst({
    where: { supplierId: supplier1.id, masterProduct: { name: { contains: 'UltraTech' } } }
  });
  if (spGuptaCement) {
    await prisma.order.upsert({
      where: { orderNumber: 'KLK-DRB-1001' },
      update: {
        status: 'OUT_FOR_DELIVERY',
        amountPaid: 10000,
        balancePending: 9500
      },
      create: {
        orderNumber: 'KLK-DRB-1001',
        customerId: seededCustomers['9123456789'].id,
        supplierId: supplier1.id,
        districtId: darbhanga.id,
        totalMaterialAmount: 19250,
        deliveryCharge: 250,
        finalTotal: 19500,
        amountPaid: 10000,
        balancePending: 9500,
        status: 'OUT_FOR_DELIVERY',
        paymentStatus: 'PARTIALLY_PAID',
        deliveryAddress: 'House No 42, Ward 12, Bahadurpur, Darbhanga',
        landmark: 'Near Saraswati Mandir',
        pincode: '846001',
        deliveryInstructions: 'Call before delivery. Truck can enter back gate.',
        siteContactPhone: '9123456789',
        items: {
          create: [
            {
              supplierProductId: spGuptaCement.id,
              masterProductName: 'UltraTech Weather Pro 50kg',
              unit: 'BAG',
              quantity: 50,
              unitPrice: 385,
              totalPrice: 19250
            }
          ]
        }
      }
    });

    await prisma.customerLedger.upsert({
      where: { supplierId_customerId: { supplierId: supplier1.id, customerId: seededCustomers['9123456789'].id } },
      update: {
        totalPurchased: 19500,
        totalPaid: 10000,
        outstandingBalance: 9500,
        lastOrderDate: new Date(),
        lastPaymentDate: new Date()
      },
      create: {
        supplierId: supplier1.id,
        customerId: seededCustomers['9123456789'].id,
        totalPurchased: 19500,
        totalPaid: 10000,
        outstandingBalance: 9500,
        lastOrderDate: new Date(),
        lastPaymentDate: new Date()
      }
    });
  }

  // Order 2: Amitesh Jha -> Singh Traders (Tata Tiscon 12mm 500 KG + Tata 10mm 300 KG) - CONFIRMED, PAID
  const spSinghTata12 = await prisma.supplierProduct.findFirst({
    where: { supplierId: supplier2.id, masterProduct: { name: { contains: '12mm' } } }
  });
  const spSinghTata10 = await prisma.supplierProduct.findFirst({
    where: { supplierId: supplier2.id, masterProduct: { name: { contains: '10mm' } } }
  });
  if (spSinghTata12 && spSinghTata10) {
    const o2Total = (500 * 70.5) + (300 * 71.5) + 450;
    const order2 = await prisma.order.upsert({
      where: { orderNumber: 'KLK-DRB-1002' },
      update: {},
      create: {
        orderNumber: 'KLK-DRB-1002',
        customerId: seededCustomers['9123456781'].id,
        supplierId: supplier2.id,
        districtId: darbhanga.id,
        totalMaterialAmount: 56700,
        deliveryCharge: 450,
        finalTotal: o2Total,
        amountPaid: o2Total,
        balancePending: 0,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        deliveryAddress: 'VIP Road, Allalpatti, Darbhanga',
        landmark: 'Opposite State Bank Colony',
        pincode: '846003',
        deliveryInstructions: 'Deliver to slab site behind SBI. Digital weigh slip required.',
        siteContactPhone: '9123456781',
        items: {
          create: [
            {
              supplierProductId: spSinghTata12.id,
              masterProductName: 'Tata Tiscon 550D TMT Bar 12mm',
              unit: 'KG',
              quantity: 500,
              unitPrice: 70.5,
              totalPrice: 35250
            },
            {
              supplierProductId: spSinghTata10.id,
              masterProductName: 'Tata Tiscon 550D TMT Bar 10mm',
              unit: 'KG',
              quantity: 300,
              unitPrice: 71.5,
              totalPrice: 21450
            }
          ]
        }
      }
    });

    await prisma.paymentRecord.create({
      data: {
        supplierId: supplier2.id,
        customerId: seededCustomers['9123456781'].id,
        orderId: order2.id,
        amount: o2Total,
        paymentMode: 'UPI_DIRECT',
        notes: 'Paid full via UPI to Singh Traders'
      }
    });
  }

  // Order 3: Ramesh Prasad Yadav -> Maa Durga Aggregates - DELIVERED, PAID
  const spDurgaSand = await prisma.supplierProduct.findFirst({
    where: { supplierId: supplier3.id, masterProduct: { name: { contains: 'Koel' } } }
  });
  const spDurgaGitti = await prisma.supplierProduct.findFirst({
    where: { supplierId: supplier3.id, masterProduct: { name: { contains: 'Pakur 20mm' } } }
  });
  if (spDurgaSand && spDurgaGitti) {
    const o3Mat = (600 * 62) + (400 * 82);
    const o3Total = o3Mat + 500;
    const order3 = await prisma.order.upsert({
      where: { orderNumber: 'KLK-DRB-1003' },
      update: {},
      create: {
        orderNumber: 'KLK-DRB-1003',
        customerId: seededCustomers['9123456782'].id,
        supplierId: supplier3.id,
        districtId: darbhanga.id,
        totalMaterialAmount: o3Mat,
        deliveryCharge: 500,
        finalTotal: o3Total,
        amountPaid: o3Total,
        balancePending: 0,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        deliveryAddress: 'Donar Gumti Construction Site, Darbhanga',
        landmark: 'Near Railway Crossing',
        pincode: '846004',
        deliveryInstructions: 'Dump on empty plot next to site cabin.',
        siteContactPhone: '9123456782',
        items: {
          create: [
            {
              supplierProductId: spDurgaSand.id,
              masterProductName: 'Koel River Coarse Red Sand (Lal Balu)',
              unit: 'CFT',
              quantity: 600,
              unitPrice: 62,
              totalPrice: 37200
            },
            {
              supplierProductId: spDurgaGitti.id,
              masterProductName: 'Pakur 20mm Blue Metal Gitti',
              unit: 'CFT',
              quantity: 400,
              unitPrice: 82,
              totalPrice: 32800
            }
          ]
        }
      }
    });

    await prisma.paymentRecord.create({
      data: {
        supplierId: supplier3.id,
        customerId: seededCustomers['9123456782'].id,
        orderId: order3.id,
        amount: o3Total,
        paymentMode: 'CASH',
        notes: 'Cash collected by tipper driver upon unloading'
      }
    });
  }

  // Order 4: Sunil Chaudhary -> Gupta Building Materials - PENDING
  const spGuptaBricks = await prisma.supplierProduct.findFirst({
    where: { supplierId: supplier1.id, masterProduct: { name: { contains: '1 Number' } } }
  });
  if (spGuptaBricks) {
    const o4Total = (4000 * 11) + 600;
    await prisma.order.upsert({
      where: { orderNumber: 'KLK-DRB-1004' },
      update: {},
      create: {
        orderNumber: 'KLK-DRB-1004',
        customerId: seededCustomers['9123456783'].id,
        supplierId: supplier1.id,
        districtId: darbhanga.id,
        totalMaterialAmount: 44000,
        deliveryCharge: 600,
        finalTotal: o4Total,
        amountPaid: 0,
        balancePending: o4Total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        deliveryAddress: 'Mithila Enclave Site, Benta, Darbhanga',
        landmark: 'Near DMCH Gate No 2',
        pincode: '846002',
        deliveryInstructions: 'Needs 2 small tractor loads due to narrow road.',
        siteContactPhone: '9123456783',
        items: {
          create: [
            {
              supplierProductId: spGuptaBricks.id,
              masterProductName: 'Red Clay Kiln Brick (1 Number Eent)',
              unit: 'PIECE',
              quantity: 4000,
              unitPrice: 11,
              totalPrice: 44000
            }
          ]
        }
      }
    });

    await prisma.customerLedger.upsert({
      where: { supplierId_customerId: { supplierId: supplier1.id, customerId: seededCustomers['9123456783'].id } },
      update: {
        totalPurchased: 45000,
        totalPaid: 30000,
        outstandingBalance: 15000,
        lastOrderDate: new Date(),
        lastPaymentDate: new Date()
      },
      create: {
        supplierId: supplier1.id,
        customerId: seededCustomers['9123456783'].id,
        totalPurchased: 45000,
        totalPaid: 30000,
        outstandingBalance: 15000,
        lastOrderDate: new Date(),
        lastPaymentDate: new Date()
      }
    });
  }

  // Order 5: Vikramaditya Singh -> Singh Traders - OUT_FOR_DELIVERY with Udhaar
  const spSinghJindal16 = await prisma.supplierProduct.findFirst({
    where: { supplierId: supplier2.id, masterProduct: { name: { contains: 'Jindal' } } }
  });
  if (spSinghJindal16 && spSinghTata10) {
    const o5Mat = (1000 * 67.5) + (400 * 71.5);
    const o5Total = o5Mat + 500;
    const o5Paid = 50000;
    const o5Pending = o5Total - o5Paid;

    await prisma.order.upsert({
      where: { orderNumber: 'KLK-DRB-1005' },
      update: {},
      create: {
        orderNumber: 'KLK-DRB-1005',
        customerId: seededCustomers['9123456784'].id,
        supplierId: supplier2.id,
        districtId: darbhanga.id,
        totalMaterialAmount: o5Mat,
        deliveryCharge: 500,
        finalTotal: o5Total,
        amountPaid: o5Paid,
        balancePending: o5Pending,
        status: 'OUT_FOR_DELIVERY',
        paymentStatus: 'PARTIALLY_PAID',
        deliveryAddress: 'Rajput Heights, Mirzapur Bypass Road, Darbhanga',
        landmark: 'Near Mirzapur Bridge',
        pincode: '846004',
        deliveryInstructions: 'Crane available at site for bundle unloading.',
        siteContactPhone: '9123456784',
        items: {
          create: [
            {
              supplierProductId: spSinghJindal16.id,
              masterProductName: 'Jindal Panther Fe550D TMT Rebar 16mm',
              unit: 'KG',
              quantity: 1000,
              unitPrice: 67.5,
              totalPrice: 67500
            },
            {
              supplierProductId: spSinghTata10.id,
              masterProductName: 'Tata Tiscon 550D TMT Bar 10mm',
              unit: 'KG',
              quantity: 400,
              unitPrice: 71.5,
              totalPrice: 28600
            }
          ]
        }
      }
    });

    await prisma.paymentRecord.create({
      data: {
        supplierId: supplier2.id,
        customerId: seededCustomers['9123456784'].id,
        amount: o5Paid,
        paymentMode: 'CHEQUE',
        notes: 'Chq No 448201 HDFC Bank advance'
      }
    });

    await prisma.customerLedger.upsert({
      where: { supplierId_customerId: { supplierId: supplier2.id, customerId: seededCustomers['9123456784'].id } },
      update: {
        totalPurchased: o5Total,
        totalPaid: o5Paid,
        outstandingBalance: o5Pending,
        lastOrderDate: new Date(),
        lastPaymentDate: new Date()
      },
      create: {
        supplierId: supplier2.id,
        customerId: seededCustomers['9123456784'].id,
        totalPurchased: o5Total,
        totalPaid: o5Paid,
        outstandingBalance: o5Pending,
        lastOrderDate: new Date(),
        lastPaymentDate: new Date()
      }
    });
  }

  // Order 6: Mohammad Imran Ansari -> Maa Durga Aggregates - CONFIRMED with Udhaar
  const spDurgaBricks = await prisma.supplierProduct.findFirst({
    where: { supplierId: supplier3.id, masterProduct: { name: { contains: '1 Number' } } }
  });
  if (spDurgaBricks) {
    const o6Total = (3000 * 10.5) + 500;
    await prisma.order.upsert({
      where: { orderNumber: 'KLK-DRB-1006' },
      update: {},
      create: {
        orderNumber: 'KLK-DRB-1006',
        customerId: seededCustomers['9123456785'].id,
        supplierId: supplier3.id,
        districtId: darbhanga.id,
        totalMaterialAmount: 31500,
        deliveryCharge: 500,
        finalTotal: o6Total,
        amountPaid: 15000,
        balancePending: 17000,
        status: 'CONFIRMED',
        paymentStatus: 'PARTIALLY_PAID',
        deliveryAddress: 'Ansari Masonry Site, Tower Chowk, Darbhanga',
        landmark: 'Behind Jama Masjid',
        pincode: '846001',
        deliveryInstructions: 'Early morning delivery before market opens.',
        siteContactPhone: '9123456785',
        items: {
          create: [
            {
              supplierProductId: spDurgaBricks.id,
              masterProductName: 'Red Clay Kiln Brick (1 Number Eent)',
              unit: 'PIECE',
              quantity: 3000,
              unitPrice: 10.5,
              totalPrice: 31500
            }
          ]
        }
      }
    });

    await prisma.customerLedger.upsert({
      where: { supplierId_customerId: { supplierId: supplier3.id, customerId: seededCustomers['9123456785'].id } },
      update: {
        totalPurchased: 32000,
        totalPaid: 15000,
        outstandingBalance: 17000,
        lastOrderDate: new Date(),
        lastPaymentDate: new Date()
      },
      create: {
        supplierId: supplier3.id,
        customerId: seededCustomers['9123456785'].id,
        totalPurchased: 32000,
        totalPaid: 15000,
        outstandingBalance: 17000,
        lastOrderDate: new Date(),
        lastPaymentDate: new Date()
      }
    });
  }

  // Order 7: Alok Ranjan -> Maa Durga Aggregates - PENDING
  const spDurgaBlocks = await prisma.supplierProduct.findFirst({
    where: { supplierId: supplier3.id, masterProduct: { name: { contains: '6-inch' } } }
  });
  if (spDurgaBlocks) {
    const o7Total = (500 * 110) + 400;
    await prisma.order.upsert({
      where: { orderNumber: 'KLK-DRB-1007' },
      update: {},
      create: {
        orderNumber: 'KLK-DRB-1007',
        customerId: seededCustomers['9123456780'].id,
        supplierId: supplier3.id,
        districtId: darbhanga.id,
        totalMaterialAmount: 55000,
        deliveryCharge: 400,
        finalTotal: o7Total,
        amountPaid: 0,
        balancePending: o7Total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        deliveryAddress: 'Mithila Homes Project, Laheriasarai, Darbhanga',
        landmark: 'Near Polo Ground',
        pincode: '846001',
        deliveryInstructions: 'Dump near block stacking area beside tower B.',
        siteContactPhone: '9123456780',
        items: {
          create: [
            {
              supplierProductId: spDurgaBlocks.id,
              masterProductName: 'Standard AAC Lightweight Block 6-inch',
              unit: 'PIECE',
              quantity: 500,
              unitPrice: 110,
              totalPrice: 55000
            }
          ]
        }
      }
    });
  }

  // Order 8: Pooja Kumari -> Gupta Building Materials - DELIVERED, PAID
  const spGuptaAcc = await prisma.supplierProduct.findFirst({
    where: { supplierId: supplier1.id, masterProduct: { name: { contains: 'ACC' } } }
  });
  if (spGuptaAcc) {
    const o8Total = (60 * 390) + 250;
    const order8 = await prisma.order.upsert({
      where: { orderNumber: 'KLK-DRB-1008' },
      update: {},
      create: {
        orderNumber: 'KLK-DRB-1008',
        customerId: seededCustomers['9123456786'].id,
        supplierId: supplier1.id,
        districtId: darbhanga.id,
        totalMaterialAmount: 23400,
        deliveryCharge: 250,
        finalTotal: o8Total,
        amountPaid: o8Total,
        balancePending: 0,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        deliveryAddress: 'Plot 18, Kabirchak Residential Enclave, Darbhanga',
        landmark: 'Near Power Grid',
        pincode: '846009',
        deliveryInstructions: 'Stack bags on plastic sheet inside covered garage.',
        siteContactPhone: '9123456786',
        items: {
          create: [
            {
              supplierProductId: spGuptaAcc.id,
              masterProductName: 'ACC Suraksha Power PPC 50kg',
              unit: 'BAG',
              quantity: 60,
              unitPrice: 390,
              totalPrice: 23400
            }
          ]
        }
      }
    });

    await prisma.paymentRecord.create({
      data: {
        supplierId: supplier1.id,
        customerId: seededCustomers['9123456786'].id,
        orderId: order8.id,
        amount: o8Total,
        paymentMode: 'UPI_DIRECT',
        notes: 'Google Pay transaction to dealer UPI'
      }
    });
  }

  console.log('📋 Seeded 8 realistic mock orders and Udhaar ledger balances');
  console.log('✅ Full database seed completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Demo Credentials:');
  console.log('  Admin:');
  console.log('    9999999999 / admin123 (Platform Operations)');
  console.log('  Suppliers (3 Active Yards in Darbhanga):');
  console.log('    9876543210 / supplier123 (Gupta Building Materials - Donar Chowk)');
  console.log('    9876543211 / supplier123 (Singh Traders & Steels - Laheriasarai)');
  console.log('    9876543212 / supplier123 (Maa Durga Aggregates & Bricks - Benta)');
  console.log('  Consumers (10 Active Local Buyers, all password "customer123"):');
  customersData.forEach((c) => {
    console.log(`    ${c.phone} / customer123 (${c.fullName} - ${c.type})`);
  });
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


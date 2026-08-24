import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Roles
  const rolesData = [
    { name: 'Super Admin', description: 'Full system access' },
    { name: 'Admin', description: 'Full operational access except system configuration' },
    { name: 'Management', description: 'Read access to all business data and reports' },
    { name: 'Sales', description: 'Access to leads, customers, activities and sales reports' },
    { name: 'Accounts', description: 'Access to billing, invoices, payments and financial reports' },
    { name: 'Support', description: 'Access to customer support tickets and installations' },
    { name: 'Installation Team', description: 'Access to installations and outlets' },
    { name: 'Read Only', description: 'View-only access across modules' },
  ];

  const rolesMap: Record<string, string> = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description, status: 'ACTIVE' },
    });
    rolesMap[r.name] = role.id;
  }
  console.log('✅ Roles seeded:', Object.keys(rolesMap).join(', '));

  // 2. Seed Modules & Permissions
  const modules = [
    'users', 'roles', 'customers', 'contacts', 'outlets',
    'installations', 'products', 'plans', 'licenses', 'renewals',
    'invoices', 'payments', 'leads', 'activities', 'tickets',
    'reports', 'settings', 'audit_logs'
  ];
  const actions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'EXPORT'];

  const permissionsToCreate = [];
  for (const moduleName of modules) {
    for (const actionName of actions) {
      permissionsToCreate.push({
        module: moduleName,
        action: actionName,
        description: `${actionName} permission for ${moduleName}`,
      });
    }
  }

  await prisma.permission.createMany({
    data: permissionsToCreate,
    skipDuplicates: true,
  });

  const allPermissions = await prisma.permission.findMany();
  console.log(`✅ Permissions seeded: ${allPermissions.length} total permissions in DB.`);

  // Link all permissions to Super Admin role
  const superAdminRoleId = rolesMap['Super Admin'];
  const rolePermissionsData = allPermissions.map((p) => ({
    roleId: superAdminRoleId,
    permissionId: p.id,
  }));

  await prisma.rolePermission.createMany({
    data: rolePermissionsData,
    skipDuplicates: true,
  });

  // 3. Seed Users
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  const usersData = [
    { employeeCode: 'EMP001', name: 'Super Admin', email: 'admin@example.com', role: 'Super Admin' },
    { employeeCode: 'EMP002', name: 'System Manager', email: 'manager@example.com', role: 'Management' },
    { employeeCode: 'EMP003', name: 'Sales Lead', email: 'sales@example.com', role: 'Sales' },
    { employeeCode: 'EMP004', name: 'Accounts Officer', email: 'accounts@example.com', role: 'Accounts' },
    { employeeCode: 'EMP005', name: 'Support Tech', email: 'support@example.com', role: 'Support' },
    { employeeCode: 'EMP006', name: 'Field Installer', email: 'installer@example.com', role: 'Installation Team' },
  ];

  const usersMap: Record<string, string> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        employeeCode: u.employeeCode,
        name: u.name,
        email: u.email,
        passwordHash: defaultPasswordHash,
        roleId: rolesMap[u.role],
        status: 'ACTIVE',
      },
    });
    usersMap[u.email] = user.id;
  }
  console.log('✅ Default users seeded (Password: Password123!).');

  // 4. Seed Master Products & Plans
  const productsData = [
    {
      productCode: 'POS-RETAIL',
      name: 'POS Retail Standard',
      description: 'Retail POS solution for supermarkets and stores',
      version: 'v4.2',
      plans: [
        { planCode: 'RETAIL-STD-ANNUAL', name: 'Annual Standard Plan', billingPeriod: 'YEARLY', price: 12000, maxTerminals: 2, maxUsers: 5 },
        { planCode: 'RETAIL-STD-LIFE', name: 'Lifetime License', billingPeriod: 'LIFETIME', price: 35000, maxTerminals: 5, maxUsers: 10 },
      ]
    },
    {
      productCode: 'POS-REST',
      name: 'POS Restaurant Pro',
      description: 'Restaurant management, KDS and table billing POS',
      version: 'v5.0',
      plans: [
        { planCode: 'REST-PRO-ANNUAL', name: 'Pro Annual Plan', billingPeriod: 'YEARLY', price: 18000, maxTerminals: 3, maxUsers: 8 },
      ]
    },
    {
      productCode: 'POS-ENT',
      name: 'POS Enterprise Suite',
      description: 'Multi-outlet chain management system',
      version: 'v6.1',
      plans: [
        { planCode: 'ENT-CHAIN-YEARLY', name: 'Chain Yearly Enterprise', billingPeriod: 'YEARLY', price: 45000, maxTerminals: 10, maxUsers: 25 },
      ]
    }
  ];

  const productMap: Record<string, { id: string, plans: Record<string, string> }> = {};

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { productCode: p.productCode },
      update: {},
      create: {
        productCode: p.productCode,
        name: p.name,
        description: p.description,
        version: p.version,
        status: 'ACTIVE',
      },
    });

    const planMap: Record<string, string> = {};
    for (const plan of p.plans) {
      const createdPlan = await prisma.productPlan.upsert({
        where: { productId_planCode: { productId: product.id, planCode: plan.planCode } },
        update: {},
        create: {
          productId: product.id,
          planCode: plan.planCode,
          name: plan.name,
          billingPeriod: plan.billingPeriod,
          price: plan.price,
          maxTerminals: plan.maxTerminals,
          maxUsers: plan.maxUsers,
          status: 'ACTIVE',
        },
      });
      planMap[plan.planCode] = createdPlan.id;
    }

    productMap[p.productCode] = { id: product.id, plans: planMap };
  }
  console.log('✅ Seeded master Products & Plans.');

  // 5. Seed Sample Customer, Outlets, Installations & Licenses
  const customer = await prisma.customer.upsert({
    where: { customerCode: 'CUST-1001' },
    update: {},
    create: {
      customerCode: 'CUST-1001',
      businessName: 'Apex Hypermarket Pvt Ltd',
      displayName: 'Apex Hypermarket',
      customerType: 'RETAIL_CHAIN',
      businessType: 'Supermarket',
      phone: '+91 9876543210',
      email: 'contact@apexhypermarket.com',
      whatsapp: '+91 9876543210',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      status: 'ACTIVE',
      salesUserId: usersMap['sales@example.com'],
    },
  });

  const existingContact = await prisma.contact.findFirst({
    where: { customerId: customer.id, email: 'ramesh@apexhypermarket.com' },
  });

  const primaryContact = existingContact || await prisma.contact.create({
    data: {
      customerId: customer.id,
      name: 'Ramesh Kumar',
      designation: 'General Manager',
      phone: '+91 9876543210',
      email: 'ramesh@apexhypermarket.com',
      isPrimary: true,
    },
  });

  const outlet = await prisma.outlet.upsert({
    where: { customerId_outletCode: { customerId: customer.id, outletCode: 'OUT-01' } },
    update: {},
    create: {
      customerId: customer.id,
      outletCode: 'OUT-01',
      outletName: 'Apex Indiranagar Branch',
      city: 'Bangalore',
      state: 'Karnataka',
      contactPerson: 'Ramesh Kumar',
      phone: '+91 9876543210',
      status: 'ACTIVE',
    },
  });

  const installation = await prisma.installation.upsert({
    where: { installationNumber: 'INS-2026-001' },
    update: {},
    create: {
      installationNumber: 'INS-2026-001',
      customerId: customer.id,
      outletId: outlet.id,
      productId: productMap['POS-RETAIL'].id,
      version: 'v4.2',
      terminalCount: 3,
      userCount: 5,
      installedById: usersMap['installer@example.com'],
      status: 'ACTIVE',
      installationDate: new Date('2026-01-15'),
      activationDate: new Date('2026-01-15'),
    },
  });

  const license = await prisma.license.upsert({
    where: { licenseNumber: 'LIC-2026-8801' },
    update: {},
    create: {
      licenseNumber: 'LIC-2026-8801',
      licenseKey: 'APEX-RETAIL-42-9842-8812-X901',
      customerId: customer.id,
      installationId: installation.id,
      productId: productMap['POS-RETAIL'].id,
      planId: productMap['POS-RETAIL'].plans['RETAIL-STD-ANNUAL'],
      licenseType: 'ANNUAL',
      startDate: new Date('2026-01-15'),
      expiryDate: new Date('2027-01-15'),
      terminalCount: 3,
      userCount: 5,
      price: 12000,
      totalAmount: 12000,
      status: 'ACTIVE',
      issuedById: usersMap['admin@example.com'],
    },
  });

  // Seed sample Invoice & Payment
  const invoice = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-0001' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-0001',
      customerId: customer.id,
      outletId: outlet.id,
      installationId: installation.id,
      invoiceDate: new Date('2026-01-15'),
      dueDate: new Date('2026-01-30'),
      invoiceType: 'NEW_LICENSE',
      subtotal: 12000,
      tax: 2160,
      totalAmount: 14160,
      amountPaid: 14160,
      balanceAmount: 0,
      status: 'PAID',
      createdById: usersMap['accounts@example.com'],
      items: {
        create: [
          {
            productId: productMap['POS-RETAIL'].id,
            description: 'POS Retail Standard Annual License',
            quantity: 1,
            unitPrice: 12000,
            tax: 2160,
            total: 14160,
          },
        ],
      },
    },
  });

  const existingPayment = await prisma.payment.findUnique({
    where: { receiptNumber: 'REC-2026-0001' },
  });

  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        receiptNumber: 'REC-2026-0001',
        invoiceId: invoice.id,
        customerId: customer.id,
        paymentDate: new Date('2026-01-18'),
        amount: 14160,
        paymentMethod: 'BANK_TRANSFER',
        referenceNumber: 'NEFT982301982',
        bankName: 'HDFC Bank',
        collectedById: usersMap['accounts@example.com'],
      },
    });
  }

  // Seed sample Ticket
  const existingTicket = await prisma.ticket.findUnique({
    where: { ticketNumber: 'TICK-2026-0101' },
  });

  if (!existingTicket) {
    await prisma.ticket.create({
      data: {
        ticketNumber: 'TICK-2026-0101',
        customerId: customer.id,
        outletId: outlet.id,
        installationId: installation.id,
        contactId: primaryContact.id,
        subject: 'Barcode scanner configuration issue',
        description: 'Zebra barcode scanner dropping leading zero on barcode scan',
        category: 'HARDWARE_INTEGRATION',
        priority: 'MEDIUM',
        assignedToId: usersMap['support@example.com'],
        status: 'IN_PROGRESS',
      },
    });
  }

  // 6. Seed Chart of Accounts (COA)
  const defaultAccounts = [
    { accountCode: '1010', accountName: 'Cash & Bank Account', accountType: 'ASSET', subCategory: 'CURRENT_ASSET', isSystem: true },
    { accountCode: '1020', accountName: 'Accounts Receivable', accountType: 'ASSET', subCategory: 'CURRENT_ASSET', isSystem: true },
    { accountCode: '1510', accountName: 'Fixed Assets - Hardware & Laptops', accountType: 'ASSET', subCategory: 'FIXED_ASSET', isSystem: false },
    { accountCode: '1520', accountName: 'Fixed Assets - Vehicles', accountType: 'ASSET', subCategory: 'FIXED_ASSET', isSystem: false },
    { accountCode: '1530', accountName: 'Fixed Assets - Furniture & Fixtures', accountType: 'ASSET', subCategory: 'FIXED_ASSET', isSystem: false },
    { accountCode: '1540', accountName: 'Fixed Assets - Software & Digital', accountType: 'ASSET', subCategory: 'FIXED_ASSET', isSystem: false },

    { accountCode: '2010', accountName: 'Accounts Payable (Vendors)', accountType: 'LIABILITY', subCategory: 'CURRENT_LIABILITY', isSystem: true },
    { accountCode: '2020', accountName: 'GST / Tax Payable', accountType: 'LIABILITY', subCategory: 'TAX_LIABILITY', isSystem: true },

    { accountCode: '3010', accountName: 'Owner / Share Capital', accountType: 'EQUITY', subCategory: 'CAPITAL', isSystem: true },
    { accountCode: '3020', accountName: 'Retained Earnings', accountType: 'EQUITY', subCategory: 'EQUITY', isSystem: true },

    { accountCode: '4010', accountName: 'Software License & Subscription Revenue', accountType: 'REVENUE', subCategory: 'OPERATING_REVENUE', isSystem: true },
    { accountCode: '4020', accountName: 'Consulting & Implementation Revenue', accountType: 'REVENUE', subCategory: 'OPERATING_REVENUE', isSystem: false },
    { accountCode: '4030', accountName: 'Other Miscellaneous Income', accountType: 'REVENUE', subCategory: 'OTHER_INCOME', isSystem: false },

    { accountCode: '5010', accountName: 'Salaries & Staff Wages', accountType: 'EXPENSE', subCategory: 'OPERATING_EXPENSE', isSystem: false },
    { accountCode: '5020', accountName: 'Office Rent & Facilities', accountType: 'EXPENSE', subCategory: 'OPERATING_EXPENSE', isSystem: false },
    { accountCode: '5030', accountName: 'Software Hosting & AWS Cloud Infrastructure', accountType: 'EXPENSE', subCategory: 'OPERATING_EXPENSE', isSystem: false },
    { accountCode: '5040', accountName: 'Marketing & Digital Ads', accountType: 'EXPENSE', subCategory: 'OPERATING_EXPENSE', isSystem: false },
    { accountCode: '5050', accountName: 'Utilities & Electricity', accountType: 'EXPENSE', subCategory: 'OPERATING_EXPENSE', isSystem: false },
    { accountCode: '5060', accountName: 'Office Supplies & Stationery', accountType: 'EXPENSE', subCategory: 'OPERATING_EXPENSE', isSystem: false },
    { accountCode: '5070', accountName: 'Travel & Conveyance', accountType: 'EXPENSE', subCategory: 'OPERATING_EXPENSE', isSystem: false },
    { accountCode: '5080', accountName: 'Depreciation Expense', accountType: 'EXPENSE', subCategory: 'OPERATING_EXPENSE', isSystem: true },
  ];

  const accountsMap: Record<string, string> = {};
  for (const acc of defaultAccounts) {
    const createdAcc = await prisma.account.upsert({
      where: { accountCode: acc.accountCode },
      update: {},
      create: acc,
    });
    accountsMap[acc.accountCode] = createdAcc.id;
  }
  console.log('✅ Seeded Chart of Accounts (20 accounts).');

  // Seed sample Journal Entries / Company Expenses
  const sampleExpenses = [
    {
      entryNumber: 'TXN-2026-0001',
      entryDate: new Date('2026-02-01'),
      type: 'EXPENSE',
      reference: 'BANK_TRANSFER',
      description: 'Office Rent Payment for February 2026',
      expenseAccCode: '5020', // Rent
      bankAccCode: '1010',
      amount: 45000,
    },
    {
      entryNumber: 'TXN-2026-0002',
      entryDate: new Date('2026-02-05'),
      type: 'EXPENSE',
      reference: 'CREDIT_CARD',
      description: 'AWS Cloud Server Hosting & Infrastructure Bill',
      expenseAccCode: '5030', // Cloud Hosting
      bankAccCode: '1010',
      amount: 18500,
    },
    {
      entryNumber: 'TXN-2026-0003',
      entryDate: new Date('2026-02-10'),
      type: 'EXPENSE',
      reference: 'BANK_TRANSFER',
      description: 'Engineering Staff Monthly Salaries',
      expenseAccCode: '5010', // Salaries
      bankAccCode: '1010',
      amount: 120000,
    },
  ];

  for (const exp of sampleExpenses) {
    await prisma.journalEntry.upsert({
      where: { entryNumber: exp.entryNumber },
      update: {},
      create: {
        entryNumber: exp.entryNumber,
        entryDate: exp.entryDate,
        type: exp.type,
        reference: exp.reference,
        description: exp.description,
        createdById: usersMap['admin@example.com'],
        lines: {
          create: [
            {
              accountId: accountsMap[exp.expenseAccCode],
              debit: exp.amount,
              credit: 0,
              memo: exp.description,
            },
            {
              accountId: accountsMap[exp.bankAccCode],
              debit: 0,
              credit: exp.amount,
              memo: `Paid via ${exp.reference}`,
            },
          ],
        },
      },
    });
  }
  console.log('✅ Seeded sample Company Expenses & Double-Entry Vouchers.');

  // 7. Seed Sample Company Assets
  const sampleAssets = [
    {
      assetCode: 'AST-2026-001',
      assetName: 'Dell XPS 15 Developer Laptop (16GB RAM, 1TB SSD)',
      category: 'HARDWARE',
      serialNumber: 'SN-DELL-982103',
      purchaseDate: new Date('2026-01-10'),
      purchaseCost: 115000,
      currentValue: 105000,
      depreciationRate: 15.0,
      location: 'Bangalore HQ Office',
      assignedToId: usersMap['installer@example.com'],
      status: 'IN_USE',
      notes: 'Primary developer workstation assigned to field team',
    },
    {
      assetCode: 'AST-2026-002',
      assetName: 'Rack Server 2U (Intel Xeon, 64GB RAM)',
      category: 'HARDWARE',
      serialNumber: 'SN-HP-771204',
      purchaseDate: new Date('2026-01-05'),
      purchaseCost: 220000,
      currentValue: 200000,
      depreciationRate: 20.0,
      location: 'Datacenter Rack 4B',
      status: 'IN_USE',
      notes: 'On-premise build and license key verification node',
    },
    {
      assetCode: 'AST-2026-003',
      assetName: 'Ergonomic Executive Office Workstations (Set of 6)',
      category: 'FURNITURE',
      serialNumber: 'FURN-2026-SET6',
      purchaseDate: new Date('2026-01-15'),
      purchaseCost: 65000,
      currentValue: 62000,
      depreciationRate: 10.0,
      location: 'Bangalore HQ Office',
      status: 'IN_USE',
      notes: 'Modular office furniture for operations team',
    },
  ];

  for (const asset of sampleAssets) {
    await prisma.companyAsset.upsert({
      where: { assetCode: asset.assetCode },
      update: {},
      create: asset,
    });
  }
  console.log('✅ Seeded sample Company Assets.');

  console.log('🎉 ALL SEED DATA SUCCESSFULLY CREATED IN SUPABASE DATABASE!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

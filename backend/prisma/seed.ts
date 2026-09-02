import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('[Seed] Starting database seeding...');

  // 1. Create Roles
  const roles = [
    { name: 'ADMIN', description: 'System Administrator with full access' },
    { name: 'MANAGER', description: 'General Manager with operational access' },
    { name: 'INVENTORY_STAFF', description: 'Inventory clerk responsible for products and stock' },
    { name: 'SALES_STAFF', description: 'Sales agent handles sales orders and clients' },
    { name: 'WAREHOUSE_MANAGER', description: 'Warehouse manager handles stock movements and transfers' }
  ];

  const dbRoles: Record<string, any> = {};
  for (const r of roles) {
    dbRoles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r
    });
  }
  console.log(`[Seed] Seeded ${roles.length} roles.`);

  // 2. Create Permissions
  const permissions = [
    { name: 'READ_DASHBOARD', description: 'View dashboard analytics' },
    { name: 'MANAGE_USERS', description: 'CRUD users and update roles' },
    { name: 'READ_PRODUCTS', description: 'View products list' },
    { name: 'CREATE_PRODUCT', description: 'Add new products' },
    { name: 'UPDATE_PRODUCT', description: 'Edit existing products' },
    { name: 'DELETE_PRODUCT', description: 'Remove products' }
  ];

  const dbPermissions: Record<string, any> = {};
  for (const p of permissions) {
    dbPermissions[p.name] = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p
    });
  }
  console.log(`[Seed] Seeded ${permissions.length} permissions.`);

  // 3. Associate Permissions with Admin Role
  for (const p of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: dbRoles['ADMIN'].id,
          permissionId: dbPermissions[p.name].id
        }
      },
      update: {},
      create: {
        roleId: dbRoles['ADMIN'].id,
        permissionId: dbPermissions[p.name].id
      }
    });
  }
  console.log('[Seed] Associated all permissions with ADMIN role.');

  // 4. Create default ADMIN user
  const adminEmail = 'admin@stockpilot.com';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin@123', salt);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'System Admin',
      email: adminEmail,
      passwordHash,
      status: 'ACTIVE',
      roleId: dbRoles['ADMIN'].id
    }
  });
  console.log(`[Seed] Default Admin Created: ${adminEmail} / Admin@123`);

  // 5. Create Warehouses
  const warehouses = [
    { name: 'Main Warehouse SF', address: '100 Main St, San Francisco, CA', capacity: 10000 },
    { name: 'East Coast Hub NY', address: '450 Broadway, New York, NY', capacity: 5000 }
  ];

  const dbWarehouses: Record<string, any> = {};
  for (const w of warehouses) {
    dbWarehouses[w.name] = await prisma.warehouse.upsert({
      where: { name: w.name },
      update: {},
      create: w
    });
  }
  console.log(`[Seed] Seeded ${warehouses.length} warehouses.`);

  // 6. Create Suppliers
  const suppliers = [
    { name: 'Apex Tech Wholesale', contactName: 'John Doe', email: 'sales@apextech.com', phone: '555-0199', address: '789 Innovation Way, San Jose, CA' },
    { name: 'Global Logistics Partners', contactName: 'Jane Smith', email: 'partners@globallogistics.com', phone: '555-0288', address: '321 Port Rd, Seattle, WA' }
  ];

  const dbSuppliers: Record<string, any> = {};
  for (const s of suppliers) {
    dbSuppliers[s.name] = await prisma.supplier.upsert({
      where: { name: s.name },
      update: {},
      create: s
    });
  }
  console.log(`[Seed] Seeded ${suppliers.length} suppliers.`);

  // 7. Create Categories
  const categories = [
    { name: 'Electronics', description: 'Computers, accessories, and gadgets' },
    { name: 'Office Supplies', description: 'Paper, pens, and desk equipment' },
    { name: 'Packaging', description: 'Boxes, bubble wrap, and tape' }
  ];

  const dbCategories: Record<string, any> = {};
  for (const c of categories) {
    dbCategories[c.name] = await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: c
    });
  }
  console.log(`[Seed] Seeded ${categories.length} categories.`);

  // 8. Create Products
  const products = [
    {
      sku: 'EL-LP-01',
      name: 'Developer Laptop X1',
      description: 'High performance laptop for development team',
      barcode: '123456789012',
      price: 1499.99,
      cost: 950.00,
      quantity: 50,
      reorderLevel: 5,
      categoryId: dbCategories['Electronics'].id
    },
    {
      sku: 'EL-MS-02',
      name: 'Wireless Mouse Premium',
      description: 'Ergonomic wireless mouse with silent clicks',
      barcode: '123456789013',
      price: 49.99,
      cost: 20.00,
      quantity: 120,
      reorderLevel: 20,
      categoryId: dbCategories['Electronics'].id
    },
    {
      sku: 'OS-CH-01',
      name: 'Ergonomic Office Chair',
      description: 'Mesh back chair with lumbar support',
      barcode: '123456789014',
      price: 249.99,
      cost: 110.00,
      quantity: 15,
      reorderLevel: 3,
      categoryId: dbCategories['Office Supplies'].id
    }
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p
    });

    // Generate initial inbound stock movement for the product at the Main Warehouse
    const movementExists = await prisma.stockMovement.findFirst({
      where: { productId: product.id, warehouseId: dbWarehouses['Main Warehouse SF'].id }
    });

    if (!movementExists) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          warehouseId: dbWarehouses['Main Warehouse SF'].id,
          type: 'INBOUND',
          quantity: p.quantity,
          reason: 'Initial Seeding Stock'
        }
      });
    }
  }
  console.log(`[Seed] Seeded ${products.length} products with initial stock movements.`);

  // 9. Create Customers
  const customers = [
    { name: 'Acme Corporate Solutions', email: 'billing@acme.com', phone: '555-9000', address: '500 Enterprise Pkwy, Chicago, IL' },
    { name: 'Star Tech LLC', email: 'procurement@startech.com', phone: '555-8120', address: '12 Venture Blvd, Austin, TX' }
  ];

  for (const cust of customers) {
    await prisma.customer.upsert({
      where: { email: cust.email },
      update: {},
      create: cust
    });
  }
  console.log(`[Seed] Seeded ${customers.length} customers.`);

  console.log('[Seed] Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('[Seed Error] Seeding process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
  real,
  date,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { tenants } from './platform.ts'
import { users } from './auth.ts'
import { contacts } from './crm.ts'
import { contracts } from './contracts.ts'

export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense', 'transfer'])
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending', 'completed', 'failed', 'cancelled', 'refunded'
])
export const commissionStatusEnum = pgEnum('commission_status', [
  'pending', 'approved', 'paid', 'disputed', 'cancelled'
])
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft', 'sent', 'viewed', 'overdue', 'paid', 'cancelled'
])

// Chart of Accounts (Plano de Contas)
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'), // for hierarchy
  code: varchar('code', { length: 20 }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // asset, liability, income, expense
  nature: varchar('nature', { length: 10 }).notNull(), // debit, credit
  isActive: boolean('is_active').notNull().default(true),
  isSystem: boolean('is_system').notNull().default(false), // protected system accounts
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Bank Accounts / Cash Accounts
export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  bankCode: varchar('bank_code', { length: 10 }),
  bankName: varchar('bank_name', { length: 100 }),
  agency: varchar('agency', { length: 20 }),
  accountNumber: varchar('account_number', { length: 30 }),
  accountType: varchar('account_type', { length: 20 }), // checking, savings, cash
  pixKey: varchar('pix_key', { length: 100 }),
  pixKeyType: varchar('pix_key_type', { length: 20 }), // cpf, cnpj, email, phone, random
  currentBalance: integer('current_balance').default(0), // in cents
  isActive: boolean('is_active').notNull().default(true),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Transactions
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  bankAccountId: uuid('bank_account_id').references(() => bankAccounts.id),
  accountId: uuid('account_id').references(() => accounts.id),
  type: transactionTypeEnum('type').notNull(),
  status: transactionStatusEnum('status').notNull().default('pending'),
  amount: integer('amount').notNull(), // in cents BRL
  description: varchar('description', { length: 255 }).notNull(),
  notes: text('notes'),
  category: varchar('category', { length: 100 }),
  // References
  contactId: uuid('contact_id').references(() => contacts.id),
  contractId: uuid('contract_id').references(() => contracts.id),
  commissionId: uuid('commission_id'),
  userId: uuid('user_id').references(() => users.id),
  // Payment details
  paymentMethod: varchar('payment_method', { length: 30 }), // pix, boleto, card, cash, transfer
  paymentReference: varchar('payment_reference', { length: 100 }), // boleto code, pix end-to-end ID
  // Dates
  dueDate: date('due_date'),
  competenceDate: date('competence_date'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  // Asaas integration
  asaasPaymentId: varchar('asaas_payment_id', { length: 100 }),
  asaasStatus: varchar('asaas_status', { length: 50 }),
  boletoUrl: text('boleto_url'),
  pixQrCode: text('pix_qr_code'),
  pixCopiaECola: text('pix_copia_e_cola'),
  // Recurring
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringConfig: jsonb('recurring_config'),
  parentTransactionId: uuid('parent_transaction_id'),
  // Files
  receiptUrl: text('receipt_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('transactions_tenant_idx').on(table.tenantId),
  dueDateIdx: index('transactions_due_date_idx').on(table.dueDate),
  statusIdx: index('transactions_status_idx').on(table.status),
}))

// Commissions
export const commissions = pgTable('commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  contractId: uuid('contract_id').notNull().references(() => contracts.id),
  agentId: uuid('agent_id').notNull().references(() => users.id),
  type: varchar('type', { length: 30 }).notNull(), // sale, rent, referral, management
  // Values (in cents)
  transactionValue: integer('transaction_value').notNull(), // property price
  commissionPercentage: real('commission_percentage').notNull(), // % of transaction
  grossAmount: integer('gross_amount').notNull(),
  agentSplitPercentage: real('agent_split_percentage').notNull(),
  agentGrossAmount: integer('agent_gross_amount').notNull(),
  deductions: integer('deductions').default(0), // INSS, taxes
  agentNetAmount: integer('agent_net_amount').notNull(),
  brokerAmount: integer('broker_amount'), // agency's portion
  status: commissionStatusEnum('status').notNull().default('pending'),
  approvedById: uuid('approved_by_id').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  dueDate: date('due_date'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  transactionId: uuid('transaction_id').references(() => transactions.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('commissions_tenant_idx').on(table.tenantId),
  agentIdx: index('commissions_agent_idx').on(table.agentId),
  contractIdx: index('commissions_contract_idx').on(table.contractId),
}))

// Invoices (Notas Fiscais de Servico)
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  number: varchar('number', { length: 20 }).notNull(),
  contactId: uuid('contact_id').references(() => contacts.id),
  contractId: uuid('contract_id').references(() => contracts.id),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  subtotal: integer('subtotal').notNull(), // in cents
  discountAmount: integer('discount_amount').default(0),
  taxAmount: integer('tax_amount').default(0), // ISS, etc.
  total: integer('total').notNull(),
  dueDate: date('due_date'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  notes: text('notes'),
  nfeNumber: varchar('nfe_number', { length: 20 }),
  nfeUrl: text('nfe_url'),
  pdfUrl: text('pdf_url'),
  items: jsonb('items').$type<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

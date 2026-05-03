import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const userSchema = pgTable(
  'user',
  {
    id: text('id').notNull().primaryKey(),

    name: varchar('name', { length: 255 }).notNull(),
    role: varchar('role', { length: 255 }).default('user'),
    image: varchar('image', { length: 255 }),

    banned: boolean('banned').default(false),
    banReason: varchar('ban_reason', { length: 255 }),
    banExpires: timestamp('ban_expires', { mode: 'string' }),

    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: boolean('email_verified').notNull(),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('user_email_idx').on(table.email)],
);

export const sessionSchema = pgTable(
  'session',
  {
    id: text('id').notNull().primaryKey(),

    userId: text('user_id')
      .notNull()
      .references(() => userSchema.id, { onDelete: 'cascade' }),

    token: varchar('token', { length: 255 }).notNull().unique(),
    impersonatedById: text('impersonated_by_id').references(
      () => userSchema.id,
      { onDelete: 'set null' },
    ),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    ipAddress: varchar('ip_address', { length: 255 }).notNull(),
    userAgent: varchar('user_agent', { length: 255 }).notNull(),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('session_token_idx').on(table.token),
    index('session_user_id_idx').on(table.userId),
  ],
);

export const accountSchema = pgTable(
  'account',
  {
    id: text('id').notNull().primaryKey(),

    userId: text('user_id')
      .notNull()
      .references(() => userSchema.id, { onDelete: 'cascade' }),
    accountId: varchar('account_id', { length: 255 }).notNull(),
    providerId: varchar('provider_id', { length: 255 }).notNull(),

    accessToken: varchar('access_token', { length: 1000 }),
    refreshToken: varchar('refresh_token', { length: 1000 }),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      mode: 'string',
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      mode: 'string',
    }),

    scope: varchar('scope', { length: 500 }),
    idToken: varchar('id_token', { length: 2000 }),
    password: varchar('password', { length: 255 }),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
);

export const verificationSchema = pgTable(
  'verification',
  {
    id: text('id').notNull().primaryKey(),

    identifier: varchar('identifier', { length: 255 }).notNull(),
    value: varchar('value', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

export const userRelations = relations(userSchema, ({ many }) => ({
  sessions: many(sessionSchema),
  accounts: many(accountSchema),
}));

export const sessionRelations = relations(sessionSchema, ({ one }) => ({
  user: one(userSchema, {
    fields: [sessionSchema.userId],
    references: [userSchema.id],
  }),
}));

export const accountRelations = relations(accountSchema, ({ one }) => ({
  user: one(userSchema, {
    fields: [accountSchema.userId],
    references: [userSchema.id],
  }),
}));

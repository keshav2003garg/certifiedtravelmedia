import { env } from '@repo/env/server';

import getDatabase from '@services/database';

const db = getDatabase(env.DATABASE_URL);

export default db;

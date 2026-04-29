import type {
  chartStatusEnum,
  contractTierEnum,
  inventoryRequestStatusEnum,
  tileTypeEnum,
  transactionTypeEnum,
  unitOfMeasureEnum,
} from './schemas';
import type {
  accountSchema,
  sessionSchema,
  userSchema,
  verificationSchema,
} from './schemas/auth.schema';
import type {
  brochureImagePackSizes,
  brochureImages,
  brochures,
  brochureTypes,
} from './schemas/brochure.schema';
import type { chartLayouts, chartTiles } from './schemas/charts.schema';
import type {
  contractDistributions,
  contracts,
} from './schemas/contract.schema';
import type { customers } from './schemas/customer.schema';
import type {
  inventoryItems,
  inventoryTransactionRequests,
  inventoryTransactions,
} from './schemas/inventory.schema';
import type { locations, locationsSectors } from './schemas/location.schema';
import type { sectors } from './schemas/sector.schema';
import type { warehouses, warehousesSectors } from './schemas/warehouse.schema';

/******************************* Enum Types  ******************************************/
export type UnitOfMeasure = (typeof unitOfMeasureEnum.enumValues)[number];
export type ContractTierValue = (typeof contractTierEnum.enumValues)[number];
export type TransactionType = (typeof transactionTypeEnum.enumValues)[number];
export type InventoryRequestStatus =
  (typeof inventoryRequestStatusEnum.enumValues)[number];
export type ChartStatus = (typeof chartStatusEnum.enumValues)[number];
export type TileType = (typeof tileTypeEnum.enumValues)[number];
/******************************* Enum Types  ******************************************/

/******************************* Location  ******************************************/
export type Location = typeof locations.$inferSelect;
export type LocationInsert = typeof locations.$inferInsert;

export type Sector = typeof sectors.$inferSelect;
export type SectorInsert = typeof sectors.$inferInsert;

export type LocationSector = typeof locationsSectors.$inferSelect;
export type LocationSectorInsert = typeof locationsSectors.$inferInsert;
/******************************* Location  ******************************************/

/******************************* Contract  ******************************************/
export type Contract = typeof contracts.$inferSelect;
export type ContractInsert = typeof contracts.$inferInsert;

export type ContractDistribution = typeof contractDistributions.$inferSelect;
export type ContractDistributionInsert =
  typeof contractDistributions.$inferInsert;
/******************************* Contract  ******************************************/

/******************************* Auth  ******************************************/
export type User = typeof userSchema.$inferSelect;
export type UserInsert = typeof userSchema.$inferInsert;

export type Session = typeof sessionSchema.$inferSelect;
export type SessionInsert = typeof sessionSchema.$inferInsert;

export type Account = typeof accountSchema.$inferSelect;
export type AccountInsert = typeof accountSchema.$inferInsert;

export type Verification = typeof verificationSchema.$inferSelect;
export type VerificationInsert = typeof verificationSchema.$inferInsert;
/******************************* Auth  ******************************************/

/******************************* Warehouse  ******************************************/
export type Warehouse = typeof warehouses.$inferSelect;
export type WarehouseInsert = typeof warehouses.$inferInsert;

export type WarehouseSector = typeof warehousesSectors.$inferSelect;
export type WarehouseSectorInsert = typeof warehousesSectors.$inferInsert;
/******************************* Warehouse  ******************************************/

/******************************* Brochure Type  ******************************************/
export type BrochureType = typeof brochureTypes.$inferSelect;
export type BrochureTypeInsert = typeof brochureTypes.$inferInsert;

export type Brochure = typeof brochures.$inferSelect;
export type BrochureInsert = typeof brochures.$inferInsert;

export type BrochureImage = typeof brochureImages.$inferSelect;
export type BrochureImageInsert = typeof brochureImages.$inferInsert;

export type BrochureImagePackSize = typeof brochureImagePackSizes.$inferSelect;
export type BrochureImagePackSizeInsert =
  typeof brochureImagePackSizes.$inferInsert;
/******************************* Brochure Type  ******************************************/

/******************************* Inventory  ******************************************/
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InventoryItemInsert = typeof inventoryItems.$inferInsert;

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InventoryTransactionInsert =
  typeof inventoryTransactions.$inferInsert;

export type InventoryTransactionRequest =
  typeof inventoryTransactionRequests.$inferSelect;
export type InventoryTransactionRequestInsert =
  typeof inventoryTransactionRequests.$inferInsert;
/******************************* Inventory  ******************************************/

/******************************* Chart  ******************************************/
export type ChartLayout = typeof chartLayouts.$inferSelect;
export type ChartLayoutInsert = typeof chartLayouts.$inferInsert;

export type ChartTile = typeof chartTiles.$inferSelect;
export type ChartTileInsert = typeof chartTiles.$inferInsert;

/******************************* Chart  ******************************************/

/******************************* Customer  ******************************************/
export type Customer = typeof customers.$inferSelect;
export type CustomerInsert = typeof customers.$inferInsert;
/******************************* Customer  ******************************************/

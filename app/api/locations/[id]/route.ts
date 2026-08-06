import { createDetailRoute } from "@/lib/crud";

export const { PATCH, DELETE } = createDetailRoute({
  table: "locations",
  idPrefix: "loc",
  requiredCreateFields: ["location_name"],
  patchFields: ["location_name", "branch_name", "building", "floor", "room", "notes"],
  assetRefField: "location_id",
});

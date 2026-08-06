import { createDetailRoute } from "@/lib/crud";

export const { PATCH, DELETE } = createDetailRoute({
  table: "categories",
  idPrefix: "cat",
  requiredCreateFields: ["category_name"],
  duplicateCheckFields: ["category_name"],
  patchFields: ["category_name", "description", "specifications", "status"],
  assetRefField: "category_id",
});

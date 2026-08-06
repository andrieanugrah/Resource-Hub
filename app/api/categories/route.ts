import { createCollectionRoute } from "@/lib/crud";

export const { GET, POST } = createCollectionRoute({
  table: "categories",
  idPrefix: "cat",
  requiredCreateFields: ["category_name"],
  duplicateCheckFields: ["category_name"],
  patchFields: ["category_name", "description", "specifications", "status"],
});

import { createCollectionRoute } from "@/lib/crud";

export const { GET, POST } = createCollectionRoute({
  table: "departments",
  idPrefix: "dep",
  requiredCreateFields: ["department_code", "department_name"],
  duplicateCheckFields: ["department_code"],
  patchFields: ["department_code", "department_name", "description", "status"],
});

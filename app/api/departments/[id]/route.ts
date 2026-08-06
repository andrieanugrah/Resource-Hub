import { readTable } from "@/lib/db";
import { createDetailRoute } from "@/lib/crud";

async function checkUserRefs(id: string): Promise<string | null> {
  const users = await readTable("users");
  const refs = users.filter((u) => u.department_id === id).length;
  if (refs > 0)
    return `Department assigned to ${refs} user${refs !== 1 ? "s" : ""}. Reassign before deleting.`;
  return null;
}

export const { PATCH, DELETE } = createDetailRoute({
  table: "departments",
  idPrefix: "dep",
  requiredCreateFields: ["department_code", "department_name"],
  duplicateCheckFields: ["department_code"],
  patchFields: ["department_code", "department_name", "description", "status"],
  assetRefField: "assigned_department_id",
  additionalDeleteChecks: checkUserRefs,
});

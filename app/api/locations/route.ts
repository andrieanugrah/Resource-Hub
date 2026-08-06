import { createCollectionRoute } from "@/lib/crud";

export const { GET, POST } = createCollectionRoute({
  table: "locations",
  idPrefix: "loc",
  requiredCreateFields: ["location_name"],
  patchFields: ["location_name", "branch_name", "building", "floor", "room", "notes"],
});

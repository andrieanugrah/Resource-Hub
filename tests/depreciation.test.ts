import { describe, it, expect } from "vitest";
import { computeDepreciation, type Asset } from "@/lib/db";

function mockAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "ast_test",
    asset_code: "AST-001",
    asset_name: "Test Laptop",
    category_id: "cat_1",
    brand: "Dell",
    model: "XPS 15",
    serial_number: "SN-001",
    condition: "good",
    status: "available",
    purchase_date: "2022-01-15",
    purchase_price: 15_000_000,
    useful_life_years: 5,
    salvage_value: 500_000,
    warranty_end_date: null,
    warranty_note: null,
    location_id: "loc_1",
    assigned_user_id: null,
    assigned_department_id: null,
    cost_center: null,
    notes: "",
    qr_code_value: "QR_test",
    image_url: null,
    specifications: null,
    created_by: "user_1",
    updated_by: "user_1",
    created_at: "2022-01-15T00:00:00.000Z",
    updated_at: "2022-01-15T00:00:00.000Z",
    deleted_at: null,
    ...overrides,
  };
}

describe("computeDepreciation", () => {
  it("computes straight-line for 5yr asset after 2 years", () => {
    const asOf = new Date("2024-01-15");
    const result = computeDepreciation(mockAsset(), asOf);
    // (15M - 500k) / 5 = 2.9M/yr, 2yr at 365.25 days/yr ≈ 5,796,030 accumulated, ≈ 9,203,970 current
    expect(result.annual_depreciation).toBe(2_900_000);
    expect(result.accumulated).toBeCloseTo(5_796_030, -3);
    expect(result.current_value).toBeCloseTo(9_203_970, -3);
    expect(result.percent_depreciated).toBeCloseTo(40, -1);
  });

  it("returns null values when no purchase price", () => {
    const result = computeDepreciation(mockAsset({ purchase_price: null }));
    expect(result.current_value).toBeNull();
    expect(result.annual_depreciation).toBeNull();
  });

  it("returns null when useful_life_years <= 0", () => {
    const result = computeDepreciation(mockAsset({ useful_life_years: 0 }));
    expect(result.current_value).toBeNull();
  });

  it("returns null when no purchase date", () => {
    const result = computeDepreciation(mockAsset({ purchase_date: "" }));
    expect(result.current_value).toBeNull();
  });

  it("floors at salvage value after full life", () => {
    // 5yr life, check at 6yr mark
    const asOf = new Date("2028-01-15");
    const result = computeDepreciation(mockAsset(), asOf);
    expect(result.current_value).toBe(500_000);
    expect(result.percent_depreciated).toBe(100);
  });
});
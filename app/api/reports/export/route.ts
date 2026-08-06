import { NextRequest, NextResponse } from "next/server";
import { readTable, computeDepreciation, type Asset } from "@/lib/db";
import { requireUser, can } from "@/lib/auth";
import { formatDate, formatCurrency } from "@/lib/format";
import ExcelJS from "exceljs";

export const runtime = "nodejs";

// Preset filter bundles for named report types (PRD §13)
const PRESETS: Record<string, (a: Asset) => boolean> = {
  in_repair: (a) => a.status === "in_repair",
  retired: (a) => a.status === "retired",
  warranty_expiring: (a) => {
    if (!a.warranty_end_date) return false;
    const d = new Date(a.warranty_end_date);
    if (Number.isNaN(d.getTime())) return false;
    const days = (d.getTime() - Date.now()) / 86_400_000;
    return days <= 30; // PRD §7.16: warranty due within 30 days
  },
};

export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!can(user.role, "report.view_all"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = new URL(req.url).searchParams;
  const type = sp.get("type") ?? "assets";
  const format = sp.get("format") ?? "xlsx";

  const [assets, categories, locations] = await Promise.all([
    readTable("assets"), readTable("categories"), readTable("locations"),
  ]);

  // Shared filter: preset + ad-hoc status/category/search (mirrors assets/page.tsx)
  let rows = assets.filter((a) => !a.deleted_at);
  const preset = PRESETS[type];
  if (preset) rows = rows.filter(preset);

  const status = sp.get("status");
  const category = sp.get("category");
  const search = sp.get("search");
  if (status) rows = rows.filter((a) => a.status === status);
  if (category) rows = rows.filter((a) => a.category_id === category);
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((a) =>
      a.asset_code.toLowerCase().includes(q) ||
      a.asset_name.toLowerCase().includes(q) ||
      a.serial_number.toLowerCase().includes(q) ||
      a.brand.toLowerCase().includes(q) ||
      a.model.toLowerCase().includes(q)
    );
  }

  const titleByType: Record<string, string> = {
    assets: "Asset Inventory Report",
    in_repair: "Assets In Repair Report",
    retired: "Retired Assets Report",
    warranty_expiring: "Warranty Expiring (≤30 days) Report",
  };
  const title = titleByType[type] ?? "Asset Report";

  const columns = [
    { header: "Asset Code", key: "asset_code", width: 16 },
    { header: "Asset Name", key: "asset_name", width: 28 },
    { header: "Category", key: "category_name", width: 18 },
    { header: "Brand", key: "brand", width: 14 },
    { header: "Model", key: "model", width: 16 },
    { header: "Serial Number", key: "serial_number", width: 18 },
    { header: "Status", key: "status", width: 12 },
    { header: "Condition", key: "condition", width: 12 },
    { header: "Location", key: "location_name", width: 16 },
    { header: "Purchase Date", key: "purchase_date", width: 16 },
    { header: "Purchase Price", key: "purchase_price", width: 18 },
    { header: "Useful Life (yr)", key: "useful_life_years", width: 16 },
    { header: "Annual Deprec.", key: "annual_depreciation", width: 16 },
    { header: "Current Value", key: "current_value", width: 16 },
    { header: "Depreciated %", key: "depreciated_pct", width: 14 },
    { header: "Warranty End", key: "warranty_end_date", width: 16 },
    { header: "Notes", key: "notes", width: 30 },
  ];

  const data = rows.map((a) => {
    const dep = computeDepreciation(a);
    return {
    asset_code: a.asset_code,
    asset_name: a.asset_name,
    category_name: categories.find((c) => c.id === a.category_id)?.category_name ?? "",
    brand: a.brand,
    model: a.model,
    serial_number: a.serial_number,
    status: a.status,
    condition: a.condition,
    location_name: locations.find((l) => l.id === a.location_id)?.location_name ?? "",
    purchase_date: a.purchase_date ? formatDate(a.purchase_date) : "",
    purchase_price: a.purchase_price != null ? formatCurrency(a.purchase_price) : "",
    useful_life_years: a.useful_life_years,
    annual_depreciation: dep.annual_depreciation != null ? formatCurrency(dep.annual_depreciation) : "",
    current_value: dep.current_value != null ? formatCurrency(dep.current_value) : "",
    depreciated_pct: dep.percent_depreciated != null ? `${dep.percent_depreciated}%` : "",
    warranty_end_date: a.warranty_end_date ? formatDate(a.warranty_end_date) : "",
    notes: a.notes ?? "",
  };});

  const stamp = new Date().toISOString().split("T")[0];

  if (format === "csv") {
    const header = columns.map((c) => c.header);
    const csv = [header, ...data.map((r) => columns.map((c) => `"${(r[c.key as keyof typeof r] ?? "").toString().replace(/"/g, '""')}"`).join(","))]
      .join("\r\n");
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="assets-export-${stamp}.csv"`,
      },
    });
  }

  // D: XLSX with professional template styling
  const wb = new ExcelJS.Workbook();
  wb.creator = "ResourceHub";
  wb.created = new Date();
  const ws = wb.addWorksheet("Assets", { views: [{ state: "frozen", ySplit: 3 }] });

  // Title bar (row 1, merged)
  ws.mergeCells(1, 1, 1, columns.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } };
  ws.getRow(1).height = 28;

  // Meta row (row 2): generated + count
  ws.mergeCells(2, 1, 2, columns.length);
  const metaCell = ws.getCell(2, 1);
  metaCell.value = `Generated ${formatDate(stamp)} · ${data.length} record${data.length === 1 ? "" : "s"}${search ? ` · filter: "${search}"` : ""}${status ? ` · status: ${status}` : ""}${category ? ` · category` : ""}`;
  metaCell.font = { italic: true, size: 10, color: { argb: "FF6B7280" } };
  ws.getRow(2).height = 18;

  // Header row (row 3)
  const headerRow = ws.getRow(3);
  headerRow.values = columns.map((c) => c.header);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" } };
  headerRow.alignment = { vertical: "middle", horizontal: "left" };
  headerRow.border = { bottom: { style: "thin", color: { argb: "FF111827" } } };
  ws.getRow(3).height = 22;

  // Data rows
  ws.columns = columns;
  data.forEach((r) => ws.addRow(r));

  // Alternating row tint + thin bottom border
  for (let i = 4; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    row.height = 18;
    if (i % 2 === 0) {
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
    }
    row.border = { bottom: { style: "hair", color: { argb: "FFE5E7EB" } } };
  }

  // Auto-fit-ish widths are set above; cap notes width
  ws.getColumn("notes").width = 40;

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="assets-export-${stamp}.xlsx"`,
      "Content-Length": String(buf.byteLength),
    },
  });
}
import { readTable } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableHeader } from "@/components/sortable-header";
import { FileText, Search } from "lucide-react";
import { OpenSplitButton } from "@/components/open-split-button";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ status?: string; search?: string; type?: string; sort?: string; dir?: string }>;
}

export default async function RequestsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [requests, users] = await Promise.all([readTable("requests"), readTable("users")]);
  const userName = (id: string | null) => id ? (users.find((u) => u.id === id)?.name ?? id) : "-";

  let sorted = [...requests];

  if (sp.status) sorted = sorted.filter((r) => r.status === sp.status);
  if (sp.type) sorted = sorted.filter((r) => r.request_type === sp.type);
  if (sp.search) {
    const q = sp.search.toLowerCase();
    sorted = sorted.filter((r) =>
      r.request_code.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      userName(r.requester_id).toLowerCase().includes(q)
    );
  }

  // Sort
  const sortField = sp.sort ?? "created_at";
  const sortDir = sp.dir ?? "desc";
  sorted.sort((a, b) => {
    let va: string, vb: string;
    if (sortField === "requester_id") { va = userName(a.requester_id); vb = userName(b.requester_id); }
    else { va = String((a as unknown as Record<string, unknown>)[sortField] ?? ""); vb = String((b as unknown as Record<string, unknown>)[sortField] ?? ""); }
    const cmp = va.localeCompare(vb, undefined, { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const statusOptions = ["draft", "submitted", "pending_approval", "approved", "rejected", "in_progress", "completed", "cancelled"];
  const typeOptions = ["new_asset", "replacement", "temporary_loan", "return", "repair"];

  const searchParamsRecord: Record<string, string | undefined> = {
    status: sp.status, type: sp.type, search: sp.search, sort: sp.sort, dir: sp.dir,
  };

  return (
    <div>
      <PageHeader title="Requests" description="Asset requests and approvals" action={{ href: "/requests/new", label: "+ New Request" }} />

      <Card className="mb-6 rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <div className="px-5 py-4">
          <form method="get" className="flex flex-wrap gap-3">
            {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
            {sp.dir && <input type="hidden" name="dir" value={sp.dir} />}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="search" defaultValue={sp.search ?? ""} placeholder="Search by code, title, requester..." className="pl-10" />
            </div>
            <select name="status" defaultValue={sp.status ?? ""} className="h-10 rounded-xl border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">All Status</option>
              {statusOptions.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
            <select name="type" defaultValue={sp.type ?? ""} className="h-10 rounded-xl border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">All Types</option>
              {typeOptions.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
            <Button type="submit">Filter</Button>
            {(sp.status || sp.search || sp.type) && (
              <Link href="/requests" className="inline-flex items-center justify-center rounded-xl border bg-secondary text-secondary-foreground px-4 py-2.5 text-sm font-medium hover:bg-secondary/80 transition-colors">Clear</Link>
            )}
          </form>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col"><SortableHeader label="Code" field="request_code" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col"><SortableHeader label="Title" field="title" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col"><SortableHeader label="Requester" field="requester_id" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col"><SortableHeader label="Type" field="request_type" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col"><SortableHeader label="Status" field="status" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col"><SortableHeader label="Priority" field="priority" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col"><SortableHeader label="Created" field="created_at" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col" className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-sm font-medium text-muted-foreground">No requests found</p>
                    <p className="text-xs text-muted-foreground/60">{(sp.status || sp.search || sp.type) ? "Try adjusting your filters" : "Create a new request to get started"}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : sorted.map((r) => (
              <TableRow key={r.id} className="group transition-colors hover:bg-muted/30">
                <TableCell className="font-mono text-sm">
                  <Link href={`/requests/${r.id}`} className="font-medium text-primary hover:underline">{r.request_code}</Link>
                </TableCell>
                <TableCell className="font-medium max-w-[250px] truncate">{r.title}</TableCell>
                <TableCell className="text-muted-foreground">{userName(r.requester_id)}</TableCell>
                <TableCell><Badge value={r.request_type} /></TableCell>
                <TableCell><Badge value={r.status} /></TableCell>
                <TableCell><Badge value={r.priority} /></TableCell>
                <TableCell className="text-muted-foreground text-sm">{new Date(r.created_at).toLocaleDateString("id-ID")}</TableCell>
                <TableCell className="w-8">
                  <OpenSplitButton tab={{ id: r.id, type: "request", label: r.title }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          {sorted.length} request{sorted.length !== 1 ? "s" : ""}
        </div>
      </Card>
    </div>
  );
}


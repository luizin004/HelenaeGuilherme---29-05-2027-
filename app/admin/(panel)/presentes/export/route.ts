import { NextResponse } from "next/server";
import { listGifts } from "@/lib/admin-data";
import { toGiftsCSV } from "@/domain/gifts/csv";

export const dynamic = "force-dynamic";

/** Baixa a lista de presentes como planilha CSV (editável no Excel/Sheets). */
export async function GET() {
  const gifts = await listGifts();
  const csv = toGiftsCSV(gifts);
  // BOM (﻿) garante acentuação correta ao abrir no Excel.
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="presentes-helena-guilherme.csv"',
      "Cache-Control": "no-store",
    },
  });
}

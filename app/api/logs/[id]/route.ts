import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!supabase) return NextResponse.json({ configured: false, error: "Supabase未配置" }, { status: 503 });
  const { error } = await supabase.from("work_logs").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

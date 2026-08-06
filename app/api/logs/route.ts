import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!supabase) return NextResponse.json({ configured: false, logs: [] });
  const { data, error } = await supabase.from("work_logs").select("id,created_at,date,input_text,work_content,work_thought").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ configured: true, logs: data ?? [] });
}

export async function POST(request: Request) {
  if (!supabase) return NextResponse.json({ configured: false, error: "Supabase未配置" }, { status: 503 });
  const body = await request.json();
  const { data, error } = await supabase.from("work_logs").insert({ date: body.date, input_text: body.inputText, work_content: body.workContent, work_thought: body.workThought }).select("id,created_at,date,input_text,work_content,work_thought").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ configured: true, log: data });
}

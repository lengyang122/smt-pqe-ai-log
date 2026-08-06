import { NextResponse } from "next/server";

const fallback = (input: string) => {
  const topic = input.trim().replace(/[。！!]+$/, "") || "现场质量跟进";
  return {
    content: `针对${topic}，依据SOP、检验标准及Control Plan进行现场确认，结合SPI、AOI或相关检测数据核实异常表现，明确不良影响及暂行判定，并与生产、工艺和设备人员沟通原因，记录QMS异常，跟进改善措施落实。`,
    reflection: "通过本次工作，我进一步熟悉了标准在现场判定中的应用，提升了从检测数据定位问题、协调相关人员推进闭环的能力。"
  };
};

export async function POST(request: Request) {
  const { input } = await request.json();
  if (!input || typeof input !== "string") return NextResponse.json({ error: "请输入工作描述" }, { status: 400 });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json(fallback(input));
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.45, response_format: { type: "json_object" }, messages: [
        { role: "system", content: "你是消费电子制造企业SMT现场PQE工程师助手。根据用户一句话工作描述，生成真实、克制的企业员工日报。返回JSON，字段content和reflection。content控制70-80个中文字符，reflection控制40-50个中文字符。必须围绕SOP/检验标准、异常确认、SPI/AOI/ICT数据、QMS、Control Plan、跨部门沟通、改善跟踪合理扩展，不虚构重大项目、客户、数据或结果。" },
        { role: "user", content: input }
      ] })
    });
    if (!response.ok) throw new Error("OpenAI request failed");
    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return NextResponse.json({ content: parsed.content, reflection: parsed.reflection });
  } catch { return NextResponse.json(fallback(input)); }
}

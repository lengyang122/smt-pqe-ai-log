import OpenAI from "openai";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `你是消费电子制造企业SMT现场PQE工程师AI助手。

你的任务：
根据用户输入的一句简单工作描述，生成符合企业日报要求的工作记录。

用户背景：
岗位：SMT PQE（Process Quality Engineer）

工作内容：
1. 根据SOP、检验标准判断产品放行或拦截。
2. 处理SMT生产过程异常。
3. 分析SPI、AOI、ICT检测数据。
4. 维护QMS质量管理系统。
5. 核对Control Plan控制计划。
6. 跟进供应商异常、退货、赔偿以及改善。
7. 协调生产、工艺、设备部门推进质量改善。

输出要求：
根据用户输入生成以下两个字段，只输出一个JSON对象，不要输出其他内容：
{"workContent": "...", "reflection": "..."}

字段1：workContent（工作内容）
- 中文70-80字（含中文标点，不含英文、数字、空格）。
- 企业日报风格。
- 内容真实。
- 不夸大。
- 不虚构数据。
- 体现：异常确认、数据分析、标准依据、沟通协调、改善跟踪。

字段2：reflection（工作感想）
- 中文40-50字（含中文标点，不含英文、数字、空格）。
- 体现：PQE岗位理解、质量意识提升、分析能力提升、沟通能力提升。

输出前请逐字计数（汉字和中文标点都算），确保workContent在70-80字之间、reflection在40-50字之间，不达标必须重写。`;

// 统计中文字符数量：汉字 + 中文标点
const count = (s: string) => (s.match(/[\u4e00-\u9fff\u3001-\u303f\uff00-\uffef]/g) || []).length;

function parseResult(text: string): { workContent: string; reflection: string } | null {
  try {
    const data = JSON.parse(text);
    if (typeof data.workContent === "string" && typeof data.reflection === "string") {
      return { workContent: data.workContent.trim(), reflection: data.reflection.trim() };
    }
  } catch {}
  return null;
}

async function callDeepSeek(input: string, fix?: string) {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: input },
  ];
  if (fix) messages.push({ role: "user", content: fix });
  const completion = await client.chat.completions.create({
    model: "deepseek-chat",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages,
  });
  const content = completion.choices?.[0]?.message?.content ?? "";
  const parsed = parseResult(content);
  if (!parsed) throw new Error("DeepSeek 返回内容无法解析");
  return parsed;
}

const MAX_RETRY = 3; // 长度不达标时最多重新生成 3 次

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = (await request.json())?.input;
  } catch {
    return NextResponse.json({ error: "请输入工作描述" }, { status: 400 });
  }
  if (typeof input !== "string" || !input.trim()) {
    return NextResponse.json({ error: "请输入工作描述" }, { status: 400 });
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "请配置DeepSeek API Key" });
  }

  let lastResult: { workContent: string; reflection: string } | null = null;
  let lastError: unknown = null;
  const keyword = input.trim();

  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    let fix: string | undefined;
    if (attempt > 0 && lastResult) {
      const { workContent, reflection } = lastResult;
      const wc = count(workContent);
      const rf = count(reflection);
      const parts: string[] = [];
      if (wc < 70 || wc > 80) {
        parts.push(`workContent现在${wc}字，目标70-80字${wc < 70 ? `，需要加长${70 - wc}字以上（可补充现场确认细节、依据的SOP或控制计划条款、与工艺设备人员的沟通、后续改善跟踪安排）` : `，需要删减${wc - 80}字以上（去掉修饰词和重复表述）`}`);
      }
      if (rf < 40 || rf > 50) {
        parts.push(`reflection现在${rf}字，目标40-50字${rf < 40 ? `，需要加长${40 - rf}字以上` : `，需要删减${rf - 50}字以上`}`);
      }
      const keep = [
        wc >= 70 && wc <= 80 ? "workContent保持上一版原文完全不变" : "",
        rf >= 40 && rf <= 50 ? "reflection保持上一版原文完全不变" : "",
      ].filter(Boolean).join("，");
      fix = `上一版全文：workContent="${workContent}" reflection="${reflection}"。字数检查：${parts.join("；")}。请只修改需要调整的字段，${keep}，修改后逐字计数确认达标再输出完整JSON。`;
    }
    try {
      const result = await callDeepSeek(keyword, fix);
      lastResult = result;
      const wc = count(result.workContent);
      const rf = count(result.reflection);
      if (wc >= 70 && wc <= 80 && rf >= 40 && rf <= 50) {
        return NextResponse.json({ workContent: result.workContent, reflection: result.reflection });
      }
      lastError = new Error(`字数校验未通过：workContent=${wc}字，reflection=${rf}字`);
    } catch (e) {
      lastError = e;
    }
  }

  // 重试后仍不达标：返回最近一次结果并附带提示
  if (lastResult) {
    return NextResponse.json({
      workContent: lastResult.workContent,
      reflection: lastResult.reflection,
      warning: "AI生成结果未完全符合字数要求，已自动重试3次",
    });
  }
  return NextResponse.json({ error: "AI服务暂时不可用，请稍后重试" });
}

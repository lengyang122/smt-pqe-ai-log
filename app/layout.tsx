import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "SMT PQE AI工作日志助手", description: "面向SMT现场PQE工程师的AI工作日志工具" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}

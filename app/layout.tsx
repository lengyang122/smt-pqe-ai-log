import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"企业实践日记",description:"PQE 的日常实践与成长记录"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}

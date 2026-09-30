import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Fun with Flags",description:"Explore 48 flags, test your knowledge, and keep your quiz journey.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}

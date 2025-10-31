"use client"

import dynamic from "next/dynamic"

// Dynamically import the App component to avoid SSR issues
const App = dynamic(() => import("@/ui/src/App"), { ssr: false })

export default function Page() {
  return <App />
}

// app/ui/dashboard/sidenav.tsx

import Link from "next/link"
import {
  Bell,
  Home,
  Package2,
  Video,
  List,
  Plus,
  CreditCard,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SideNav() {
  return (
    <div className="flex h-full flex-col justify-between border-r bg-muted/40">
      <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
        <div className="mt-4">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">Video</h3>
          <Link
            href="/dashboard/videos/create"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Create
          </Link>
        </div>
        <div className="mt-4">
          <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground flex items-center">
            Series
            <Badge 
              variant="secondary" 
              className="ml-2 text-[10px] py-0 h-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none"
            >
              PRO
            </Badge>
          </h3>
          <Link
            href="/dashboard/series/create"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Create
          </Link>
          <Link
            href="/dashboard/series/view"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <List className="h-4 w-4" />
            View
          </Link>
        </div>
      </nav>

      <div className="mt-auto px-2 pb-4 lg:px-4">
        <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">Account</h3>
        <nav className="grid items-start text-sm font-medium">
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <CreditCard className="h-4 w-4" />
            Manage Subscription
          </Link>
          <Link
            href="/dashboard/account/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <User className="h-4 w-4" />
            Settings
          </Link>
          <Link
            href="/dashboard/account/link-youtube"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Video className="h-4 w-4" />
            Link Youtube
            <Badge 
              variant="secondary" 
              className="ml-2 text-[10px] py-0 h-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none"
            >
              PRO
            </Badge>
          </Link>
          <Link
            href="/dashboard/account/test-upload"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <Video className="h-4 w-4" />
            Test Upload
          </Link>
        </nav>
      </div>
    </div>
  )
}

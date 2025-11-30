'use client'

import { Bell, User } from 'lucide-react'

export function Header() {
    return (
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
            <div className="flex items-center">
                {/* Breadcrumbs or Page Title could go here */}
            </div>
            <div className="flex items-center space-x-4">
                <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card"></span>
                </button>
                <div className="flex items-center space-x-3 border-l border-border pl-4">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-foreground">Trader</span>
                        <span className="text-xs text-muted-foreground">Pro Plan</span>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/50">
                        <User className="h-4 w-4" />
                    </div>
                </div>
            </div>
        </header>
    )
}

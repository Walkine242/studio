
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from '@/config/nav';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        if (item.type === 'dropdown') {
          const isChildActive = item.items.some(child => pathname === child.href);
          return (
            <DropdownMenu key={item.label}>
              <DropdownMenuTrigger asChild>
                 <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-1 transition-colors hover:text-white",
                    isChildActive ? "text-white" : "text-white/70",
                    "focus-visible:ring-0 focus-visible:ring-offset-0"
                  )}
                >
                  {item.label}
                  <item.icon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {item.items.map(child => (
                  <DropdownMenuItem key={child.href} asChild>
                    <Link href={child.href} className="flex items-center gap-2">
                       <child.icon className="size-4 text-muted-foreground" />
                      {child.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
           <Button key={item.href} asChild variant="link" className="text-base font-normal">
              <Link
                href={item.href}
                className={cn(
                    "flex items-center gap-2 transition-colors hover:text-white hover:no-underline",
                    pathname === item.href ? "text-white" : "text-white/70"
                  )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
           </Button>
        );
      })}
    </>
  );
}


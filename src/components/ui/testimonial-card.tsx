import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export interface TestimonialAuthor {
  name: string
  handle: string
  avatar: string
}

export interface TestimonialCardProps {
  author: TestimonialAuthor
  text: string
  href?: string
  className?: string
}

export function TestimonialCard({ 
  author,
  text,
  href,
  className
}: TestimonialCardProps) {
  const Card = href ? 'a' : 'div'
  
  return (
    <Card
      {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "flex flex-col rounded-xl border border-border/50 bg-card p-5",
        "shadow-card transition-all duration-300",
        "hover:shadow-lg hover:border-primary/30",
        href && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-11 w-11 ring-2 ring-primary/20">
          <AvatarImage src={author.avatar} alt={author.name} />
          <AvatarFallback className="bg-gradient-sky text-primary-foreground font-semibold">
            {author.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground leading-tight">
            {author.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {author.handle}
          </span>
        </div>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">
        {text}
      </p>
    </Card>
  )
}

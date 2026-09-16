export function AuthHeader({
  title,
  description,
}: {
  title: string
  description: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="text-sm text-pretty text-muted-foreground">{description}</p>
    </div>
  )
}

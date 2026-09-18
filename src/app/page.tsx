export default function Home() {
  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-primary text-4xl font-bold md:text-6xl">زرنما</h1>
        <p className="text-muted-foreground mt-4 text-lg md:text-xl">
          پلتفرم خرید، فروش و سرمایه‌گذاری طلای آب‌شده
        </p>
        <div className="border-border bg-card text-card-foreground mt-8 rounded-lg border p-6">
          <p className="text-sm">
            Phase 0 - Foundation Setup
            <br />
            Next.js 16.3.3 + TypeScript + Tailwind v4 + Prisma 7
          </p>
        </div>
      </div>
    </main>
  )
}

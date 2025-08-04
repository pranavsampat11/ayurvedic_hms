import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar Skeleton */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex-1 overflow-auto py-4">
            <div className="grid items-start px-2 text-sm font-medium lg:px-4 gap-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          </div>
          <div className="mt-auto p-4 border-t">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="ml-auto h-8 w-24" />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">
                <Skeleton className="h-8 w-64" />
              </CardTitle>
              <Skeleton className="h-10 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

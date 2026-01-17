import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SubscribePage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Subscription Required</CardTitle>
          <CardDescription className="text-lg">
            Your account is currently waiting for activation or requires a paid subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Once an admin activates your account or you complete your subscription, you'll gain full access to the
            gamified dashboard and learning materials.
          </p>
          <div className="grid gap-4">
            <Button className="w-full h-12 text-lg">Choose a Plan</Button>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/landing">Return to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import Link from "next/link";
import { ArrowRight, Clock, Shield, CheckCircle } from "lucide-react";

export default function SurveyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-2xl font-heading font-bold text-primary">
                  Personal Potions
                </h1>
              </Link>
            </div>
            <Link
              href="/"
              className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
            >
               Back to Home
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground sm:text-5xl mb-6">
              Your Personal Assessment
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help us understand your unique health profile to create the perfect electrolyte formula for you.
            </p>
          </div>
          <div className="text-center">
            <Link href="/survey/step-1" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium transition-colors">
              Start Assessment
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

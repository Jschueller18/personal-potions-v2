import Link from "next/link";
import { Flask, Award, Heart, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-heading font-bold text-primary">
                  Personal Potions
                </h1>
              </div>
            </div>
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </Link>
                <Link href="/about" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                  About
                </Link>
                <Link href="/science" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                  Science
                </Link>
              </div>
            </nav>
            <div className="hidden md:block">
              <Link
                href="/survey"
                className="bg-primary hover:bg-primary-dark text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-background to-accent/20 py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Your Personal
                <span className="block text-primary">Electrolyte Formula</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Get a custom electrolyte blend tailored to your unique health profile, lifestyle, and goals. 
                Science-backed formulas designed specifically for you.
              </p>
              
              {/* Survey Prompt Box */}
              <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-primary/20 bg-accent/30 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Start with a 5-minute assessment
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Answer questions about your health, diet, and lifestyle to get your personalized formula
                </p>
                <Link
                  href="/survey"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors w-full justify-center sm:w-auto"
                >
                  Take Assessment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-heading font-bold tracking-tight text-foreground sm:text-4xl">
                Why Choose Personal Potions?
              </h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                Unlike one-size-fits-all supplements, we create formulas based on your individual needs
              </p>
            </div>
            
            <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover:shadow-lg transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Flask className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-card-foreground">
                  Personalized Formula
                </h3>
                <p className="mt-4 text-muted-foreground">
                  Every formula is calculated based on your age, weight, activity level, health conditions, and dietary preferences.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover:shadow-lg transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <Award className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-card-foreground">
                  Premium Quality
                </h3>
                <p className="mt-4 text-muted-foreground">
                  Third-party tested, pharmaceutical-grade minerals with optimal bioavailability and absorption.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-card-foreground">
                  Science-Backed
                </h3>
                <p className="mt-4 text-muted-foreground">
                  Formulations based on clinical research and optimal mineral ratios for maximum effectiveness.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-muted/30 py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-heading font-bold tracking-tight text-foreground sm:text-4xl">
                Simple Process, Powerful Results
              </h2>
            </div>
            
            <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  1
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  Take Assessment
                </h3>
                <p className="mt-4 text-muted-foreground">
                  Complete our comprehensive health and lifestyle questionnaire
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xl font-bold">
                  2
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  Get Your Formula
                </h3>
                <p className="mt-4 text-muted-foreground">
                  Our algorithm calculates your optimal mineral ratios and creates your custom blend
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground text-xl font-bold">
                  3
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  Feel the Difference
                </h3>
                <p className="mt-4 text-muted-foreground">
                  Experience improved hydration, energy, and recovery with your personalized formula
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/survey"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium transition-colors"
              >
                Start Your Assessment
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-heading font-bold">Personal Potions</h3>
              <p className="text-primary-foreground/80 text-sm">
                Personalized electrolyte formulas designed for your unique health profile.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/survey" className="text-primary-foreground/80 hover:text-primary-foreground">Take Assessment</Link></li>
                <li><Link href="/about" className="text-primary-foreground/80 hover:text-primary-foreground">About Us</Link></li>
                <li><Link href="/science" className="text-primary-foreground/80 hover:text-primary-foreground">The Science</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/faq" className="text-primary-foreground/80 hover:text-primary-foreground">FAQ</Link></li>
                <li><Link href="/contact" className="text-primary-foreground/80 hover:text-primary-foreground">Contact</Link></li>
                <li><Link href="/support" className="text-primary-foreground/80 hover:text-primary-foreground">Help Center</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-primary-foreground/80 hover:text-primary-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-primary-foreground/80 hover:text-primary-foreground">Terms of Service</Link></li>
                <li><Link href="/refunds" className="text-primary-foreground/80 hover:text-primary-foreground">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/80">
            <p>&copy; 2024 Personal Potions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

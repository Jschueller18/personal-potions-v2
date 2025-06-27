import Link from "next/link";
import Image from "next/image";
import { FlaskRound, Award, Heart, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header - Green logo on light background */}
      <header className="w-full border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/Green-logo-full-words.png"
                  alt="Personal Potions"
                  width={320}
                  height={100}
                  className="h-20 w-auto"
                  priority
                />
              </Link>
            </div>
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="text-gray-700 hover:text-green-800 px-3 py-2 rounded-md text-sm font-medium transition-colors" style={{color: 'hsl(137, 43%, 30%)'}}>
                  Home
                </Link>
                <Link href="/about" className="text-gray-600 hover:text-green-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  About
                </Link>
                <Link href="/science" className="text-gray-600 hover:text-green-800 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Science
                </Link>
              </div>
            </nav>
            <div className="hidden md:block">
              <Link
                href="/survey"
                className="text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg hover:bg-opacity-90"
                style={{backgroundColor: 'hsl(196, 89%, 59%)'}}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section - Light teal accent background */}
        <section className="relative overflow-hidden py-20 sm:py-32" style={{backgroundColor: 'hsl(183, 80%, 95%)'}}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl font-heading font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Your Personal
                <span className="block" style={{color: 'hsl(137, 43%, 20%)'}}>Electrolyte Formula</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
                Get a custom electrolyte blend tailored to your unique health profile, lifestyle, and goals. 
                Science-backed formulas designed specifically for you.
              </p>
              
              {/* Survey Prompt Box */}
              <div className="mx-auto mt-10 max-w-lg rounded-2xl border p-6 backdrop-blur-sm shadow-lg" style={{borderColor: 'hsl(183, 80%, 70%)', backgroundColor: 'hsl(183, 80%, 85%)'}}>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Start with a 5-minute assessment
                </h3>
                <p className="text-sm text-gray-700 mb-4">
                  Answer questions about your health, diet, and lifestyle to get your personalized formula
                </p>
                <Link
                  href="/survey"
                  className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full justify-center sm:w-auto shadow-md hover:shadow-lg"
                  style={{backgroundColor: 'hsl(196, 89%, 59%)'}}
                >
                  Take Assessment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - White background */}
        <section className="py-20 sm:py-32 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-heading font-bold tracking-tight text-gray-900 sm:text-4xl">
                Why Choose Personal Potions?
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Unlike one-size-fits-all supplements, we create formulas based on your individual needs
              </p>
            </div>
            
            <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 hover:shadow-xl transition-all duration-300 hover:border-green-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{backgroundColor: 'hsl(137, 43%, 90%)'}}>
                  <FlaskRound className="h-6 w-6" style={{color: 'hsl(137, 43%, 20%)'}} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  Personalized Formula
                </h3>
                <p className="mt-4 text-gray-600">
                  Every formula is calculated based on your age, weight, activity level, health conditions, and dietary preferences.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{backgroundColor: 'hsl(196, 89%, 90%)'}}>
                  <Award className="h-6 w-6" style={{color: 'hsl(196, 89%, 45%)'}} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  Premium Quality
                </h3>
                <p className="mt-4 text-gray-600">
                  Third-party tested, pharmaceutical-grade minerals with optimal bioavailability and absorption.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{backgroundColor: 'hsl(137, 43%, 90%)'}}>
                  <Heart className="h-6 w-6" style={{color: 'hsl(137, 43%, 20%)'}} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  Science-Backed
                </h3>
                <p className="mt-4 text-gray-600">
                  Formulations based on clinical research and optimal mineral ratios for maximum effectiveness.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section - Light accent background */}
        <section className="py-20 sm:py-32" style={{backgroundColor: 'hsl(183, 80%, 92%)'}}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-heading font-bold tracking-tight text-gray-900 sm:text-4xl">
                Simple Process, Powerful Results
              </h2>
            </div>
            
            <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white text-xl font-bold shadow-lg" style={{backgroundColor: 'hsl(137, 43%, 20%)'}}>
                  1
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  Take Assessment
                </h3>
                <p className="mt-4 text-gray-600">
                  Complete our comprehensive health and lifestyle questionnaire
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white text-xl font-bold shadow-lg" style={{backgroundColor: 'hsl(196, 89%, 59%)'}}>
                  2
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  Get Your Formula
                </h3>
                <p className="mt-4 text-gray-600">
                  Our algorithm calculates your optimal mineral ratios and creates your custom blend
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-white text-xl font-bold shadow-lg" style={{backgroundColor: 'hsl(137, 43%, 20%)'}}>
                  3
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  Feel the Difference
                </h3>
                <p className="mt-4 text-gray-600">
                  Experience improved hydration, energy, and recovery with your personalized formula
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/survey"
                className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                style={{backgroundColor: 'hsl(196, 89%, 59%)'}}
              >
                Start Your Assessment
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Primary green background with blue logo */}
      <footer className="text-white" style={{backgroundColor: 'hsl(137, 43%, 20%)'}}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Image
                src="/Blue-logo-pp-circle.png"
                alt="Personal Potions"
                width={80}
                height={80}
                className="h-16 w-16"
              />
              <p className="text-green-100 text-sm max-w-xs">
                Personalized electrolyte formulas designed for your unique health profile.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/survey" className="text-green-200 hover:text-white transition-colors">Take Assessment</Link></li>
                <li><Link href="/about" className="text-green-200 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/science" className="text-green-200 hover:text-white transition-colors">The Science</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/faq" className="text-green-200 hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/contact" className="text-green-200 hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/support" className="text-green-200 hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-white">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-green-200 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-green-200 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/refunds" className="text-green-200 hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-green-700 text-center text-sm text-green-200">
            <p>&copy; 2024 Personal Potions. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

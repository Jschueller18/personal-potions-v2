import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Shield, Clock, FileText } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";

export default function Survey() {
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
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Progress Indicator */}
          <div className="mb-8">
            <ProgressBar currentStep={1} totalSteps={5} steps={["Usage", "Diet", "Health", "Flavor", "Info"]} />
          </div>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">
              Personal Health Assessment
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Help us create your perfect electrolyte formula with a quick 5-minute assessment
            </p>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Information */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{backgroundColor: 'hsl(196, 89%, 90%)'}}>
                      <Clock className="h-6 w-6" style={{color: 'hsl(196, 89%, 45%)'}} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Quick & Easy
                    </h3>
                    <p className="text-gray-600">
                      Takes just 5 minutes to complete all sections
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{backgroundColor: 'hsl(137, 43%, 90%)'}}>
                      <Shield className="h-6 w-6" style={{color: 'hsl(137, 43%, 20%)'}} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Private & Secure
                    </h3>
                    <p className="text-gray-600">
                      Your health information is encrypted and never shared
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{backgroundColor: 'hsl(183, 80%, 75%)'}}>
                      <FileText className="h-6 w-6" style={{color: 'hsl(137, 43%, 20%)'}} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Science-Based
                    </h3>
                    <p className="text-gray-600">
                      Questions designed by nutrition experts and validated by research
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Assessment Overview */}
            <div className="rounded-2xl border p-8 shadow-lg" style={{borderColor: 'hsl(183, 80%, 70%)', backgroundColor: 'hsl(183, 80%, 92%)'}}>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
                What We'll Cover
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium" style={{backgroundColor: 'hsl(137, 43%, 20%)'}}>
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Usage Goals</h4>
                    <p className="text-sm text-gray-600">Activity level, workout frequency, and hydration needs</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium" style={{backgroundColor: 'hsl(196, 89%, 59%)'}}>
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Diet & Nutrition</h4>
                    <p className="text-sm text-gray-600">Eating habits and dietary restrictions</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium" style={{backgroundColor: 'hsl(137, 43%, 20%)'}}>
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Health Profile</h4>
                    <p className="text-sm text-gray-600">Medical conditions and current medications</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium" style={{backgroundColor: 'hsl(196, 89%, 59%)'}}>
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Flavor Preferences</h4>
                    <p className="text-sm text-gray-600">Taste preferences and sweetener choices</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium" style={{backgroundColor: 'hsl(137, 43%, 20%)'}}>
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Personal Information</h4>
                    <p className="text-sm text-gray-600">Basic demographics for formula calculations</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/survey/step-1"
                  className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full justify-center shadow-md hover:shadow-lg"
                  style={{backgroundColor: 'hsl(196, 89%, 59%)'}}
                >
                  Start Assessment
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Primary green background with blue logo */}
      <footer className="mt-16 text-white" style={{backgroundColor: 'hsl(137, 43%, 20%)'}}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src="/Blue-logo-pp-circle.png"
                alt="Personal Potions"
                width={48}
                height={48}
                className="h-12 w-12"
              />
              <p className="text-green-100 text-sm">
                &copy; 2024 Personal Potions. All rights reserved.
              </p>
            </div>
            
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-green-200 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-green-200 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export default function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Progress Line */}
      <div className="relative">
        <div className="absolute top-4 left-0 w-full h-0.5 bg-muted"></div>
        <div 
          className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>
        
        {/* Step Indicators */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isActive = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;
            
            return (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-300
                    ${isCompleted 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : isActive 
                      ? 'bg-background border-primary text-primary' 
                      : 'bg-background border-muted text-muted-foreground'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                
                <span 
                  className={`
                    mt-2 text-xs font-medium text-center transition-colors duration-300
                    ${isActive 
                      ? 'text-primary' 
                      : isCompleted 
                      ? 'text-foreground' 
                      : 'text-muted-foreground'
                    }
                  `}
                >
                  <span className="hidden sm:inline">{step}</span>
                  <span className="sm:hidden">{step.slice(0, 3)}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Step Counter */}
      <div className="mt-6 text-center">
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
      </div>
    </div>
  );
} 
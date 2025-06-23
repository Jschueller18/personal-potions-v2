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
        <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-300"></div>
        <div 
          className="absolute top-4 left-0 h-0.5 transition-all duration-500 ease-out"
          style={{ 
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            backgroundColor: 'hsl(137, 43%, 20%)'
          }}
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
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-300"
                  style={{
                    backgroundColor: isCompleted 
                      ? 'hsl(137, 43%, 20%)' 
                      : isActive 
                      ? 'white' 
                      : 'white',
                    borderColor: isCompleted 
                      ? 'hsl(137, 43%, 20%)' 
                      : isActive 
                      ? 'hsl(137, 43%, 20%)' 
                      : '#d1d5db',
                    color: isCompleted 
                      ? 'white' 
                      : isActive 
                      ? 'hsl(137, 43%, 20%)' 
                      : '#9ca3af'
                  }}
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
                  className="mt-2 text-xs font-medium text-center transition-colors duration-300"
                  style={{
                    color: isActive 
                      ? 'hsl(137, 43%, 20%)' 
                      : isCompleted 
                      ? '#374151' 
                      : '#9ca3af'
                  }}
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
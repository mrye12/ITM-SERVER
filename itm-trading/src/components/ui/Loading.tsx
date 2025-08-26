interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ 
  size = 'md', 
  variant = 'spinner', 
  text, 
  fullScreen = false 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const SpinnerLoader = () => (
    <div className={`animate-spin ${sizeClasses[size]}`}>
      <svg viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-25"
        />
        <path
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          className="opacity-75"
        />
      </svg>
    </div>
  );

  const DotsLoader = () => (
    <div className="flex space-x-1">
      {[1, 2, 3].map((dot) => (
        <div
          key={dot}
          className={`bg-current rounded-full animate-bounce ${
            size === 'sm' ? 'w-1 h-1' : 
            size === 'md' ? 'w-2 h-2' : 
            size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
          }`}
          style={{
            animationDelay: `${dot * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );

  const PulseLoader = () => (
    <div className={`animate-pulse bg-current rounded-full ${sizeClasses[size]}`} />
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader />;
      case 'pulse':
        return <PulseLoader />;
      default:
        return <SpinnerLoader />;
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-2 text-gray-600">
      {renderLoader()}
      {text && (
        <p className={`text-center ${textSizeClasses[size]}`}>{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

// Specialized loading components
export function PageLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading size="lg" text={text} />
    </div>
  );
}

export function ButtonLoading({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return <Loading size={size} variant="spinner" />;
}

export function TableLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loading size="md" text="Loading data..." />
    </div>
  );
}

export function FullScreenLoading({ text = "Please wait..." }: { text?: string }) {
  return <Loading size="xl" text={text} fullScreen />;
}


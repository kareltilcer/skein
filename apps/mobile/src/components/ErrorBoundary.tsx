import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { reportStatusError } from '../utils/statusReport';
import { useTheme } from '../theme/ThemeContext';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  context?: Record<string, unknown>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Report the error to status service
    const context = {
      componentStack: errorInfo.componentStack,
      ...this.props.context,
    };
    
    reportStatusError(error, {
      level: 'error',
      context: context,
      fingerprint: `react-error-${error.name}`,
    });

    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback
      return (
        <ErrorFallback 
          error={this.state.error} 
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { colors, fonts } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.brick }]}>
        <Text style={[styles.title, { color: colors.brick, fontFamily: fonts.display }]}>
          Something went wrong
        </Text>
        {error && (
          <Text style={[styles.message, { color: colors.ink }]}>
            {error.message}
          </Text>
        )}
        <Pressable style={[styles.button, { backgroundColor: colors.brick }]} onPress={onRetry}>
          <Text style={[styles.buttonText, { color: colors.bg, fontFamily: fonts.mono }]}>
            Try again
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorBox: {
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 250,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

// Wrap with theme provider for the fallback
function ThemedErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryInner {...props} />;
}

export const ErrorBoundary = ThemedErrorBoundary;
export default ErrorBoundary;
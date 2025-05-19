import React from 'react';
import { Text } from '@mantine/core';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <Text c="red">Something went wrong. Please refresh the page.</Text>;
    }
    return this.props.children;
  }
}
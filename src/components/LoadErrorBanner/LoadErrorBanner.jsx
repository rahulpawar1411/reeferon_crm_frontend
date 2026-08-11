import React from 'react';
import ExportErrorBanner from '../ExportErrorBanner/ExportErrorBanner';

/**
 * Inline load/fetch error with optional Retry — reuses export banner styling.
 */
export default function LoadErrorBanner({ message, retryable = true, onRetry, onDismiss }) {
  return (
    <ExportErrorBanner
      message={message}
      retryable={retryable}
      onRetry={onRetry}
      onDismiss={onDismiss}
    />
  );
}

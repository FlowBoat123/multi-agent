import { Skeleton } from 'antd';
import dynamic from 'next/dynamic';
import { memo } from 'react';

import { ChatMessage } from '@/types/message';

import ErrorJsonViewer from '../ErrorJsonViewer';

const loading = () => <Skeleton active style={{ width: 300 }} />;

const SetupGuide = dynamic(() => import('@/features/OllamaSetupGuide'), { loading, ssr: false });

const InvalidModel = dynamic(() => import('./InvalidOllamaModel'), { loading, ssr: false });

interface OllamaError {
  code: string | null;
  message: string;
  param?: any;
  type: string;
}

interface OllamaErrorResponse {
  error: OllamaError;
}

// Match Ollama errors like:
// - model "qwen3" not found
// - model 'qwen3' not found
// - model qwen3:latest not found
const UNRESOLVED_MODEL_REGEXP = /model\s+['"]?([^'"\s]+)['"]?\s+not\s+found/i;

const OllamaBizError = memo<ChatMessage>(({ error, id }) => {
  const errorBody: OllamaErrorResponse = (error as any)?.body;

  const errorMessage = errorBody?.error?.message || (error as any)?.message;

  // error of not pull the model
  const unresolvedModel = errorMessage?.match(UNRESOLVED_MODEL_REGEXP)?.[1];
  if (unresolvedModel) {
    return <InvalidModel id={id} model={unresolvedModel} />;
  }

  // error of not enable model or not set the CORS rules
  if (errorMessage?.includes('Failed to fetch')) {
    return <SetupGuide id={id} />;
  }

  return <ErrorJsonViewer error={error} id={id} />;
});

export default OllamaBizError;

import {
  StartFaceLivenessSessionCommandInput,
  StartFaceLivenessSessionCommandOutput,
} from '@aws-sdk/client-rekognitionstreaming';
import { HttpRequest } from '@smithy/protocol-http';
import {
  BuildHandler,
  BuildHandlerArguments,
  BuildHandlerOutput,
} from '@smithy/types';

export const ATTEMPT_KEY = 'AmplifyLivenessAttempt';
const DEFAULT_ATTEMPT_COUNT_TIMEOUT = 300000; // 5 minutes / 300000 ms

type AttemptCountData = { timestamp: number; count: number };

function getAttemptCountData(): AttemptCountData {
  return JSON.parse(localStorage.getItem(ATTEMPT_KEY) ?? '{}') as {
    timestamp: number;
    count: number;
  };
}

function setAttemptCountData(data: AttemptCountData) {
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(data));
}

export function getAttemptCount(): number {
  const data = getAttemptCountData();

  let count = data.count ?? 0;
  const timestamp = data.timestamp ?? Date.now();

  const timeSinceLastAttempt = Date.now() - timestamp;
  if (timeSinceLastAttempt > DEFAULT_ATTEMPT_COUNT_TIMEOUT) {
    count = 1;
  } else {
    count += 1;
  }

  setAttemptCountData({ timestamp: Date.now(), count });

  return count;
}

export const createTelemetryReporterMiddleware =
  (attemptCount: number, preCheckViewEnabled: boolean) =>
  (
    next: BuildHandler<
      StartFaceLivenessSessionCommandInput,
      StartFaceLivenessSessionCommandOutput
    >
  ) =>
  async (
    args: BuildHandlerArguments<StartFaceLivenessSessionCommandInput>
  ): Promise<BuildHandlerOutput<StartFaceLivenessSessionCommandOutput>> => {
    (args.request as HttpRequest).query['attempt-count'] =
      attemptCount.toString();
    (args.request as HttpRequest).query['precheck-view-enabled'] =
      preCheckViewEnabled ? '1' : '0';

    const result = await next(args);
    return result;
  };

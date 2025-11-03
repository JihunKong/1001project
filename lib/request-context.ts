import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  userId?: string;
  userRole?: string;
  path?: string;
  method?: string;
  timestamp?: number;
}

export interface WorkerContext {
  workerId: string;
  jobId?: string;
  jobType?: string;
  timestamp?: number;
}

export type LogContext = RequestContext | WorkerContext;

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();
export const workerContextStorage = new AsyncLocalStorage<WorkerContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

export function getWorkerContext(): WorkerContext | undefined {
  return workerContextStorage.getStore();
}

export function getActiveContext(): LogContext | undefined {
  return getRequestContext() || getWorkerContext();
}

export function setRequestContext(context: RequestContext): void {
  requestContextStorage.enterWith(context);
}

export function setWorkerContext(context: WorkerContext): void {
  workerContextStorage.enterWith(context);
}

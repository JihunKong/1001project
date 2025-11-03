export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFormat = 'json' | 'pretty';

export interface LoggerConfig {
  level: LogLevel;
  format: LogFormat;
  enableSampling: boolean;
  samplingRules: SamplingRule[];
  enablePerformanceLogging: boolean;
}

export interface SamplingRule {
  path?: string;
  pathPattern?: RegExp;
  sampleRate: number;
  minLevel?: LogLevel;
}

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  if (level === 'debug' || level === 'info' || level === 'warn' || level === 'error') {
    return level;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function getLogFormat(): LogFormat {
  const format = process.env.LOG_FORMAT?.toLowerCase();
  if (format === 'json' || format === 'pretty') {
    return format;
  }
  return process.env.NODE_ENV === 'production' ? 'json' : 'pretty';
}

function parseSamplingRules(): SamplingRule[] {
  const rulesEnv = process.env.LOG_SAMPLING_RULES;
  if (!rulesEnv) {
    return [];
  }

  try {
    const rules = JSON.parse(rulesEnv);
    return Array.isArray(rules) ? rules.map((rule) => ({
      ...rule,
      pathPattern: rule.pathPattern ? new RegExp(rule.pathPattern) : undefined,
    })) : [];
  } catch {
    return [];
  }
}

export function getLoggerConfig(): LoggerConfig {
  return {
    level: getLogLevel(),
    format: getLogFormat(),
    enableSampling: process.env.LOG_ENABLE_SAMPLING === 'true',
    samplingRules: parseSamplingRules(),
    enablePerformanceLogging: process.env.LOG_ENABLE_PERFORMANCE === 'true' || process.env.NODE_ENV !== 'production',
  };
}

export function shouldLog(configLevel: LogLevel, logLevel: LogLevel): boolean {
  return LOG_LEVEL_ORDER[logLevel] >= LOG_LEVEL_ORDER[configLevel];
}

export function shouldSample(path: string | undefined, rules: SamplingRule[]): boolean {
  if (!path || rules.length === 0) {
    return true;
  }

  for (const rule of rules) {
    if (rule.path && rule.path === path) {
      return Math.random() < rule.sampleRate;
    }
    if (rule.pathPattern && rule.pathPattern.test(path)) {
      return Math.random() < rule.sampleRate;
    }
  }

  return true;
}

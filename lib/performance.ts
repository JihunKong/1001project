/**
 * Performance monitoring utilities for 1001 Stories
 * Provides tools for measuring and optimizing application performance
 */

import React from 'react';
import { logger } from '@/lib/logger';

// Performance metrics types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  context?: Record<string, unknown>;
}

export interface ComponentPerformanceData {
  componentName: string;
  renderTime: number;
  rerenderCount: number;
  propsChanges: number;
  lastRender: number;
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private componentMetrics = new Map<string, ComponentPerformanceData>();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Record a performance metric
  recordMetric(
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' = 'ms',
    context?: Record<string, unknown>
  ): void {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
      context,
    });

    // Keep only last 100 metrics to prevent memory bloat
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log performance issues
    if (unit === 'ms' && value > 1000) {
      logger.warn(`Slow operation detected: ${name} took ${value}ms`, { context });
    }
  }

  // Get performance metrics
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter((metric) => metric.name === name);
    }
    return [...this.metrics];
  }

  // Get average performance for a metric
  getAveragePerformance(name: string): number {
    const relevantMetrics = this.getMetrics(name);
    if (relevantMetrics.length === 0) return 0;

    const sum = relevantMetrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / relevantMetrics.length;
  }

  // Record component performance
  recordComponentRender(componentName: string, renderTime: number): void {
    const existing = this.componentMetrics.get(componentName);

    if (existing) {
      existing.rerenderCount++;
      existing.renderTime = renderTime;
      existing.lastRender = Date.now();
    } else {
      this.componentMetrics.set(componentName, {
        componentName,
        renderTime,
        rerenderCount: 1,
        propsChanges: 0,
        lastRender: Date.now(),
      });
    }

    // Record as general metric
    this.recordMetric(`component_render_${componentName}`, renderTime, 'ms', {
      component: componentName,
    });
  }

  // Get component performance data
  getComponentMetrics(componentName?: string): ComponentPerformanceData[] {
    if (componentName) {
      const metric = this.componentMetrics.get(componentName);
      return metric ? [metric] : [];
    }
    return Array.from(this.componentMetrics.values());
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
    this.componentMetrics.clear();
  }
}

// Timer utility for measuring execution time
export class Timer {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = performance.now();
  }

  end(context?: Record<string, unknown>): number {
    const duration = performance.now() - this.startTime;
    const monitor = PerformanceMonitor.getInstance();
    monitor.recordMetric(this.name, duration, 'ms', context);
    return duration;
  }

  static time<T>(name: string, fn: () => T, context?: Record<string, unknown>): T {
    const timer = new Timer(name);
    const result = fn();
    timer.end(context);
    return result;
  }

  static async timeAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const timer = new Timer(name);
    const result = await fn();
    timer.end(context);
    return result;
  }
}

// React performance hooks
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();

  return {
    recordRender: (renderTime: number) => {
      monitor.recordComponentRender(componentName, renderTime);
    },
    recordAction: (actionName: string, duration: number, context?: Record<string, unknown>) => {
      monitor.recordMetric(`${componentName}_${actionName}`, duration, 'ms', {
        component: componentName,
        ...context,
      });
    },
    getMetrics: () => monitor.getComponentMetrics(componentName),
  };
}

// Database query performance wrapper
export async function measureDbQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  return Timer.timeAsync(`db_${queryName}`, queryFn, {
    type: 'database',
    query: queryName,
    ...context,
  });
}

// API performance wrapper
export async function measureApiCall<T>(
  endpoint: string,
  apiFn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  return Timer.timeAsync(`api_${endpoint}`, apiFn, {
    type: 'api',
    endpoint,
    ...context,
  });
}

// Bundle size analyzer (for client-side)
export function analyzeBundle(): void {
  if (typeof window === 'undefined') return;

  const monitor = PerformanceMonitor.getInstance();

  // Analyze loaded scripts
  const scripts = Array.from(document.scripts);
  let totalScriptSize = 0;

  scripts.forEach((script) => {
    if (script.src) {
      // This is an approximation - in practice you'd need server-side size info
      const estimatedSize = script.src.length * 50; // Rough estimate
      totalScriptSize += estimatedSize;
    }
  });

  monitor.recordMetric('bundle_size_estimate', totalScriptSize, 'bytes', {
    scriptCount: scripts.length,
  });
}

// Memory usage monitoring
export function monitorMemoryUsage(): void {
  if (typeof window === 'undefined') return;

  const monitor = PerformanceMonitor.getInstance();

  // Check if memory API is available
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    monitor.recordMetric('memory_used', memory.usedJSHeapSize, 'bytes');
    monitor.recordMetric('memory_total', memory.totalJSHeapSize, 'bytes');
    monitor.recordMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes');
  }
}

// React component performance HOC
export function withPerformanceMonitoring<P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    const { recordRender } = usePerformanceMonitor(componentName);

    React.useEffect(() => {
      const startTime = performance.now();

      return () => {
        const renderTime = performance.now() - startTime;
        recordRender(renderTime);
      };
    });

    return React.createElement(WrappedComponent, props);
  };
}

// Performance report generator
export function generatePerformanceReport(): {
  summary: Record<string, number>;
  slowOperations: PerformanceMetric[];
  componentStats: ComponentPerformanceData[];
  recommendations: string[];
} {
  const monitor = PerformanceMonitor.getInstance();
  const metrics = monitor.getMetrics();
  const componentStats = monitor.getComponentMetrics();

  // Calculate summary statistics
  const summary: Record<string, number> = {};
  const metricsByName = new Map<string, number[]>();

  metrics.forEach((metric) => {
    if (!metricsByName.has(metric.name)) {
      metricsByName.set(metric.name, []);
    }
    metricsByName.get(metric.name)!.push(metric.value);
  });

  metricsByName.forEach((values, name) => {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    summary[`${name}_avg`] = Math.round(avg);
    summary[`${name}_max`] = Math.max(...values);
    summary[`${name}_count`] = values.length;
  });

  // Identify slow operations (> 500ms)
  const slowOperations = metrics.filter((metric) =>
    metric.unit === 'ms' && metric.value > 500
  );

  // Generate recommendations
  const recommendations: string[] = [];

  if (slowOperations.length > 0) {
    recommendations.push(
      `Found ${slowOperations.length} slow operations. Consider optimization.`
    );
  }

  const slowComponents = componentStats.filter((comp) => comp.renderTime > 100);
  if (slowComponents.length > 0) {
    recommendations.push(
      `${slowComponents.length} components have slow render times. Consider React.memo or useMemo.`
    );
  }

  const frequentRerenders = componentStats.filter((comp) => comp.rerenderCount > 10);
  if (frequentRerenders.length > 0) {
    recommendations.push(
      `${frequentRerenders.length} components re-render frequently. Check dependency arrays.`
    );
  }

  return {
    summary,
    slowOperations,
    componentStats,
    recommendations,
  };
}

// Development-only performance logging
export function enablePerformanceLogging(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const monitor = PerformanceMonitor.getInstance();

  // Log performance report every 30 seconds
  setInterval(() => {
    const report = generatePerformanceReport();
    if (report.slowOperations.length > 0 || report.recommendations.length > 0) {
      logger.info('Performance Report', { summary: report.summary });
      if (report.slowOperations.length > 0) {
        logger.warn('Slow operations', { slowOperations: report.slowOperations });
      }
      if (report.recommendations.length > 0) {
        logger.info('Recommendations', { recommendations: report.recommendations });
      }
    }
  }, 30000);
}
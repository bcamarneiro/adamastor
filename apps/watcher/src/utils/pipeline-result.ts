/**
 * Pipeline Result Aggregator
 *
 * Tracks success/failure counts across pipeline steps
 * and provides a summary at the end.
 */

import { reportPipelineError } from './sentry.js';

interface StepResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  processed: number;
  failed: number;
  errors: string[];
  duration: number;
}

class PipelineResult {
  private steps: StepResult[] = [];
  private startTime: number = Date.now();

  /**
   * Record a step result
   */
  addStep(
    name: string,
    result: {
      status: 'success' | 'warning' | 'error';
      processed?: number;
      failed?: number;
      errors?: string[];
      duration?: number;
    }
  ): void {
    this.steps.push({
      name,
      status: result.status,
      processed: result.processed ?? 0,
      failed: result.failed ?? 0,
      errors: result.errors ?? [],
      duration: result.duration ?? 0,
    });
  }

  /**
   * Check if pipeline has any errors
   */
  hasErrors(): boolean {
    return this.steps.some((s) => s.status === 'error');
  }

  /**
   * Check if pipeline has warnings
   */
  hasWarnings(): boolean {
    return this.steps.some((s) => s.status === 'warning');
  }

  /**
   * Get total failure count
   */
  totalFailures(): number {
    return this.steps.reduce((sum, s) => sum + s.failed, 0);
  }

  /**
   * Get total processed count
   */
  totalProcessed(): number {
    return this.steps.reduce((sum, s) => sum + s.processed, 0);
  }

  /**
   * Print summary to console
   */
  printSummary(): void {
    const totalDuration = Date.now() - this.startTime;

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('           PIPELINE SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Step summary table
    for (const step of this.steps) {
      const icon = step.status === 'success' ? '✅' : step.status === 'warning' ? '⚠️ ' : '❌';
      const stats =
        step.processed > 0 ? ` (${step.processed - step.failed}/${step.processed})` : '';
      console.log(`  ${icon} ${step.name}${stats}`);

      // Show errors if any
      if (step.errors.length > 0) {
        for (const error of step.errors.slice(0, 3)) {
          console.log(`      └─ ${error}`);
        }
        if (step.errors.length > 3) {
          console.log(`      └─ ... and ${step.errors.length - 3} more errors`);
        }
      }
    }

    console.log();
    console.log(`  Total: ${this.totalProcessed()} processed, ${this.totalFailures()} failed`);
    console.log(`  Duration: ${(totalDuration / 1000).toFixed(1)}s`);

    // Overall status
    if (this.hasErrors()) {
      console.log('\n  ❌ Pipeline completed with errors\n');
    } else if (this.hasWarnings()) {
      console.log('\n  ⚠️  Pipeline completed with warnings\n');
    } else {
      console.log('\n  ✅ Pipeline completed successfully\n');
    }
  }

  /**
   * Get exit code based on results
   */
  getExitCode(): number {
    if (this.hasErrors()) return 1;
    return 0;
  }
}

// Singleton instance
export const pipelineResult = new PipelineResult();

/**
 * Helper to wrap a step with timing and error handling
 */
export async function runStep<T>(
  name: string,
  fn: () => Promise<{ processed: number; failed: number; errors?: string[] } | T>,
  options: { critical?: boolean } = {}
): Promise<T | null> {
  const start = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - start;

    // Check if result has our expected shape
    if (result && typeof result === 'object' && 'processed' in result && 'failed' in result) {
      const r = result as { processed: number; failed: number; errors?: string[] };
      const status = r.failed > 0 ? 'warning' : 'success';
      pipelineResult.addStep(name, {
        status,
        processed: r.processed,
        failed: r.failed,
        errors: r.errors,
        duration,
      });
    } else {
      pipelineResult.addStep(name, { status: 'success', duration });
    }

    return result as T;
  } catch (error) {
    const duration = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Report to Sentry
    if (error instanceof Error) {
      reportPipelineError(name, error, { critical: options.critical });
    }

    if (options.critical) {
      pipelineResult.addStep(name, {
        status: 'error',
        errors: [errorMessage],
        duration,
      });
      throw error; // Re-throw for critical steps
    }

    pipelineResult.addStep(name, {
      status: 'warning',
      errors: [errorMessage],
      duration,
    });
    console.warn(`  ⚠️  ${name} failed (non-critical): ${errorMessage}`);
    return null;
  }
}

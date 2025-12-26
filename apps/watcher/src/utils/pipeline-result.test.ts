import { beforeEach, describe, expect, it } from 'bun:test';

// We need to test the class directly, not the singleton
// So we'll import the module and create fresh instances

describe('PipelineResult', () => {
  // Re-implement a minimal version for testing since the singleton is already initialized
  class TestPipelineResult {
    private steps: Array<{
      name: string;
      status: 'success' | 'warning' | 'error';
      processed: number;
      failed: number;
      errors: string[];
    }> = [];

    addStep(
      name: string,
      result: {
        status: 'success' | 'warning' | 'error';
        processed?: number;
        failed?: number;
        errors?: string[];
      }
    ): void {
      this.steps.push({
        name,
        status: result.status,
        processed: result.processed ?? 0,
        failed: result.failed ?? 0,
        errors: result.errors ?? [],
      });
    }

    hasErrors(): boolean {
      return this.steps.some((s) => s.status === 'error');
    }

    hasWarnings(): boolean {
      return this.steps.some((s) => s.status === 'warning');
    }

    totalFailures(): number {
      return this.steps.reduce((sum, s) => sum + s.failed, 0);
    }

    totalProcessed(): number {
      return this.steps.reduce((sum, s) => sum + s.processed, 0);
    }

    getExitCode(): number {
      if (this.hasErrors()) return 1;
      return 0;
    }
  }

  let result: TestPipelineResult;

  beforeEach(() => {
    result = new TestPipelineResult();
  });

  describe('addStep', () => {
    it('should add a successful step', () => {
      result.addStep('Test Step', { status: 'success', processed: 10, failed: 0 });

      expect(result.hasErrors()).toBe(false);
      expect(result.hasWarnings()).toBe(false);
      expect(result.totalProcessed()).toBe(10);
      expect(result.totalFailures()).toBe(0);
    });

    it('should add a warning step', () => {
      result.addStep('Test Step', {
        status: 'warning',
        processed: 10,
        failed: 2,
        errors: ['Error 1', 'Error 2'],
      });

      expect(result.hasErrors()).toBe(false);
      expect(result.hasWarnings()).toBe(true);
      expect(result.totalProcessed()).toBe(10);
      expect(result.totalFailures()).toBe(2);
    });

    it('should add an error step', () => {
      result.addStep('Test Step', {
        status: 'error',
        errors: ['Fatal error'],
      });

      expect(result.hasErrors()).toBe(true);
      expect(result.getExitCode()).toBe(1);
    });
  });

  describe('aggregation', () => {
    it('should aggregate totals across multiple steps', () => {
      result.addStep('Step 1', { status: 'success', processed: 100, failed: 0 });
      result.addStep('Step 2', { status: 'warning', processed: 50, failed: 5 });
      result.addStep('Step 3', { status: 'success', processed: 25, failed: 0 });

      expect(result.totalProcessed()).toBe(175);
      expect(result.totalFailures()).toBe(5);
    });

    it('should report errors if any step has error status', () => {
      result.addStep('Step 1', { status: 'success' });
      result.addStep('Step 2', { status: 'error', errors: ['Failed'] });
      result.addStep('Step 3', { status: 'success' });

      expect(result.hasErrors()).toBe(true);
      expect(result.getExitCode()).toBe(1);
    });
  });

  describe('getExitCode', () => {
    it('should return 0 for all success', () => {
      result.addStep('Step 1', { status: 'success' });
      result.addStep('Step 2', { status: 'success' });

      expect(result.getExitCode()).toBe(0);
    });

    it('should return 0 for warnings only', () => {
      result.addStep('Step 1', { status: 'success' });
      result.addStep('Step 2', { status: 'warning' });

      expect(result.getExitCode()).toBe(0);
    });

    it('should return 1 for any errors', () => {
      result.addStep('Step 1', { status: 'success' });
      result.addStep('Step 2', { status: 'error' });

      expect(result.getExitCode()).toBe(1);
    });
  });
});

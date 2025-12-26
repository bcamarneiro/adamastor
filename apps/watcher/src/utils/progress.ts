/**
 * Simple progress bar utility for CLI output.
 */

export class ProgressBar {
  private current = 0;
  private lastPrintedPercent = -1;
  private startTime: number;

  constructor(
    private total: number,
    private label: string,
    private barWidth = 30
  ) {
    this.startTime = Date.now();
  }

  /**
   * Update progress and print if percentage changed
   */
  update(current?: number): void {
    if (current !== undefined) {
      this.current = current;
    } else {
      this.current++;
    }

    const percent = Math.floor((this.current / this.total) * 100);

    // Only print when percentage changes (reduces console noise)
    if (percent !== this.lastPrintedPercent) {
      this.print(percent);
      this.lastPrintedPercent = percent;
    }
  }

  /**
   * Print the progress bar
   */
  private print(percent: number): void {
    const filled = Math.floor((percent / 100) * this.barWidth);
    const empty = this.barWidth - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

    // Use \r to overwrite the line (no newline)
    process.stdout.write(
      `\r  ${this.label} [${bar}] ${percent}% (${this.current}/${this.total}) ${elapsed}s`
    );
  }

  /**
   * Complete the progress bar
   */
  complete(message?: string): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const finalMessage = message || `${this.current}/${this.total} in ${elapsed}s`;
    process.stdout.write(
      `\r  ${this.label} [${'█'.repeat(this.barWidth)}] 100% - ${finalMessage}\n`
    );
  }

  /**
   * Fail the progress bar
   */
  fail(message: string): void {
    process.stdout.write(`\r  ${this.label} ❌ ${message}\n`);
  }
}

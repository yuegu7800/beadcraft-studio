export class GridHistory {
  private past: Array<Array<string | null>> = [];
  private future: Array<Array<string | null>> = [];

  constructor(private limit = 60) {}

  reset(): void {
    this.past = [];
    this.future = [];
  }

  push(cells: Array<string | null>): void {
    this.past.push([...cells]);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  undo(current: Array<string | null>): Array<string | null> | null {
    const previous = this.past.pop();
    if (!previous) return null;
    this.future.push([...current]);
    return previous;
  }

  redo(current: Array<string | null>): Array<string | null> | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push([...current]);
    return next;
  }

  get canUndo(): boolean { return this.past.length > 0; }
  get canRedo(): boolean { return this.future.length > 0; }
}

export function replaceColor(cells: Array<string | null>, from: string, to: string | null): Array<string | null> {
  return cells.map((code) => code === from ? to : code);
}

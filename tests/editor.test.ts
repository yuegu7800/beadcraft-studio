import { describe, expect, it } from 'vitest';
import { GridHistory, replaceColor } from '../src/core/editor';

describe('grid editing history', () => {
  it('undoes and redoes cell snapshots', () => {
    const history = new GridHistory();
    const first = ['A', 'B', null];
    history.push(first);
    const edited = ['C', 'B', null];
    expect(history.undo(edited)).toEqual(first);
    expect(history.redo(first)).toEqual(edited);
  });

  it('clears redo after a new edit', () => {
    const history = new GridHistory();
    history.push(['A']);
    history.undo(['B']);
    history.push(['C']);
    expect(history.canRedo).toBe(false);
  });
});

it('replaces every matching color without touching blanks', () => {
  expect(replaceColor(['A', null, 'B', 'A'], 'A', 'C')).toEqual(['C', null, 'B', 'C']);
});

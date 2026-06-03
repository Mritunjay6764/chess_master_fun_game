// src/__tests__/chessHelpers.test.ts
import {
  createChess,
  applyMove,
  isLegalDestination,
  isPromotionMove,
  legalMovesFrom,
  capturedPieces,
  materialAdvantage,
} from '../utils/chessHelpers';

describe('chessHelpers', () => {
  it('legal e2-e4 from start', () => {
    const c = createChess();
    expect(isLegalDestination(c, 'e2', 'e4')).toBe(true);
  });

  it('rejects illegal e2-e5 from start', () => {
    const c = createChess();
    expect(isLegalDestination(c, 'e2', 'e5')).toBe(false);
  });

  it('detects promotion move', () => {
    const c = createChess('8/P7/8/8/8/8/8/k6K w - - 0 1');
    expect(isPromotionMove(c, 'a7', 'a8')).toBe(true);
  });

  it('applies promotion only with piece chosen', () => {
    const c = createChess('8/P7/8/8/8/8/8/k6K w - - 0 1');
    expect(applyMove(c, 'a7', 'a8')).toBeNull(); // missing promotion
    expect(applyMove(c, 'a7', 'a8', 'q')?.promotion).toBe('q');
  });

  it('captured pieces & material advantage', () => {
    const c = createChess();
    applyMove(c, 'e2', 'e4');
    applyMove(c, 'd7', 'd5');
    applyMove(c, 'e4', 'd5'); // white captures pawn
    expect(capturedPieces(c).white).toEqual(['p']);
    expect(materialAdvantage(c)).toBe(1);
  });

  it('legal moves list is non-empty for starting pawn', () => {
    const c = createChess();
    expect(legalMovesFrom(c, 'e2').length).toBeGreaterThan(0);
  });
});

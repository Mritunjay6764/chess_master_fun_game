// src/__tests__/useTimer.test.ts — verifies tick + flag behavior
import { renderHook, act } from '@testing-library/react-native';
import { useTimer } from '../hooks/useTimer';

jest.useFakeTimers();

describe('useTimer', () => {
  it('counts down active color and freezes opponent', () => {
    const { result } = renderHook(() =>
      useTimer({
        whiteMs: 60_000,
        blackMs: 60_000,
        lastServerSyncAt: Date.now(),
        activeColor: 'w',
        paused: false,
      }),
    );
    act(() => {
      jest.advanceTimersByTime(2_000);
    });
    expect(result.current.whiteMs).toBeLessThan(60_000);
    expect(result.current.blackMs).toBe(60_000);
  });

  it('fires onFlag when active clock hits 0', () => {
    const onFlag = jest.fn();
    renderHook(() =>
      useTimer({
        whiteMs: 500,
        blackMs: 60_000,
        lastServerSyncAt: Date.now(),
        activeColor: 'w',
        paused: false,
        onFlag,
      }),
    );
    act(() => {
      jest.advanceTimersByTime(1_000);
    });
    expect(onFlag).toHaveBeenCalledWith('w');
  });
});

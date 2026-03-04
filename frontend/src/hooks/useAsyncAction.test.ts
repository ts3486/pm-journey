import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAsyncAction } from "./useAsyncAction";

describe("useAsyncAction", () => {
  it("has isLoading=false and error=null in the initial state", () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAsyncAction(action));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets isLoading=true during execution and false after success", async () => {
    let resolveAction!: (value: string) => void;
    const action = vi.fn(
      () => new Promise<string>((resolve) => { resolveAction = resolve; })
    );

    const { result } = renderHook(() => useAsyncAction(action));

    let executePromise: Promise<string | undefined>;
    act(() => {
      executePromise = result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      resolveAction("done");
      await executePromise;
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("returns the resolved value from the action", async () => {
    const action = vi.fn().mockResolvedValue(42);
    const { result } = renderHook(() => useAsyncAction(action));

    let returnValue: number | undefined;
    await act(async () => {
      returnValue = await result.current.execute();
    });

    expect(returnValue).toBe(42);
  });

  it("sets error and re-throws when the action rejects", async () => {
    const cause = new Error("something went wrong");
    const action = vi.fn().mockRejectedValue(cause);
    const { result } = renderHook(() => useAsyncAction(action));

    await act(async () => {
      await expect(result.current.execute()).rejects.toThrow("something went wrong");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(cause);
  });

  it("resets error to null on a subsequent successful call after a failure", async () => {
    const cause = new Error("first failure");
    const action = vi.fn()
      .mockRejectedValueOnce(cause)
      .mockResolvedValueOnce("ok");

    const { result } = renderHook(() => useAsyncAction(action));

    await act(async () => {
      await expect(result.current.execute()).rejects.toThrow();
    });

    expect(result.current.error).toBe(cause);

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("passes all arguments through to the action function", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAsyncAction((a: number, b: string, c: boolean) => action(a, b, c))
    );

    await act(async () => {
      await result.current.execute(1, "hello", true);
    });

    expect(action).toHaveBeenCalledWith(1, "hello", true);
  });
});

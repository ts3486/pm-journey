import { useCallback, useState } from "react";

export type AsyncActionState<TError = Error> = {
  isLoading: boolean;
  error: TError | null;
};

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
) {
  const [state, setState] = useState<AsyncActionState>({
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: TArgs) => {
      setState({ isLoading: true, error: null });
      try {
        const result = await action(...args);
        setState({ isLoading: false, error: null });
        return result;
      } catch (error) {
        setState({ isLoading: false, error: error as Error });
        throw error;
      }
    },
    [action]
  );

  return { ...state, execute };
}

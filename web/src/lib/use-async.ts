import { useCallback, useEffect, useState, type DependencyList } from "react";

export type AsyncResult<T> =
  | { status: "loading"; data?: undefined; error?: undefined; reload: () => void }
  | { status: "success"; data: T; error?: undefined; reload: () => void }
  | { status: "error"; data?: undefined; error: Error; reload: () => void };

export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
): AsyncResult<T> {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "success"; data: T }
    | { status: "error"; error: Error }
  >({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    fetcher()
      .then((data) => {
        if (active) setState({ status: "success", data });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          status: "error",
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });

    return () => {
      active = false;
    };
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  if (state.status === "success") {
    return { status: "success", data: state.data, reload };
  }

  if (state.status === "error") {
    return { status: "error", error: state.error, reload };
  }

  return { status: "loading", reload };
}

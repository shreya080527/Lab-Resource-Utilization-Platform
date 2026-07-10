import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

// ---------------------------------------------------------------------------
// Router shim — exposes the same interface the rest of the app was built
// against ({ path, query, navigate, back }), but backed by React Router v6.
//
// Pages call `useRouter()` and destructure what they need; a few legacy call
// sites use the zustand-style selector form `useRouter((s) => s.navigate)`,
// which is also supported.
//
// `matchRoute` is a pure helper (unchanged) used by pages that need to read a
// path parameter out of the current location.
// ---------------------------------------------------------------------------

export interface RouteState {
  /** path portion, e.g. "/equipment/3" (no query, no hash) */
  path: string;
  /** parsed query params */
  query: Record<string, string>;
  /** raw location (path + search), best-effort compatibility field */
  hash: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
  back: () => void;
}

export function useRouter(): RouteState;
export function useRouter<T>(selector: (s: RouteState) => T): T;
export function useRouter<T>(selector?: (s: RouteState) => T): T | RouteState {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const query: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) {
    query[k] = v;
  }

  let path = location.pathname || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);

  const state: RouteState = {
    path,
    query,
    hash: location.pathname + location.search,
    navigate: (to, opts) => {
      // Normalize: allow "/x" or "#/x" or "x"
      let target = to;
      if (target.startsWith("#")) target = target.slice(1);
      if (!target.startsWith("/")) target = "/" + target;
      navigate(target, { replace: opts?.replace });
    },
    back: () => navigate(-1),
  };

  return selector ? selector(state) : state;
}

// Helpers for route matching (pure, framework-agnostic)
export function matchRoute(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const pp = pattern.split("/").filter(Boolean);
  const ap = path.split("/").filter(Boolean);
  if (pp.length !== ap.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) {
      params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
    } else if (pp[i] !== ap[i]) {
      return null;
    }
  }
  return params;
}

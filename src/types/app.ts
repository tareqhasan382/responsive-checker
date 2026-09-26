/** Lifecycle of the target document inside the preview frame. */
export type FrameStatus =
  /** No target URL has been committed yet. */
  | 'empty'
  /** A target is set and the frame is fetching it. */
  | 'loading'
  /** The frame reported a load event. */
  | 'ready'
  /** The browser reported an error for the frame. */
  | 'error'
  /** The frame never reported a load event in time — the site may block embedding. */
  | 'stalled';

export interface TargetUrl {
  /** The normalized, absolute URL loaded in the frame. */
  readonly value: string;
  /** Hostname extracted for display, e.g. `example.com`. */
  readonly hostname: string;
}

export type UrlValidationResult =
  | { readonly ok: true; readonly url: string }
  | { readonly ok: false; readonly error: string };

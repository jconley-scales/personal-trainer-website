// Express 4 does not catch rejected promises from an async route handler -
// an unexpected error would otherwise leave the request hanging with no
// response instead of reaching the JSON error handler in index.js. Wrap
// every async handler with this so real bugs still produce a clean 500
// instead of a silently hung request.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

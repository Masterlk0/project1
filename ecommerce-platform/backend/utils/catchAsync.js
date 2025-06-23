// Utility function to wrap async route handlers and catch errors
// This avoids repeating try-catch blocks in every async controller.
// Errors are passed to the next error-handling middleware.

module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Catches promise rejections and passes them to Express error handler
  };
};

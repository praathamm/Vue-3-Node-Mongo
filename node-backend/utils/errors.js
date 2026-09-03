function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function sendControllerError(res, label, error, fallbackMessage) {
  console.error(`${label}:`, error);
  return res.status(error.status || 500).json({ message: error.status ? error.message : fallbackMessage });
}

module.exports = { httpError, sendControllerError };

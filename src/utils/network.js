/** Hints are optional: unsupported browsers retain the normal experience. */
export function isConstrainedConnection(connection) {
  return Boolean(
    connection &&
      (connection.saveData ||
        ["slow-2g", "2g", "3g"].includes(connection.effectiveType) ||
        (connection.downlink > 0 && connection.downlink < 1.5) ||
        connection.rtt >= 300),
  );
}

export function prefersLightTransfer() {
  return (
    typeof navigator !== "undefined" &&
    isConstrainedConnection(navigator.connection)
  );
}

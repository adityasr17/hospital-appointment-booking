const slotLocks = {};

let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const lockSlot = (key, userId) => {
  if (slotLocks[key]) return false;

  slotLocks[key] = {
    userId,
    expiresAt: Date.now() + 2 * 60 * 1000
  };

  // Parse key to extract doctorId, date, slotTime for the release event
  const [doctorId, date, slotTime] = key.split("_");

  setTimeout(() => {
    if (slotLocks[key]) {
      delete slotLocks[key];

      // Emit slotReleased so clients can unlock the UI
      if (ioInstance) {
        ioInstance.emit("slotReleased", { doctorId, date, slotTime });
      }
    }
  }, 2 * 60 * 1000);

  return true;
};

const releaseSlot = (key) => {
  if (slotLocks[key]) {
    delete slotLocks[key];

    // Parse key and emit release event
    const [doctorId, date, slotTime] = key.split("_");
    if (ioInstance) {
      ioInstance.emit("slotReleased", { doctorId, date, slotTime });
    }
  }
};

const getLock = (key) => {
  return slotLocks[key] || null;
};

module.exports = { lockSlot, releaseSlot, getLock, setIO };

const slotLocks = {};

const lockSlot = (key, userId) => {
  if (slotLocks[key]) return false;

  slotLocks[key] = {
    userId,
    expiresAt: Date.now() + 2 * 60 * 1000
  };

  setTimeout(() => {
    delete slotLocks[key];
  }, 2 * 60 * 1000);

  return true;
};

const releaseSlot = (key) => {
  delete slotLocks[key];
};

const getLock = (key) => {
  return slotLocks[key] || null;
};

module.exports = { lockSlot, releaseSlot, getLock };

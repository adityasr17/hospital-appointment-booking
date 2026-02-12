const generateSlots = (startTime, endTime, breakStart, breakEnd) => {
  const slots = [];

  const toMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const toTimeFormat = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}`;
  };

  let current = toMinutes(startTime);
  const end = toMinutes(endTime);
  const breakS = breakStart ? toMinutes(breakStart) : null;
  const breakE = breakEnd ? toMinutes(breakEnd) : null;

  while (current + 15 <= end) {
    if (breakS && current >= breakS && current < breakE) {
      current += 15;
      continue;
    }

    slots.push({
      time: toTimeFormat(current),
      isBooked: false,
    });

    current += 15;
  }

  return slots;
};

module.exports = generateSlots;

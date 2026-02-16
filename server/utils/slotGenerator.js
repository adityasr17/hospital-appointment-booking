const generateSlots = (startTime, endTime, breakStart, breakEnd) => {
  const slots = [];

  const toMinutes = (time) => {
    if (!time || typeof time !== 'string') return null;
    const parts = time.split(":");
    if (parts.length !== 2) return null; // Invalid format
    const [hours, minutes] = parts.map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
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
  let breakS = breakStart ? toMinutes(breakStart) : null;
  let breakE = breakEnd ? toMinutes(breakEnd) : null;

  if (current === null || end === null) {
    throw new Error("Invalid start or end time format. Use HH:MM");
  }

  // If break times are invalid but provided, strict validation should probably fail
  // But to be consistent with "no break if invalid", we could check if user INTENDED a break.
  // However, silent failure was the original bug.
  if (breakStart && breakStart !== "undefined" && breakStart !== "null" && breakS === null) throw new Error("Invalid break start time format. Use HH:MM");
  if (breakEnd && breakEnd !== "undefined" && breakEnd !== "null" && breakE === null) throw new Error("Invalid break end time format. Use HH:MM");

  while (current + 15 <= end) {
    if (breakS !== null && breakE !== null && current >= breakS && current < breakE) {
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

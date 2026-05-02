function validateStepsSequential(steps) {
  if (!Array.isArray(steps) || steps.length < 1) {
    return { valid: false, message: "steps must be a non-empty array" };
  }

  const nums = steps.map((s) => s.stepNumber);
  const unique = new Set(nums);

  if (unique.size !== nums.length) {
    return { valid: false, message: "steps.stepNumber must be unique" };
  }

  const sorted = [...nums].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) {
      return { valid: false, message: "steps.stepNumber must be sequential starting from 1" };
    }
  }

  return { valid: true };
}

module.exports = { validateStepsSequential };

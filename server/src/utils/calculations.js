const ACTIVITY_MULTIPLIERS = {
  sedentary:         1.2,
  lightly_active:    1.375,
  moderately_active: 1.55,
  very_active:       1.725,
  extra_active:      1.9,
};

const GOAL_KCAL_DELTA = {
  fat_loss:    -500,
  maintenance:    0,
  bulking:      400,
};

const PROTEIN_G_PER_KG = {
  fat_loss:    2.2,
  maintenance: 1.8,
  bulking:     2.0,
};

function bmr(weight, height, age, gender) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

function calculateTargets(user) {
  const { weight_kg, height_cm, age, gender, activity_level, goal } = user;

  const dailyBMR   = bmr(weight_kg, height_cm, age, gender);
  const tdee        = dailyBMR * ACTIVITY_MULTIPLIERS[activity_level];
  const targetKcal  = Math.round(tdee + GOAL_KCAL_DELTA[goal]);

  const proteinG  = Math.round(weight_kg * PROTEIN_G_PER_KG[goal]);
  const proteinKcal = proteinG * 4;

  const fatKcal = targetKcal * 0.27;
  const fatG    = Math.round(fatKcal / 9);

  const carbsKcal = targetKcal - proteinKcal - fatKcal;
  const carbsG    = Math.max(0, Math.round(carbsKcal / 4));

  // WHO guideline: <10% of total energy from free sugars
  const sugarG = Math.round((targetKcal * 0.10) / 4);

  // USDA daily fiber reference
  const fiberG = gender === 'male' ? 38 : 25;

  let waterMl = weight_kg * 35;
  if (activity_level === 'moderately_active')                    waterMl += 500;
  else if (activity_level === 'very_active' ||
           activity_level === 'extra_active')                    waterMl += 1000;

  return {
    calories:  targetKcal,
    protein_g: proteinG,
    carbs_g:   carbsG,
    fat_g:     fatG,
    fiber_g:   fiberG,
    sugar_g:   sugarG,
    water_ml:  Math.round(waterMl),
  };
}

module.exports = { calculateTargets };

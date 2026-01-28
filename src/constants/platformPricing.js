export const PLATAFORMAS_CONFIG_STORAGE_KEY = "costify-plataformas-config";

export const MERCADO_LIBRE_BASE_DEFAULT = 14;

export const MERCADO_LIBRE_PLANS = [
  {
    key: "mercadoLibreInteresBajo",
    label: "🛍️ Precio ML Interés Bajo (3-12 cuotas)",
    defaultPercent: 4,
    badgeColor: "yellow",
    helper: "Plan interés bajo (3 a 12 cuotas)",
  },
  {
    key: "mercadoLibre3Cuotas",
    label: "💳 Precio ML 3 Cuotas",
    defaultPercent: 8.2,
    badgeColor: "purple",
    helper: "Plan 3 cuotas clásicas",
  },
  {
    key: "mercadoLibre6Cuotas",
    label: "💳 Precio ML 6 Cuotas",
    defaultPercent: 12.7,
    badgeColor: "pink",
    helper: "Plan 6 cuotas clásicas",
  },
  {
    key: "mercadoLibre9Cuotas",
    label: "💳 Precio ML 9 Cuotas",
    defaultPercent: 17.4,
    badgeColor: "orange",
    helper: "Plan 9 cuotas clásicas",
  },
  {
    key: "mercadoLibre12Cuotas",
    label: "💳 Precio ML 12 Cuotas",
    defaultPercent: 21.8,
    badgeColor: "red",
    helper: "Plan 12 cuotas clásicas",
  },
];

export const buildDefaultPlataformasConfig = () => {
  const defaultConfig = {
    mercadoLibreBase: MERCADO_LIBRE_BASE_DEFAULT,
    nubeVentaBase: 10,
    nubeCuotasExtra: 17,
  };

  MERCADO_LIBRE_PLANS.forEach((plan) => {
    defaultConfig[plan.key] = plan.defaultPercent;
  });

  return defaultConfig;
};

export const computePriceWithCommission = (amount, commissionFraction) => {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(commissionFraction) || commissionFraction >= 1) return 0;
  return amount / (1 - commissionFraction);
};

const parseRawPlataformasConfig = (raw) => {
  const defaults = buildDefaultPlataformasConfig();
  if (!raw) return defaults;

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return defaults;
    }
  }

  const merged = { ...defaults, ...parsed };

  if (typeof parsed?.mercadoLibre === "number") {
    merged.mercadoLibreBase = parsed.mercadoLibre;
  }

  if (typeof parsed?.mercadoLibre3Cuotas === "number") {
    const estimateExtra = Math.max(
      parsed.mercadoLibre3Cuotas - merged.mercadoLibreBase,
      0
    );
    merged.mercadoLibre3Cuotas = estimateExtra;
  }

  if (typeof parsed?.valorNube === "number") {
    merged.nubeVentaBase = parsed.valorNube;
  }

  if (typeof parsed?.valorNubeCuotas === "number") {
    const estimateExtra = Math.max(
      parsed.valorNubeCuotas - merged.nubeVentaBase,
      0
    );
    merged.nubeCuotasExtra = estimateExtra;
  }

  return merged;
};

export const loadPlataformasConfigFromStorage = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    return buildDefaultPlataformasConfig();
  }
  const stored = window.localStorage.getItem(PLATAFORMAS_CONFIG_STORAGE_KEY);
  return parseRawPlataformasConfig(stored);
};

export const savePlataformasConfigToStorage = (config) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(
    PLATAFORMAS_CONFIG_STORAGE_KEY,
    JSON.stringify(config)
  );
};

export const parseStoredPlataformasConfig = (raw) =>
  parseRawPlataformasConfig(raw);

export const getMercadoLibrePrices = (amount, config = {}) => {
  const basePercent = Number(
    config.mercadoLibreBase ?? MERCADO_LIBRE_BASE_DEFAULT
  );
  const baseCommission = basePercent / 100;

  const basePlan = {
    key: "mercadoLibreBaseSolo",
    label: "🏷️ Precio ML Base",
    helper: "Sólo comisión base",
    badgeColor: "blue",
    basePercent,
    extraPercent: 0,
    comisionTotalPercent: Number(basePercent.toFixed(2)),
    precio: computePriceWithCommission(amount, baseCommission),
  };

  const cuotasPlans = MERCADO_LIBRE_PLANS.map((plan) => {
    const extraPercent = Number(config[plan.key] ?? plan.defaultPercent);
    const extraCommission = extraPercent / 100;
    const commission = baseCommission + extraCommission;
    const precio = computePriceWithCommission(amount, commission);

    return {
      ...plan,
      basePercent,
      extraPercent,
      comisionTotalPercent: Number((commission * 100).toFixed(2)),
      precio,
    };
  });

  return [basePlan, ...cuotasPlans];
};

export const getNubePrices = (amount, config = {}) => {
  const basePercent = Number(config.nubeVentaBase ?? 0);
  const cuotasExtraPercent = Number(config.nubeCuotasExtra ?? 0);
  const totalCuotasPercent = Number(
    (basePercent + cuotasExtraPercent).toFixed(2)
  );

  return {
    basePercent,
    cuotasExtraPercent,
    totalCuotasPercent,
    valorBase: computePriceWithCommission(amount, basePercent / 100),
    valorCuotas: computePriceWithCommission(
      amount,
      (basePercent + cuotasExtraPercent) / 100
    ),
  };
};

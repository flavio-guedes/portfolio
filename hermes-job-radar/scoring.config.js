export const scoringConfig = Object.freeze({
  weights: Object.freeze({
    senioridade: 28,
    recencia: 24,
    modalidade: 16,
    aderencia: 12,
    area: 8,
    qualidade: 6,
    empresa: 3,
    candidatura: 3
  }),
  bonus: Object.freeze({
    liveMax: 8,
    freshMax: 5,
    todayMax: 2
  }),
  thresholds: Object.freeze({
    alta: 80,
    media: 60,
    baixa: 40
  }),
  liveMaxAgeMinutes: 10,
  freshMaxAgeMinutes: 60,
  todayMaxAgeHours: 24,
  maxResults: 10,
  minResults: 5
});

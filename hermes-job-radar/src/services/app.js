import { RadarEngine } from '../services/radar.js';
import { defaultProfile } from '../profile/profile.js';

export function createApp() {
  const engine = new RadarEngine();
  engine.profile = defaultProfile;
  engine.setProfile(defaultProfile);

  return {
    engine,
    state: {
      filters: { recency: 'ALL', modalities: [], areas: [], seniorities: [] },
      selectedId: null,
      detailJobId: null,
      quickSearch: ''
    }
  };
}

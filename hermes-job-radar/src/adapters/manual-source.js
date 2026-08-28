export class ManualJobSource {
  constructor() {
    this.type = 'manual';
  }

  async collect(_context = {}) {
    return [];
  }

  supports(_mode) {
    return true;
  }
}

import { Store } from '../src/store.js';
export function fixture(t) {
  let time = 1700000000000;
  const store = new Store(':memory:', { clock: () => time });
  t.after(() => store.close());
  return {
    store,
    get time() {
      return time;
    },
    advance(ms) {
      time += ms;
    },
    setTime(ms) {
      time = ms;
    },
  };
}

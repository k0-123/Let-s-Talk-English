import * as migration_20261005_100246_initial from './20261005_100246_initial';
import * as migration_20261005_182049_v4 from './20261005_182049_v4';

export const migrations = [
  {
    up: migration_20261005_100246_initial.up,
    down: migration_20261005_100246_initial.down,
    name: '20261005_100246_initial',
  },
  {
    up: migration_20261005_182049_v4.up,
    down: migration_20261005_182049_v4.down,
    name: '20261005_182049_v4'
  },
];

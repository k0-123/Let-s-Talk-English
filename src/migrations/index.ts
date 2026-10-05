import * as migration_20261005_100246_initial from './20261005_100246_initial';

export const migrations = [
  {
    up: migration_20261005_100246_initial.up,
    down: migration_20261005_100246_initial.down,
    name: '20261005_100246_initial'
  },
];

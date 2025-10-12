import { t } from 'i18next';

export interface Migration<T = any> {
  migrate(data: MigrationData<T>): MigrationData;
  version: number;
}

export interface MigrationData<T = any> {
  state: T;
  version: number;
}
export class VersionController<T> {
  private migrations: Migration[];
  targetVersion: number;

  constructor(migrations: any[], targetVersion: number = migrations.length) {
    this.migrations = migrations
      .map((cls) => {
        return new cls() as Migration;
      })
      .sort((a, b) => a.version - b.version);

    this.targetVersion = targetVersion;
  }

  migrate(data: MigrationData<T>): MigrationData<T> {
    let nextData = data;
    const targetVersion = this.targetVersion || this.migrations.length;
    if (data.version === undefined)
      throw new Error(t('migrateError.missVersion', { ns: 'migration' }));
    const currentVersion = data.version;

    for (let i = currentVersion || 0; i < targetVersion; i++) {
      const migration = this.migrations.find((m) => m.version === i);
      if (!migration) throw new Error(t('migrateError.noMigration', { ns: 'migration' }));

      nextData = migration.migrate(nextData);

      nextData.version += 1;
      console.debug('Migration: ', migration, 'Nexr Data: ', nextData, 'Version: :', nextData.version);
    }

    return nextData;
  }
}

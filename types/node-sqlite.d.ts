// Type declarations for Node.js built-in sqlite module (Node.js v22.5+)
// See: https://nodejs.org/api/sqlite.html

declare module 'node:sqlite' {
  export interface StatementResultingChanges {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export interface StatementOptions {
    allowBareNamedParameters?: boolean;
    useBigIntToInt?: boolean;
  }

  export class StatementSync {
    all(...bindParameters: unknown[]): unknown[];
    get(...bindParameters: unknown[]): unknown | undefined;
    run(...bindParameters: unknown[]): StatementResultingChanges;
    sourceSQL(): string;
    expandedSQL(): string;
    setAllowBareNamedParameters(enabled: boolean): void;
    setReadBigInts(enabled: boolean): void;
  }

  export interface DatabaseSyncOptions {
    open?: boolean;
    readOnly?: boolean;
    enableForeignKeyConstraints?: boolean;
    enableDoubleQuotedStringLiterals?: boolean;
    allowExtension?: boolean;
  }

  export class DatabaseSync {
    constructor(location: string, options?: DatabaseSyncOptions);
    open(): void;
    close(): void;
    prepare(sql: string): StatementSync;
    exec(sql: string): void;
    function(name: string, fn: (...args: unknown[]) => unknown): void;
    aggregate(name: string, options: object): void;
    loadExtension(path: string): void;
    readonly open: boolean;
  }
}

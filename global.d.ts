// Global module declarations for packages without bundler-compatible type exports
// These supplement @types/* packages for packages that need explicit declarations

declare module 'sql.js' {
    import initSqlJs from 'sql.js';
    export = initSqlJs;
    export as namespace initSqlJs;
}

declare module "express-mysql-session" {
  import session from "express-session";
  import { Pool } from "mysql2/promise";

  interface MySQLStoreOptions {
    clearExpired?: boolean;
    checkExpirationInterval?: number;
    expiration?: number;
    createDatabaseTable?: boolean;
  }

  class MySQLStore extends session.Store {
    constructor(
      options?: MySQLStoreOptions,
      connection?: Pool
    );
  }

  function MySQLStoreFactory(
    session: typeof import("express-session")
  ): typeof MySQLStore;

  export = MySQLStoreFactory;
}

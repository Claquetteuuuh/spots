
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 *
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Follow
 *
 */
export type Follow = $Result.DefaultSelection<Prisma.$FollowPayload>
/**
 * Model PasswordResetToken
 *
 */
export type PasswordResetToken = $Result.DefaultSelection<Prisma.$PasswordResetTokenPayload>
/**
 * Model Spot
 *
 */
export type Spot = $Result.DefaultSelection<Prisma.$SpotPayload>
/**
 * Model SpotImage
 *
 */
export type SpotImage = $Result.DefaultSelection<Prisma.$SpotImagePayload>
/**
 * Model SpotPhoto
 *
 */
export type SpotPhoto = $Result.DefaultSelection<Prisma.$SpotPhotoPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const AuthProvider: {
  EMAIL: 'EMAIL',
  GOOGLE: 'GOOGLE'
};

export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider]


export const FollowStatus: {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED'
};

export type FollowStatus = (typeof FollowStatus)[keyof typeof FollowStatus]


export const CompositionType: {
  SYMMETRY: 'SYMMETRY',
  ASYMMETRY: 'ASYMMETRY',
  FRAME_IN_FRAME: 'FRAME_IN_FRAME',
  FIBONACCI: 'FIBONACCI',
  RULE_OF_THIRDS: 'RULE_OF_THIRDS',
  LEADING_LINES: 'LEADING_LINES',
  DIAGONAL: 'DIAGONAL',
  CENTERED: 'CENTERED',
  MINIMALIST: 'MINIMALIST',
  PATTERN: 'PATTERN',
  OTHER: 'OTHER'
};

export type CompositionType = (typeof CompositionType)[keyof typeof CompositionType]


export const SpotVisibility: {
  PRIVATE: 'PRIVATE',
  FOLLOWERS: 'FOLLOWERS'
};

export type SpotVisibility = (typeof SpotVisibility)[keyof typeof SpotVisibility]

}

export type AuthProvider = $Enums.AuthProvider

export const AuthProvider: typeof $Enums.AuthProvider

export type FollowStatus = $Enums.FollowStatus

export const FollowStatus: typeof $Enums.FollowStatus

export type CompositionType = $Enums.CompositionType

export const CompositionType: typeof $Enums.CompositionType

export type SpotVisibility = $Enums.SpotVisibility

export const SpotVisibility: typeof $Enums.SpotVisibility

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.follow`: Exposes CRUD operations for the **Follow** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Follows
    * const follows = await prisma.follow.findMany()
    * ```
    */
  get follow(): Prisma.FollowDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.passwordResetToken`: Exposes CRUD operations for the **PasswordResetToken** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PasswordResetTokens
    * const passwordResetTokens = await prisma.passwordResetToken.findMany()
    * ```
    */
  get passwordResetToken(): Prisma.PasswordResetTokenDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.spot`: Exposes CRUD operations for the **Spot** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Spots
    * const spots = await prisma.spot.findMany()
    * ```
    */
  get spot(): Prisma.SpotDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.spotImage`: Exposes CRUD operations for the **SpotImage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SpotImages
    * const spotImages = await prisma.spotImage.findMany()
    * ```
    */
  get spotImage(): Prisma.SpotImageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.spotPhoto`: Exposes CRUD operations for the **SpotPhoto** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SpotPhotos
    * const spotPhotos = await prisma.spotPhoto.findMany()
    * ```
    */
  get spotPhoto(): Prisma.SpotPhotoDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Follow: 'Follow',
    PasswordResetToken: 'PasswordResetToken',
    Spot: 'Spot',
    SpotImage: 'SpotImage',
    SpotPhoto: 'SpotPhoto'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "follow" | "passwordResetToken" | "spot" | "spotImage" | "spotPhoto"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Follow: {
        payload: Prisma.$FollowPayload<ExtArgs>
        fields: Prisma.FollowFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FollowFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FollowPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FollowFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FollowPayload>
          }
          findFirst: {
            args: Prisma.FollowFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FollowPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FollowFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FollowPayload>
          }
          findMany: {
            args: Prisma.FollowFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FollowPayload>[]
          }
          create: {
            args: Prisma.FollowCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FollowPayload>
          }
          createMany: {
            args: Prisma.FollowCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FollowCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FollowPayload>[]
          }
          delete: {
            args: Prisma.FollowDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FollowPayload>
          }
          update: {
            args: Prisma.FollowUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FollowPayload>
          }
          deleteMany: {
            args: Prisma.FollowDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FollowUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FollowUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FollowPayload>[]
          }
          upsert: {
            args: Prisma.FollowUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FollowPayload>
          }
          aggregate: {
            args: Prisma.FollowAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFollow>
          }
          groupBy: {
            args: Prisma.FollowGroupByArgs<ExtArgs>
            result: $Utils.Optional<FollowGroupByOutputType>[]
          }
          count: {
            args: Prisma.FollowCountArgs<ExtArgs>
            result: $Utils.Optional<FollowCountAggregateOutputType> | number
          }
        }
      }
      PasswordResetToken: {
        payload: Prisma.$PasswordResetTokenPayload<ExtArgs>
        fields: Prisma.PasswordResetTokenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PasswordResetTokenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PasswordResetTokenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>
          }
          findFirst: {
            args: Prisma.PasswordResetTokenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PasswordResetTokenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>
          }
          findMany: {
            args: Prisma.PasswordResetTokenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>[]
          }
          create: {
            args: Prisma.PasswordResetTokenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>
          }
          createMany: {
            args: Prisma.PasswordResetTokenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PasswordResetTokenCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>[]
          }
          delete: {
            args: Prisma.PasswordResetTokenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>
          }
          update: {
            args: Prisma.PasswordResetTokenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>
          }
          deleteMany: {
            args: Prisma.PasswordResetTokenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PasswordResetTokenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PasswordResetTokenUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>[]
          }
          upsert: {
            args: Prisma.PasswordResetTokenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PasswordResetTokenPayload>
          }
          aggregate: {
            args: Prisma.PasswordResetTokenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePasswordResetToken>
          }
          groupBy: {
            args: Prisma.PasswordResetTokenGroupByArgs<ExtArgs>
            result: $Utils.Optional<PasswordResetTokenGroupByOutputType>[]
          }
          count: {
            args: Prisma.PasswordResetTokenCountArgs<ExtArgs>
            result: $Utils.Optional<PasswordResetTokenCountAggregateOutputType> | number
          }
        }
      }
      Spot: {
        payload: Prisma.$SpotPayload<ExtArgs>
        fields: Prisma.SpotFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SpotFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SpotFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPayload>
          }
          findFirst: {
            args: Prisma.SpotFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SpotFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPayload>
          }
          findMany: {
            args: Prisma.SpotFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPayload>[]
          }
          create: {
            args: Prisma.SpotCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPayload>
          }
          createMany: {
            args: Prisma.SpotCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SpotCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPayload>[]
          }
          delete: {
            args: Prisma.SpotDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPayload>
          }
          update: {
            args: Prisma.SpotUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPayload>
          }
          deleteMany: {
            args: Prisma.SpotDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SpotUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SpotUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPayload>[]
          }
          upsert: {
            args: Prisma.SpotUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPayload>
          }
          aggregate: {
            args: Prisma.SpotAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSpot>
          }
          groupBy: {
            args: Prisma.SpotGroupByArgs<ExtArgs>
            result: $Utils.Optional<SpotGroupByOutputType>[]
          }
          count: {
            args: Prisma.SpotCountArgs<ExtArgs>
            result: $Utils.Optional<SpotCountAggregateOutputType> | number
          }
        }
      }
      SpotImage: {
        payload: Prisma.$SpotImagePayload<ExtArgs>
        fields: Prisma.SpotImageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SpotImageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotImagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SpotImageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotImagePayload>
          }
          findFirst: {
            args: Prisma.SpotImageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotImagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SpotImageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotImagePayload>
          }
          findMany: {
            args: Prisma.SpotImageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotImagePayload>[]
          }
          create: {
            args: Prisma.SpotImageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotImagePayload>
          }
          createMany: {
            args: Prisma.SpotImageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SpotImageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotImagePayload>[]
          }
          delete: {
            args: Prisma.SpotImageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotImagePayload>
          }
          update: {
            args: Prisma.SpotImageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotImagePayload>
          }
          deleteMany: {
            args: Prisma.SpotImageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SpotImageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SpotImageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotImagePayload>[]
          }
          upsert: {
            args: Prisma.SpotImageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotImagePayload>
          }
          aggregate: {
            args: Prisma.SpotImageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSpotImage>
          }
          groupBy: {
            args: Prisma.SpotImageGroupByArgs<ExtArgs>
            result: $Utils.Optional<SpotImageGroupByOutputType>[]
          }
          count: {
            args: Prisma.SpotImageCountArgs<ExtArgs>
            result: $Utils.Optional<SpotImageCountAggregateOutputType> | number
          }
        }
      }
      SpotPhoto: {
        payload: Prisma.$SpotPhotoPayload<ExtArgs>
        fields: Prisma.SpotPhotoFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SpotPhotoFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPhotoPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SpotPhotoFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPhotoPayload>
          }
          findFirst: {
            args: Prisma.SpotPhotoFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPhotoPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SpotPhotoFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPhotoPayload>
          }
          findMany: {
            args: Prisma.SpotPhotoFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPhotoPayload>[]
          }
          create: {
            args: Prisma.SpotPhotoCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPhotoPayload>
          }
          createMany: {
            args: Prisma.SpotPhotoCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SpotPhotoCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPhotoPayload>[]
          }
          delete: {
            args: Prisma.SpotPhotoDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPhotoPayload>
          }
          update: {
            args: Prisma.SpotPhotoUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPhotoPayload>
          }
          deleteMany: {
            args: Prisma.SpotPhotoDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SpotPhotoUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SpotPhotoUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPhotoPayload>[]
          }
          upsert: {
            args: Prisma.SpotPhotoUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpotPhotoPayload>
          }
          aggregate: {
            args: Prisma.SpotPhotoAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSpotPhoto>
          }
          groupBy: {
            args: Prisma.SpotPhotoGroupByArgs<ExtArgs>
            result: $Utils.Optional<SpotPhotoGroupByOutputType>[]
          }
          count: {
            args: Prisma.SpotPhotoCountArgs<ExtArgs>
            result: $Utils.Optional<SpotPhotoCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     *
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     *
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    follow?: FollowOmit
    passwordResetToken?: PasswordResetTokenOmit
    spot?: SpotOmit
    spotImage?: SpotImageOmit
    spotPhoto?: SpotPhotoOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    spots: number
    spotPhotos: number
    followers: number
    following: number
    passwordResetTokens: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spots?: boolean | UserCountOutputTypeCountSpotsArgs
    spotPhotos?: boolean | UserCountOutputTypeCountSpotPhotosArgs
    followers?: boolean | UserCountOutputTypeCountFollowersArgs
    following?: boolean | UserCountOutputTypeCountFollowingArgs
    passwordResetTokens?: boolean | UserCountOutputTypeCountPasswordResetTokensArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSpotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpotWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSpotPhotosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpotPhotoWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountFollowersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FollowWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountFollowingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FollowWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPasswordResetTokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PasswordResetTokenWhereInput
  }


  /**
   * Count Type SpotCountOutputType
   */

  export type SpotCountOutputType = {
    spotPhotos: number
    images: number
  }

  export type SpotCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spotPhotos?: boolean | SpotCountOutputTypeCountSpotPhotosArgs
    images?: boolean | SpotCountOutputTypeCountImagesArgs
  }

  // Custom InputTypes
  /**
   * SpotCountOutputType without action
   */
  export type SpotCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotCountOutputType
     */
    select?: SpotCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SpotCountOutputType without action
   */
  export type SpotCountOutputTypeCountSpotPhotosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpotPhotoWhereInput
  }

  /**
   * SpotCountOutputType without action
   */
  export type SpotCountOutputTypeCountImagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpotImageWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    passwordHash: string | null
    provider: $Enums.AuthProvider | null
    providerId: string | null
    username: string | null
    name: string | null
    avatarUrl: string | null
    bio: string | null
    locale: string | null
    isPrivate: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    passwordHash: string | null
    provider: $Enums.AuthProvider | null
    providerId: string | null
    username: string | null
    name: string | null
    avatarUrl: string | null
    bio: string | null
    locale: string | null
    isPrivate: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    passwordHash: number
    provider: number
    providerId: number
    username: number
    name: number
    avatarUrl: number
    bio: number
    locale: number
    isPrivate: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    provider?: true
    providerId?: true
    username?: true
    name?: true
    avatarUrl?: true
    bio?: true
    locale?: true
    isPrivate?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    provider?: true
    providerId?: true
    username?: true
    name?: true
    avatarUrl?: true
    bio?: true
    locale?: true
    isPrivate?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    provider?: true
    providerId?: true
    username?: true
    name?: true
    avatarUrl?: true
    bio?: true
    locale?: true
    isPrivate?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    passwordHash: string | null
    provider: $Enums.AuthProvider
    providerId: string | null
    username: string
    name: string
    avatarUrl: string | null
    bio: string | null
    locale: string
    isPrivate: boolean
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    provider?: boolean
    providerId?: boolean
    username?: boolean
    name?: boolean
    avatarUrl?: boolean
    bio?: boolean
    locale?: boolean
    isPrivate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    spots?: boolean | User$spotsArgs<ExtArgs>
    spotPhotos?: boolean | User$spotPhotosArgs<ExtArgs>
    followers?: boolean | User$followersArgs<ExtArgs>
    following?: boolean | User$followingArgs<ExtArgs>
    passwordResetTokens?: boolean | User$passwordResetTokensArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    provider?: boolean
    providerId?: boolean
    username?: boolean
    name?: boolean
    avatarUrl?: boolean
    bio?: boolean
    locale?: boolean
    isPrivate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    provider?: boolean
    providerId?: boolean
    username?: boolean
    name?: boolean
    avatarUrl?: boolean
    bio?: boolean
    locale?: boolean
    isPrivate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    provider?: boolean
    providerId?: boolean
    username?: boolean
    name?: boolean
    avatarUrl?: boolean
    bio?: boolean
    locale?: boolean
    isPrivate?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "passwordHash" | "provider" | "providerId" | "username" | "name" | "avatarUrl" | "bio" | "locale" | "isPrivate" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spots?: boolean | User$spotsArgs<ExtArgs>
    spotPhotos?: boolean | User$spotPhotosArgs<ExtArgs>
    followers?: boolean | User$followersArgs<ExtArgs>
    following?: boolean | User$followingArgs<ExtArgs>
    passwordResetTokens?: boolean | User$passwordResetTokensArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      spots: Prisma.$SpotPayload<ExtArgs>[]
      spotPhotos: Prisma.$SpotPhotoPayload<ExtArgs>[]
      followers: Prisma.$FollowPayload<ExtArgs>[]
      following: Prisma.$FollowPayload<ExtArgs>[]
      passwordResetTokens: Prisma.$PasswordResetTokenPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      passwordHash: string | null
      provider: $Enums.AuthProvider
      providerId: string | null
      username: string
      name: string
      avatarUrl: string | null
      bio: string | null
      locale: string
      isPrivate: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     *
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     *
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     *
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     *
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    spots<T extends User$spotsArgs<ExtArgs> = {}>(args?: Subset<T, User$spotsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    spotPhotos<T extends User$spotPhotosArgs<ExtArgs> = {}>(args?: Subset<T, User$spotPhotosArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    followers<T extends User$followersArgs<ExtArgs> = {}>(args?: Subset<T, User$followersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    following<T extends User$followingArgs<ExtArgs> = {}>(args?: Subset<T, User$followingArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    passwordResetTokens<T extends User$passwordResetTokensArgs<ExtArgs> = {}>(args?: Subset<T, User$passwordResetTokensArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly passwordHash: FieldRef<"User", 'String'>
    readonly provider: FieldRef<"User", 'AuthProvider'>
    readonly providerId: FieldRef<"User", 'String'>
    readonly username: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly avatarUrl: FieldRef<"User", 'String'>
    readonly bio: FieldRef<"User", 'String'>
    readonly locale: FieldRef<"User", 'String'>
    readonly isPrivate: FieldRef<"User", 'Boolean'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.spots
   */
  export type User$spotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotInclude<ExtArgs> | null
    where?: SpotWhereInput
    orderBy?: SpotOrderByWithRelationInput | SpotOrderByWithRelationInput[]
    cursor?: SpotWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SpotScalarFieldEnum | SpotScalarFieldEnum[]
  }

  /**
   * User.spotPhotos
   */
  export type User$spotPhotosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoInclude<ExtArgs> | null
    where?: SpotPhotoWhereInput
    orderBy?: SpotPhotoOrderByWithRelationInput | SpotPhotoOrderByWithRelationInput[]
    cursor?: SpotPhotoWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SpotPhotoScalarFieldEnum | SpotPhotoScalarFieldEnum[]
  }

  /**
   * User.followers
   */
  export type User$followersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowInclude<ExtArgs> | null
    where?: FollowWhereInput
    orderBy?: FollowOrderByWithRelationInput | FollowOrderByWithRelationInput[]
    cursor?: FollowWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FollowScalarFieldEnum | FollowScalarFieldEnum[]
  }

  /**
   * User.following
   */
  export type User$followingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowInclude<ExtArgs> | null
    where?: FollowWhereInput
    orderBy?: FollowOrderByWithRelationInput | FollowOrderByWithRelationInput[]
    cursor?: FollowWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FollowScalarFieldEnum | FollowScalarFieldEnum[]
  }

  /**
   * User.passwordResetTokens
   */
  export type User$passwordResetTokensArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    where?: PasswordResetTokenWhereInput
    orderBy?: PasswordResetTokenOrderByWithRelationInput | PasswordResetTokenOrderByWithRelationInput[]
    cursor?: PasswordResetTokenWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PasswordResetTokenScalarFieldEnum | PasswordResetTokenScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Follow
   */

  export type AggregateFollow = {
    _count: FollowCountAggregateOutputType | null
    _min: FollowMinAggregateOutputType | null
    _max: FollowMaxAggregateOutputType | null
  }

  export type FollowMinAggregateOutputType = {
    id: string | null
    followerId: string | null
    followingId: string | null
    status: $Enums.FollowStatus | null
    createdAt: Date | null
  }

  export type FollowMaxAggregateOutputType = {
    id: string | null
    followerId: string | null
    followingId: string | null
    status: $Enums.FollowStatus | null
    createdAt: Date | null
  }

  export type FollowCountAggregateOutputType = {
    id: number
    followerId: number
    followingId: number
    status: number
    createdAt: number
    _all: number
  }


  export type FollowMinAggregateInputType = {
    id?: true
    followerId?: true
    followingId?: true
    status?: true
    createdAt?: true
  }

  export type FollowMaxAggregateInputType = {
    id?: true
    followerId?: true
    followingId?: true
    status?: true
    createdAt?: true
  }

  export type FollowCountAggregateInputType = {
    id?: true
    followerId?: true
    followingId?: true
    status?: true
    createdAt?: true
    _all?: true
  }

  export type FollowAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Follow to aggregate.
     */
    where?: FollowWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Follows to fetch.
     */
    orderBy?: FollowOrderByWithRelationInput | FollowOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: FollowWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Follows from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Follows.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Follows
    **/
    _count?: true | FollowCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: FollowMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: FollowMaxAggregateInputType
  }

  export type GetFollowAggregateType<T extends FollowAggregateArgs> = {
        [P in keyof T & keyof AggregateFollow]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFollow[P]>
      : GetScalarType<T[P], AggregateFollow[P]>
  }




  export type FollowGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FollowWhereInput
    orderBy?: FollowOrderByWithAggregationInput | FollowOrderByWithAggregationInput[]
    by: FollowScalarFieldEnum[] | FollowScalarFieldEnum
    having?: FollowScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FollowCountAggregateInputType | true
    _min?: FollowMinAggregateInputType
    _max?: FollowMaxAggregateInputType
  }

  export type FollowGroupByOutputType = {
    id: string
    followerId: string
    followingId: string
    status: $Enums.FollowStatus
    createdAt: Date
    _count: FollowCountAggregateOutputType | null
    _min: FollowMinAggregateOutputType | null
    _max: FollowMaxAggregateOutputType | null
  }

  type GetFollowGroupByPayload<T extends FollowGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FollowGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FollowGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FollowGroupByOutputType[P]>
            : GetScalarType<T[P], FollowGroupByOutputType[P]>
        }
      >
    >


  export type FollowSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    followerId?: boolean
    followingId?: boolean
    status?: boolean
    createdAt?: boolean
    follower?: boolean | UserDefaultArgs<ExtArgs>
    following?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["follow"]>

  export type FollowSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    followerId?: boolean
    followingId?: boolean
    status?: boolean
    createdAt?: boolean
    follower?: boolean | UserDefaultArgs<ExtArgs>
    following?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["follow"]>

  export type FollowSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    followerId?: boolean
    followingId?: boolean
    status?: boolean
    createdAt?: boolean
    follower?: boolean | UserDefaultArgs<ExtArgs>
    following?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["follow"]>

  export type FollowSelectScalar = {
    id?: boolean
    followerId?: boolean
    followingId?: boolean
    status?: boolean
    createdAt?: boolean
  }

  export type FollowOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "followerId" | "followingId" | "status" | "createdAt", ExtArgs["result"]["follow"]>
  export type FollowInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    follower?: boolean | UserDefaultArgs<ExtArgs>
    following?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type FollowIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    follower?: boolean | UserDefaultArgs<ExtArgs>
    following?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type FollowIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    follower?: boolean | UserDefaultArgs<ExtArgs>
    following?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $FollowPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Follow"
    objects: {
      follower: Prisma.$UserPayload<ExtArgs>
      following: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      followerId: string
      followingId: string
      status: $Enums.FollowStatus
      createdAt: Date
    }, ExtArgs["result"]["follow"]>
    composites: {}
  }

  type FollowGetPayload<S extends boolean | null | undefined | FollowDefaultArgs> = $Result.GetResult<Prisma.$FollowPayload, S>

  type FollowCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FollowFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FollowCountAggregateInputType | true
    }

  export interface FollowDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Follow'], meta: { name: 'Follow' } }
    /**
     * Find zero or one Follow that matches the filter.
     * @param {FollowFindUniqueArgs} args - Arguments to find a Follow
     * @example
     * // Get one Follow
     * const follow = await prisma.follow.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FollowFindUniqueArgs>(args: SelectSubset<T, FollowFindUniqueArgs<ExtArgs>>): Prisma__FollowClient<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Follow that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FollowFindUniqueOrThrowArgs} args - Arguments to find a Follow
     * @example
     * // Get one Follow
     * const follow = await prisma.follow.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FollowFindUniqueOrThrowArgs>(args: SelectSubset<T, FollowFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FollowClient<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Follow that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FollowFindFirstArgs} args - Arguments to find a Follow
     * @example
     * // Get one Follow
     * const follow = await prisma.follow.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FollowFindFirstArgs>(args?: SelectSubset<T, FollowFindFirstArgs<ExtArgs>>): Prisma__FollowClient<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Follow that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FollowFindFirstOrThrowArgs} args - Arguments to find a Follow
     * @example
     * // Get one Follow
     * const follow = await prisma.follow.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FollowFindFirstOrThrowArgs>(args?: SelectSubset<T, FollowFindFirstOrThrowArgs<ExtArgs>>): Prisma__FollowClient<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Follows that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FollowFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Follows
     * const follows = await prisma.follow.findMany()
     *
     * // Get first 10 Follows
     * const follows = await prisma.follow.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const followWithIdOnly = await prisma.follow.findMany({ select: { id: true } })
     *
     */
    findMany<T extends FollowFindManyArgs>(args?: SelectSubset<T, FollowFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Follow.
     * @param {FollowCreateArgs} args - Arguments to create a Follow.
     * @example
     * // Create one Follow
     * const Follow = await prisma.follow.create({
     *   data: {
     *     // ... data to create a Follow
     *   }
     * })
     *
     */
    create<T extends FollowCreateArgs>(args: SelectSubset<T, FollowCreateArgs<ExtArgs>>): Prisma__FollowClient<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Follows.
     * @param {FollowCreateManyArgs} args - Arguments to create many Follows.
     * @example
     * // Create many Follows
     * const follow = await prisma.follow.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends FollowCreateManyArgs>(args?: SelectSubset<T, FollowCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Follows and returns the data saved in the database.
     * @param {FollowCreateManyAndReturnArgs} args - Arguments to create many Follows.
     * @example
     * // Create many Follows
     * const follow = await prisma.follow.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Follows and only return the `id`
     * const followWithIdOnly = await prisma.follow.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends FollowCreateManyAndReturnArgs>(args?: SelectSubset<T, FollowCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Follow.
     * @param {FollowDeleteArgs} args - Arguments to delete one Follow.
     * @example
     * // Delete one Follow
     * const Follow = await prisma.follow.delete({
     *   where: {
     *     // ... filter to delete one Follow
     *   }
     * })
     *
     */
    delete<T extends FollowDeleteArgs>(args: SelectSubset<T, FollowDeleteArgs<ExtArgs>>): Prisma__FollowClient<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Follow.
     * @param {FollowUpdateArgs} args - Arguments to update one Follow.
     * @example
     * // Update one Follow
     * const follow = await prisma.follow.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends FollowUpdateArgs>(args: SelectSubset<T, FollowUpdateArgs<ExtArgs>>): Prisma__FollowClient<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Follows.
     * @param {FollowDeleteManyArgs} args - Arguments to filter Follows to delete.
     * @example
     * // Delete a few Follows
     * const { count } = await prisma.follow.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends FollowDeleteManyArgs>(args?: SelectSubset<T, FollowDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Follows.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FollowUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Follows
     * const follow = await prisma.follow.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends FollowUpdateManyArgs>(args: SelectSubset<T, FollowUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Follows and returns the data updated in the database.
     * @param {FollowUpdateManyAndReturnArgs} args - Arguments to update many Follows.
     * @example
     * // Update many Follows
     * const follow = await prisma.follow.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Follows and only return the `id`
     * const followWithIdOnly = await prisma.follow.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends FollowUpdateManyAndReturnArgs>(args: SelectSubset<T, FollowUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Follow.
     * @param {FollowUpsertArgs} args - Arguments to update or create a Follow.
     * @example
     * // Update or create a Follow
     * const follow = await prisma.follow.upsert({
     *   create: {
     *     // ... data to create a Follow
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Follow we want to update
     *   }
     * })
     */
    upsert<T extends FollowUpsertArgs>(args: SelectSubset<T, FollowUpsertArgs<ExtArgs>>): Prisma__FollowClient<$Result.GetResult<Prisma.$FollowPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Follows.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FollowCountArgs} args - Arguments to filter Follows to count.
     * @example
     * // Count the number of Follows
     * const count = await prisma.follow.count({
     *   where: {
     *     // ... the filter for the Follows we want to count
     *   }
     * })
    **/
    count<T extends FollowCountArgs>(
      args?: Subset<T, FollowCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FollowCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Follow.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FollowAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FollowAggregateArgs>(args: Subset<T, FollowAggregateArgs>): Prisma.PrismaPromise<GetFollowAggregateType<T>>

    /**
     * Group by Follow.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FollowGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends FollowGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FollowGroupByArgs['orderBy'] }
        : { orderBy?: FollowGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FollowGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFollowGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Follow model
   */
  readonly fields: FollowFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Follow.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FollowClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    follower<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    following<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Follow model
   */
  interface FollowFieldRefs {
    readonly id: FieldRef<"Follow", 'String'>
    readonly followerId: FieldRef<"Follow", 'String'>
    readonly followingId: FieldRef<"Follow", 'String'>
    readonly status: FieldRef<"Follow", 'FollowStatus'>
    readonly createdAt: FieldRef<"Follow", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * Follow findUnique
   */
  export type FollowFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowInclude<ExtArgs> | null
    /**
     * Filter, which Follow to fetch.
     */
    where: FollowWhereUniqueInput
  }

  /**
   * Follow findUniqueOrThrow
   */
  export type FollowFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowInclude<ExtArgs> | null
    /**
     * Filter, which Follow to fetch.
     */
    where: FollowWhereUniqueInput
  }

  /**
   * Follow findFirst
   */
  export type FollowFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowInclude<ExtArgs> | null
    /**
     * Filter, which Follow to fetch.
     */
    where?: FollowWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Follows to fetch.
     */
    orderBy?: FollowOrderByWithRelationInput | FollowOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Follows.
     */
    cursor?: FollowWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Follows from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Follows.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Follows.
     */
    distinct?: FollowScalarFieldEnum | FollowScalarFieldEnum[]
  }

  /**
   * Follow findFirstOrThrow
   */
  export type FollowFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowInclude<ExtArgs> | null
    /**
     * Filter, which Follow to fetch.
     */
    where?: FollowWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Follows to fetch.
     */
    orderBy?: FollowOrderByWithRelationInput | FollowOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Follows.
     */
    cursor?: FollowWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Follows from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Follows.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Follows.
     */
    distinct?: FollowScalarFieldEnum | FollowScalarFieldEnum[]
  }

  /**
   * Follow findMany
   */
  export type FollowFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowInclude<ExtArgs> | null
    /**
     * Filter, which Follows to fetch.
     */
    where?: FollowWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Follows to fetch.
     */
    orderBy?: FollowOrderByWithRelationInput | FollowOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Follows.
     */
    cursor?: FollowWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Follows from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Follows.
     */
    skip?: number
    distinct?: FollowScalarFieldEnum | FollowScalarFieldEnum[]
  }

  /**
   * Follow create
   */
  export type FollowCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowInclude<ExtArgs> | null
    /**
     * The data needed to create a Follow.
     */
    data: XOR<FollowCreateInput, FollowUncheckedCreateInput>
  }

  /**
   * Follow createMany
   */
  export type FollowCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Follows.
     */
    data: FollowCreateManyInput | FollowCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Follow createManyAndReturn
   */
  export type FollowCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * The data used to create many Follows.
     */
    data: FollowCreateManyInput | FollowCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Follow update
   */
  export type FollowUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowInclude<ExtArgs> | null
    /**
     * The data needed to update a Follow.
     */
    data: XOR<FollowUpdateInput, FollowUncheckedUpdateInput>
    /**
     * Choose, which Follow to update.
     */
    where: FollowWhereUniqueInput
  }

  /**
   * Follow updateMany
   */
  export type FollowUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Follows.
     */
    data: XOR<FollowUpdateManyMutationInput, FollowUncheckedUpdateManyInput>
    /**
     * Filter which Follows to update
     */
    where?: FollowWhereInput
    /**
     * Limit how many Follows to update.
     */
    limit?: number
  }

  /**
   * Follow updateManyAndReturn
   */
  export type FollowUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * The data used to update Follows.
     */
    data: XOR<FollowUpdateManyMutationInput, FollowUncheckedUpdateManyInput>
    /**
     * Filter which Follows to update
     */
    where?: FollowWhereInput
    /**
     * Limit how many Follows to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Follow upsert
   */
  export type FollowUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowInclude<ExtArgs> | null
    /**
     * The filter to search for the Follow to update in case it exists.
     */
    where: FollowWhereUniqueInput
    /**
     * In case the Follow found by the `where` argument doesn't exist, create a new Follow with this data.
     */
    create: XOR<FollowCreateInput, FollowUncheckedCreateInput>
    /**
     * In case the Follow was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FollowUpdateInput, FollowUncheckedUpdateInput>
  }

  /**
   * Follow delete
   */
  export type FollowDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowInclude<ExtArgs> | null
    /**
     * Filter which Follow to delete.
     */
    where: FollowWhereUniqueInput
  }

  /**
   * Follow deleteMany
   */
  export type FollowDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Follows to delete
     */
    where?: FollowWhereInput
    /**
     * Limit how many Follows to delete.
     */
    limit?: number
  }

  /**
   * Follow without action
   */
  export type FollowDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Follow
     */
    select?: FollowSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Follow
     */
    omit?: FollowOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FollowInclude<ExtArgs> | null
  }


  /**
   * Model PasswordResetToken
   */

  export type AggregatePasswordResetToken = {
    _count: PasswordResetTokenCountAggregateOutputType | null
    _min: PasswordResetTokenMinAggregateOutputType | null
    _max: PasswordResetTokenMaxAggregateOutputType | null
  }

  export type PasswordResetTokenMinAggregateOutputType = {
    id: string | null
    token: string | null
    userId: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type PasswordResetTokenMaxAggregateOutputType = {
    id: string | null
    token: string | null
    userId: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type PasswordResetTokenCountAggregateOutputType = {
    id: number
    token: number
    userId: number
    expiresAt: number
    createdAt: number
    _all: number
  }


  export type PasswordResetTokenMinAggregateInputType = {
    id?: true
    token?: true
    userId?: true
    expiresAt?: true
    createdAt?: true
  }

  export type PasswordResetTokenMaxAggregateInputType = {
    id?: true
    token?: true
    userId?: true
    expiresAt?: true
    createdAt?: true
  }

  export type PasswordResetTokenCountAggregateInputType = {
    id?: true
    token?: true
    userId?: true
    expiresAt?: true
    createdAt?: true
    _all?: true
  }

  export type PasswordResetTokenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PasswordResetToken to aggregate.
     */
    where?: PasswordResetTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PasswordResetTokens to fetch.
     */
    orderBy?: PasswordResetTokenOrderByWithRelationInput | PasswordResetTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: PasswordResetTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PasswordResetTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PasswordResetTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned PasswordResetTokens
    **/
    _count?: true | PasswordResetTokenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: PasswordResetTokenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: PasswordResetTokenMaxAggregateInputType
  }

  export type GetPasswordResetTokenAggregateType<T extends PasswordResetTokenAggregateArgs> = {
        [P in keyof T & keyof AggregatePasswordResetToken]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePasswordResetToken[P]>
      : GetScalarType<T[P], AggregatePasswordResetToken[P]>
  }




  export type PasswordResetTokenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PasswordResetTokenWhereInput
    orderBy?: PasswordResetTokenOrderByWithAggregationInput | PasswordResetTokenOrderByWithAggregationInput[]
    by: PasswordResetTokenScalarFieldEnum[] | PasswordResetTokenScalarFieldEnum
    having?: PasswordResetTokenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PasswordResetTokenCountAggregateInputType | true
    _min?: PasswordResetTokenMinAggregateInputType
    _max?: PasswordResetTokenMaxAggregateInputType
  }

  export type PasswordResetTokenGroupByOutputType = {
    id: string
    token: string
    userId: string
    expiresAt: Date
    createdAt: Date
    _count: PasswordResetTokenCountAggregateOutputType | null
    _min: PasswordResetTokenMinAggregateOutputType | null
    _max: PasswordResetTokenMaxAggregateOutputType | null
  }

  type GetPasswordResetTokenGroupByPayload<T extends PasswordResetTokenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PasswordResetTokenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PasswordResetTokenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PasswordResetTokenGroupByOutputType[P]>
            : GetScalarType<T[P], PasswordResetTokenGroupByOutputType[P]>
        }
      >
    >


  export type PasswordResetTokenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token?: boolean
    userId?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["passwordResetToken"]>

  export type PasswordResetTokenSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token?: boolean
    userId?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["passwordResetToken"]>

  export type PasswordResetTokenSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token?: boolean
    userId?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["passwordResetToken"]>

  export type PasswordResetTokenSelectScalar = {
    id?: boolean
    token?: boolean
    userId?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }

  export type PasswordResetTokenOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "token" | "userId" | "expiresAt" | "createdAt", ExtArgs["result"]["passwordResetToken"]>
  export type PasswordResetTokenInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PasswordResetTokenIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PasswordResetTokenIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $PasswordResetTokenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PasswordResetToken"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      token: string
      userId: string
      expiresAt: Date
      createdAt: Date
    }, ExtArgs["result"]["passwordResetToken"]>
    composites: {}
  }

  type PasswordResetTokenGetPayload<S extends boolean | null | undefined | PasswordResetTokenDefaultArgs> = $Result.GetResult<Prisma.$PasswordResetTokenPayload, S>

  type PasswordResetTokenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PasswordResetTokenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PasswordResetTokenCountAggregateInputType | true
    }

  export interface PasswordResetTokenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PasswordResetToken'], meta: { name: 'PasswordResetToken' } }
    /**
     * Find zero or one PasswordResetToken that matches the filter.
     * @param {PasswordResetTokenFindUniqueArgs} args - Arguments to find a PasswordResetToken
     * @example
     * // Get one PasswordResetToken
     * const passwordResetToken = await prisma.passwordResetToken.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PasswordResetTokenFindUniqueArgs>(args: SelectSubset<T, PasswordResetTokenFindUniqueArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PasswordResetToken that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PasswordResetTokenFindUniqueOrThrowArgs} args - Arguments to find a PasswordResetToken
     * @example
     * // Get one PasswordResetToken
     * const passwordResetToken = await prisma.passwordResetToken.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PasswordResetTokenFindUniqueOrThrowArgs>(args: SelectSubset<T, PasswordResetTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PasswordResetToken that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenFindFirstArgs} args - Arguments to find a PasswordResetToken
     * @example
     * // Get one PasswordResetToken
     * const passwordResetToken = await prisma.passwordResetToken.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PasswordResetTokenFindFirstArgs>(args?: SelectSubset<T, PasswordResetTokenFindFirstArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PasswordResetToken that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenFindFirstOrThrowArgs} args - Arguments to find a PasswordResetToken
     * @example
     * // Get one PasswordResetToken
     * const passwordResetToken = await prisma.passwordResetToken.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PasswordResetTokenFindFirstOrThrowArgs>(args?: SelectSubset<T, PasswordResetTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PasswordResetTokens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PasswordResetTokens
     * const passwordResetTokens = await prisma.passwordResetToken.findMany()
     *
     * // Get first 10 PasswordResetTokens
     * const passwordResetTokens = await prisma.passwordResetToken.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const passwordResetTokenWithIdOnly = await prisma.passwordResetToken.findMany({ select: { id: true } })
     *
     */
    findMany<T extends PasswordResetTokenFindManyArgs>(args?: SelectSubset<T, PasswordResetTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PasswordResetToken.
     * @param {PasswordResetTokenCreateArgs} args - Arguments to create a PasswordResetToken.
     * @example
     * // Create one PasswordResetToken
     * const PasswordResetToken = await prisma.passwordResetToken.create({
     *   data: {
     *     // ... data to create a PasswordResetToken
     *   }
     * })
     *
     */
    create<T extends PasswordResetTokenCreateArgs>(args: SelectSubset<T, PasswordResetTokenCreateArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PasswordResetTokens.
     * @param {PasswordResetTokenCreateManyArgs} args - Arguments to create many PasswordResetTokens.
     * @example
     * // Create many PasswordResetTokens
     * const passwordResetToken = await prisma.passwordResetToken.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends PasswordResetTokenCreateManyArgs>(args?: SelectSubset<T, PasswordResetTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PasswordResetTokens and returns the data saved in the database.
     * @param {PasswordResetTokenCreateManyAndReturnArgs} args - Arguments to create many PasswordResetTokens.
     * @example
     * // Create many PasswordResetTokens
     * const passwordResetToken = await prisma.passwordResetToken.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many PasswordResetTokens and only return the `id`
     * const passwordResetTokenWithIdOnly = await prisma.passwordResetToken.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends PasswordResetTokenCreateManyAndReturnArgs>(args?: SelectSubset<T, PasswordResetTokenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PasswordResetToken.
     * @param {PasswordResetTokenDeleteArgs} args - Arguments to delete one PasswordResetToken.
     * @example
     * // Delete one PasswordResetToken
     * const PasswordResetToken = await prisma.passwordResetToken.delete({
     *   where: {
     *     // ... filter to delete one PasswordResetToken
     *   }
     * })
     *
     */
    delete<T extends PasswordResetTokenDeleteArgs>(args: SelectSubset<T, PasswordResetTokenDeleteArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PasswordResetToken.
     * @param {PasswordResetTokenUpdateArgs} args - Arguments to update one PasswordResetToken.
     * @example
     * // Update one PasswordResetToken
     * const passwordResetToken = await prisma.passwordResetToken.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends PasswordResetTokenUpdateArgs>(args: SelectSubset<T, PasswordResetTokenUpdateArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PasswordResetTokens.
     * @param {PasswordResetTokenDeleteManyArgs} args - Arguments to filter PasswordResetTokens to delete.
     * @example
     * // Delete a few PasswordResetTokens
     * const { count } = await prisma.passwordResetToken.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends PasswordResetTokenDeleteManyArgs>(args?: SelectSubset<T, PasswordResetTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PasswordResetTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PasswordResetTokens
     * const passwordResetToken = await prisma.passwordResetToken.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends PasswordResetTokenUpdateManyArgs>(args: SelectSubset<T, PasswordResetTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PasswordResetTokens and returns the data updated in the database.
     * @param {PasswordResetTokenUpdateManyAndReturnArgs} args - Arguments to update many PasswordResetTokens.
     * @example
     * // Update many PasswordResetTokens
     * const passwordResetToken = await prisma.passwordResetToken.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more PasswordResetTokens and only return the `id`
     * const passwordResetTokenWithIdOnly = await prisma.passwordResetToken.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends PasswordResetTokenUpdateManyAndReturnArgs>(args: SelectSubset<T, PasswordResetTokenUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PasswordResetToken.
     * @param {PasswordResetTokenUpsertArgs} args - Arguments to update or create a PasswordResetToken.
     * @example
     * // Update or create a PasswordResetToken
     * const passwordResetToken = await prisma.passwordResetToken.upsert({
     *   create: {
     *     // ... data to create a PasswordResetToken
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PasswordResetToken we want to update
     *   }
     * })
     */
    upsert<T extends PasswordResetTokenUpsertArgs>(args: SelectSubset<T, PasswordResetTokenUpsertArgs<ExtArgs>>): Prisma__PasswordResetTokenClient<$Result.GetResult<Prisma.$PasswordResetTokenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PasswordResetTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenCountArgs} args - Arguments to filter PasswordResetTokens to count.
     * @example
     * // Count the number of PasswordResetTokens
     * const count = await prisma.passwordResetToken.count({
     *   where: {
     *     // ... the filter for the PasswordResetTokens we want to count
     *   }
     * })
    **/
    count<T extends PasswordResetTokenCountArgs>(
      args?: Subset<T, PasswordResetTokenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PasswordResetTokenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PasswordResetToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PasswordResetTokenAggregateArgs>(args: Subset<T, PasswordResetTokenAggregateArgs>): Prisma.PrismaPromise<GetPasswordResetTokenAggregateType<T>>

    /**
     * Group by PasswordResetToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PasswordResetTokenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends PasswordResetTokenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PasswordResetTokenGroupByArgs['orderBy'] }
        : { orderBy?: PasswordResetTokenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PasswordResetTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPasswordResetTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PasswordResetToken model
   */
  readonly fields: PasswordResetTokenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PasswordResetToken.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PasswordResetTokenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PasswordResetToken model
   */
  interface PasswordResetTokenFieldRefs {
    readonly id: FieldRef<"PasswordResetToken", 'String'>
    readonly token: FieldRef<"PasswordResetToken", 'String'>
    readonly userId: FieldRef<"PasswordResetToken", 'String'>
    readonly expiresAt: FieldRef<"PasswordResetToken", 'DateTime'>
    readonly createdAt: FieldRef<"PasswordResetToken", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * PasswordResetToken findUnique
   */
  export type PasswordResetTokenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * Filter, which PasswordResetToken to fetch.
     */
    where: PasswordResetTokenWhereUniqueInput
  }

  /**
   * PasswordResetToken findUniqueOrThrow
   */
  export type PasswordResetTokenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * Filter, which PasswordResetToken to fetch.
     */
    where: PasswordResetTokenWhereUniqueInput
  }

  /**
   * PasswordResetToken findFirst
   */
  export type PasswordResetTokenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * Filter, which PasswordResetToken to fetch.
     */
    where?: PasswordResetTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PasswordResetTokens to fetch.
     */
    orderBy?: PasswordResetTokenOrderByWithRelationInput | PasswordResetTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for PasswordResetTokens.
     */
    cursor?: PasswordResetTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PasswordResetTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PasswordResetTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PasswordResetTokens.
     */
    distinct?: PasswordResetTokenScalarFieldEnum | PasswordResetTokenScalarFieldEnum[]
  }

  /**
   * PasswordResetToken findFirstOrThrow
   */
  export type PasswordResetTokenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * Filter, which PasswordResetToken to fetch.
     */
    where?: PasswordResetTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PasswordResetTokens to fetch.
     */
    orderBy?: PasswordResetTokenOrderByWithRelationInput | PasswordResetTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for PasswordResetTokens.
     */
    cursor?: PasswordResetTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PasswordResetTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PasswordResetTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PasswordResetTokens.
     */
    distinct?: PasswordResetTokenScalarFieldEnum | PasswordResetTokenScalarFieldEnum[]
  }

  /**
   * PasswordResetToken findMany
   */
  export type PasswordResetTokenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * Filter, which PasswordResetTokens to fetch.
     */
    where?: PasswordResetTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PasswordResetTokens to fetch.
     */
    orderBy?: PasswordResetTokenOrderByWithRelationInput | PasswordResetTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing PasswordResetTokens.
     */
    cursor?: PasswordResetTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PasswordResetTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PasswordResetTokens.
     */
    skip?: number
    distinct?: PasswordResetTokenScalarFieldEnum | PasswordResetTokenScalarFieldEnum[]
  }

  /**
   * PasswordResetToken create
   */
  export type PasswordResetTokenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * The data needed to create a PasswordResetToken.
     */
    data: XOR<PasswordResetTokenCreateInput, PasswordResetTokenUncheckedCreateInput>
  }

  /**
   * PasswordResetToken createMany
   */
  export type PasswordResetTokenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PasswordResetTokens.
     */
    data: PasswordResetTokenCreateManyInput | PasswordResetTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PasswordResetToken createManyAndReturn
   */
  export type PasswordResetTokenCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * The data used to create many PasswordResetTokens.
     */
    data: PasswordResetTokenCreateManyInput | PasswordResetTokenCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PasswordResetToken update
   */
  export type PasswordResetTokenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * The data needed to update a PasswordResetToken.
     */
    data: XOR<PasswordResetTokenUpdateInput, PasswordResetTokenUncheckedUpdateInput>
    /**
     * Choose, which PasswordResetToken to update.
     */
    where: PasswordResetTokenWhereUniqueInput
  }

  /**
   * PasswordResetToken updateMany
   */
  export type PasswordResetTokenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PasswordResetTokens.
     */
    data: XOR<PasswordResetTokenUpdateManyMutationInput, PasswordResetTokenUncheckedUpdateManyInput>
    /**
     * Filter which PasswordResetTokens to update
     */
    where?: PasswordResetTokenWhereInput
    /**
     * Limit how many PasswordResetTokens to update.
     */
    limit?: number
  }

  /**
   * PasswordResetToken updateManyAndReturn
   */
  export type PasswordResetTokenUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * The data used to update PasswordResetTokens.
     */
    data: XOR<PasswordResetTokenUpdateManyMutationInput, PasswordResetTokenUncheckedUpdateManyInput>
    /**
     * Filter which PasswordResetTokens to update
     */
    where?: PasswordResetTokenWhereInput
    /**
     * Limit how many PasswordResetTokens to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PasswordResetToken upsert
   */
  export type PasswordResetTokenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * The filter to search for the PasswordResetToken to update in case it exists.
     */
    where: PasswordResetTokenWhereUniqueInput
    /**
     * In case the PasswordResetToken found by the `where` argument doesn't exist, create a new PasswordResetToken with this data.
     */
    create: XOR<PasswordResetTokenCreateInput, PasswordResetTokenUncheckedCreateInput>
    /**
     * In case the PasswordResetToken was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PasswordResetTokenUpdateInput, PasswordResetTokenUncheckedUpdateInput>
  }

  /**
   * PasswordResetToken delete
   */
  export type PasswordResetTokenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
    /**
     * Filter which PasswordResetToken to delete.
     */
    where: PasswordResetTokenWhereUniqueInput
  }

  /**
   * PasswordResetToken deleteMany
   */
  export type PasswordResetTokenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PasswordResetTokens to delete
     */
    where?: PasswordResetTokenWhereInput
    /**
     * Limit how many PasswordResetTokens to delete.
     */
    limit?: number
  }

  /**
   * PasswordResetToken without action
   */
  export type PasswordResetTokenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PasswordResetToken
     */
    select?: PasswordResetTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PasswordResetToken
     */
    omit?: PasswordResetTokenOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PasswordResetTokenInclude<ExtArgs> | null
  }


  /**
   * Model Spot
   */

  export type AggregateSpot = {
    _count: SpotCountAggregateOutputType | null
    _avg: SpotAvgAggregateOutputType | null
    _sum: SpotSumAggregateOutputType | null
    _min: SpotMinAggregateOutputType | null
    _max: SpotMaxAggregateOutputType | null
  }

  export type SpotAvgAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type SpotSumAggregateOutputType = {
    latitude: number | null
    longitude: number | null
  }

  export type SpotMinAggregateOutputType = {
    id: string | null
    userId: string | null
    latitude: number | null
    longitude: number | null
    address: string | null
    city: string | null
    country: string | null
    photoUrl: string | null
    photoKey: string | null
    title: string | null
    description: string | null
    isFree: boolean | null
    priceInfo: string | null
    visibility: $Enums.SpotVisibility | null
    customComposition: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SpotMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    latitude: number | null
    longitude: number | null
    address: string | null
    city: string | null
    country: string | null
    photoUrl: string | null
    photoKey: string | null
    title: string | null
    description: string | null
    isFree: boolean | null
    priceInfo: string | null
    visibility: $Enums.SpotVisibility | null
    customComposition: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SpotCountAggregateOutputType = {
    id: number
    userId: number
    latitude: number
    longitude: number
    address: number
    city: number
    country: number
    photoUrl: number
    photoKey: number
    title: number
    description: number
    isFree: number
    priceInfo: number
    visibility: number
    customComposition: number
    colors: number
    compositions: number
    tags: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SpotAvgAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type SpotSumAggregateInputType = {
    latitude?: true
    longitude?: true
  }

  export type SpotMinAggregateInputType = {
    id?: true
    userId?: true
    latitude?: true
    longitude?: true
    address?: true
    city?: true
    country?: true
    photoUrl?: true
    photoKey?: true
    title?: true
    description?: true
    isFree?: true
    priceInfo?: true
    visibility?: true
    customComposition?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SpotMaxAggregateInputType = {
    id?: true
    userId?: true
    latitude?: true
    longitude?: true
    address?: true
    city?: true
    country?: true
    photoUrl?: true
    photoKey?: true
    title?: true
    description?: true
    isFree?: true
    priceInfo?: true
    visibility?: true
    customComposition?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SpotCountAggregateInputType = {
    id?: true
    userId?: true
    latitude?: true
    longitude?: true
    address?: true
    city?: true
    country?: true
    photoUrl?: true
    photoKey?: true
    title?: true
    description?: true
    isFree?: true
    priceInfo?: true
    visibility?: true
    customComposition?: true
    colors?: true
    compositions?: true
    tags?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SpotAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Spot to aggregate.
     */
    where?: SpotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Spots to fetch.
     */
    orderBy?: SpotOrderByWithRelationInput | SpotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: SpotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Spots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Spots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Spots
    **/
    _count?: true | SpotCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: SpotAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: SpotSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: SpotMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: SpotMaxAggregateInputType
  }

  export type GetSpotAggregateType<T extends SpotAggregateArgs> = {
        [P in keyof T & keyof AggregateSpot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSpot[P]>
      : GetScalarType<T[P], AggregateSpot[P]>
  }




  export type SpotGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpotWhereInput
    orderBy?: SpotOrderByWithAggregationInput | SpotOrderByWithAggregationInput[]
    by: SpotScalarFieldEnum[] | SpotScalarFieldEnum
    having?: SpotScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SpotCountAggregateInputType | true
    _avg?: SpotAvgAggregateInputType
    _sum?: SpotSumAggregateInputType
    _min?: SpotMinAggregateInputType
    _max?: SpotMaxAggregateInputType
  }

  export type SpotGroupByOutputType = {
    id: string
    userId: string
    latitude: number
    longitude: number
    address: string | null
    city: string | null
    country: string | null
    photoUrl: string
    photoKey: string
    title: string | null
    description: string | null
    isFree: boolean
    priceInfo: string | null
    visibility: $Enums.SpotVisibility
    customComposition: string | null
    colors: string[]
    compositions: $Enums.CompositionType[]
    tags: string[]
    createdAt: Date
    updatedAt: Date
    _count: SpotCountAggregateOutputType | null
    _avg: SpotAvgAggregateOutputType | null
    _sum: SpotSumAggregateOutputType | null
    _min: SpotMinAggregateOutputType | null
    _max: SpotMaxAggregateOutputType | null
  }

  type GetSpotGroupByPayload<T extends SpotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SpotGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SpotGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SpotGroupByOutputType[P]>
            : GetScalarType<T[P], SpotGroupByOutputType[P]>
        }
      >
    >


  export type SpotSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    latitude?: boolean
    longitude?: boolean
    address?: boolean
    city?: boolean
    country?: boolean
    photoUrl?: boolean
    photoKey?: boolean
    title?: boolean
    description?: boolean
    isFree?: boolean
    priceInfo?: boolean
    visibility?: boolean
    customComposition?: boolean
    colors?: boolean
    compositions?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    spotPhotos?: boolean | Spot$spotPhotosArgs<ExtArgs>
    images?: boolean | Spot$imagesArgs<ExtArgs>
    _count?: boolean | SpotCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spot"]>

  export type SpotSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    latitude?: boolean
    longitude?: boolean
    address?: boolean
    city?: boolean
    country?: boolean
    photoUrl?: boolean
    photoKey?: boolean
    title?: boolean
    description?: boolean
    isFree?: boolean
    priceInfo?: boolean
    visibility?: boolean
    customComposition?: boolean
    colors?: boolean
    compositions?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spot"]>

  export type SpotSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    latitude?: boolean
    longitude?: boolean
    address?: boolean
    city?: boolean
    country?: boolean
    photoUrl?: boolean
    photoKey?: boolean
    title?: boolean
    description?: boolean
    isFree?: boolean
    priceInfo?: boolean
    visibility?: boolean
    customComposition?: boolean
    colors?: boolean
    compositions?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spot"]>

  export type SpotSelectScalar = {
    id?: boolean
    userId?: boolean
    latitude?: boolean
    longitude?: boolean
    address?: boolean
    city?: boolean
    country?: boolean
    photoUrl?: boolean
    photoKey?: boolean
    title?: boolean
    description?: boolean
    isFree?: boolean
    priceInfo?: boolean
    visibility?: boolean
    customComposition?: boolean
    colors?: boolean
    compositions?: boolean
    tags?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SpotOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "latitude" | "longitude" | "address" | "city" | "country" | "photoUrl" | "photoKey" | "title" | "description" | "isFree" | "priceInfo" | "visibility" | "customComposition" | "colors" | "compositions" | "tags" | "createdAt" | "updatedAt", ExtArgs["result"]["spot"]>
  export type SpotInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    spotPhotos?: boolean | Spot$spotPhotosArgs<ExtArgs>
    images?: boolean | Spot$imagesArgs<ExtArgs>
    _count?: boolean | SpotCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SpotIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SpotIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SpotPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Spot"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      spotPhotos: Prisma.$SpotPhotoPayload<ExtArgs>[]
      images: Prisma.$SpotImagePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      latitude: number
      longitude: number
      address: string | null
      city: string | null
      country: string | null
      photoUrl: string
      photoKey: string
      title: string | null
      description: string | null
      isFree: boolean
      priceInfo: string | null
      visibility: $Enums.SpotVisibility
      customComposition: string | null
      colors: string[]
      compositions: $Enums.CompositionType[]
      tags: string[]
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["spot"]>
    composites: {}
  }

  type SpotGetPayload<S extends boolean | null | undefined | SpotDefaultArgs> = $Result.GetResult<Prisma.$SpotPayload, S>

  type SpotCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SpotFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SpotCountAggregateInputType | true
    }

  export interface SpotDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Spot'], meta: { name: 'Spot' } }
    /**
     * Find zero or one Spot that matches the filter.
     * @param {SpotFindUniqueArgs} args - Arguments to find a Spot
     * @example
     * // Get one Spot
     * const spot = await prisma.spot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SpotFindUniqueArgs>(args: SelectSubset<T, SpotFindUniqueArgs<ExtArgs>>): Prisma__SpotClient<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Spot that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SpotFindUniqueOrThrowArgs} args - Arguments to find a Spot
     * @example
     * // Get one Spot
     * const spot = await prisma.spot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SpotFindUniqueOrThrowArgs>(args: SelectSubset<T, SpotFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SpotClient<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Spot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotFindFirstArgs} args - Arguments to find a Spot
     * @example
     * // Get one Spot
     * const spot = await prisma.spot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SpotFindFirstArgs>(args?: SelectSubset<T, SpotFindFirstArgs<ExtArgs>>): Prisma__SpotClient<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Spot that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotFindFirstOrThrowArgs} args - Arguments to find a Spot
     * @example
     * // Get one Spot
     * const spot = await prisma.spot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SpotFindFirstOrThrowArgs>(args?: SelectSubset<T, SpotFindFirstOrThrowArgs<ExtArgs>>): Prisma__SpotClient<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Spots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Spots
     * const spots = await prisma.spot.findMany()
     *
     * // Get first 10 Spots
     * const spots = await prisma.spot.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const spotWithIdOnly = await prisma.spot.findMany({ select: { id: true } })
     *
     */
    findMany<T extends SpotFindManyArgs>(args?: SelectSubset<T, SpotFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Spot.
     * @param {SpotCreateArgs} args - Arguments to create a Spot.
     * @example
     * // Create one Spot
     * const Spot = await prisma.spot.create({
     *   data: {
     *     // ... data to create a Spot
     *   }
     * })
     *
     */
    create<T extends SpotCreateArgs>(args: SelectSubset<T, SpotCreateArgs<ExtArgs>>): Prisma__SpotClient<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Spots.
     * @param {SpotCreateManyArgs} args - Arguments to create many Spots.
     * @example
     * // Create many Spots
     * const spot = await prisma.spot.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends SpotCreateManyArgs>(args?: SelectSubset<T, SpotCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Spots and returns the data saved in the database.
     * @param {SpotCreateManyAndReturnArgs} args - Arguments to create many Spots.
     * @example
     * // Create many Spots
     * const spot = await prisma.spot.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Spots and only return the `id`
     * const spotWithIdOnly = await prisma.spot.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends SpotCreateManyAndReturnArgs>(args?: SelectSubset<T, SpotCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Spot.
     * @param {SpotDeleteArgs} args - Arguments to delete one Spot.
     * @example
     * // Delete one Spot
     * const Spot = await prisma.spot.delete({
     *   where: {
     *     // ... filter to delete one Spot
     *   }
     * })
     *
     */
    delete<T extends SpotDeleteArgs>(args: SelectSubset<T, SpotDeleteArgs<ExtArgs>>): Prisma__SpotClient<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Spot.
     * @param {SpotUpdateArgs} args - Arguments to update one Spot.
     * @example
     * // Update one Spot
     * const spot = await prisma.spot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends SpotUpdateArgs>(args: SelectSubset<T, SpotUpdateArgs<ExtArgs>>): Prisma__SpotClient<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Spots.
     * @param {SpotDeleteManyArgs} args - Arguments to filter Spots to delete.
     * @example
     * // Delete a few Spots
     * const { count } = await prisma.spot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends SpotDeleteManyArgs>(args?: SelectSubset<T, SpotDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Spots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Spots
     * const spot = await prisma.spot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends SpotUpdateManyArgs>(args: SelectSubset<T, SpotUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Spots and returns the data updated in the database.
     * @param {SpotUpdateManyAndReturnArgs} args - Arguments to update many Spots.
     * @example
     * // Update many Spots
     * const spot = await prisma.spot.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Spots and only return the `id`
     * const spotWithIdOnly = await prisma.spot.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends SpotUpdateManyAndReturnArgs>(args: SelectSubset<T, SpotUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Spot.
     * @param {SpotUpsertArgs} args - Arguments to update or create a Spot.
     * @example
     * // Update or create a Spot
     * const spot = await prisma.spot.upsert({
     *   create: {
     *     // ... data to create a Spot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Spot we want to update
     *   }
     * })
     */
    upsert<T extends SpotUpsertArgs>(args: SelectSubset<T, SpotUpsertArgs<ExtArgs>>): Prisma__SpotClient<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Spots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotCountArgs} args - Arguments to filter Spots to count.
     * @example
     * // Count the number of Spots
     * const count = await prisma.spot.count({
     *   where: {
     *     // ... the filter for the Spots we want to count
     *   }
     * })
    **/
    count<T extends SpotCountArgs>(
      args?: Subset<T, SpotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SpotCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Spot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SpotAggregateArgs>(args: Subset<T, SpotAggregateArgs>): Prisma.PrismaPromise<GetSpotAggregateType<T>>

    /**
     * Group by Spot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends SpotGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SpotGroupByArgs['orderBy'] }
        : { orderBy?: SpotGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SpotGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSpotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Spot model
   */
  readonly fields: SpotFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Spot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SpotClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    spotPhotos<T extends Spot$spotPhotosArgs<ExtArgs> = {}>(args?: Subset<T, Spot$spotPhotosArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    images<T extends Spot$imagesArgs<ExtArgs> = {}>(args?: Subset<T, Spot$imagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotImagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Spot model
   */
  interface SpotFieldRefs {
    readonly id: FieldRef<"Spot", 'String'>
    readonly userId: FieldRef<"Spot", 'String'>
    readonly latitude: FieldRef<"Spot", 'Float'>
    readonly longitude: FieldRef<"Spot", 'Float'>
    readonly address: FieldRef<"Spot", 'String'>
    readonly city: FieldRef<"Spot", 'String'>
    readonly country: FieldRef<"Spot", 'String'>
    readonly photoUrl: FieldRef<"Spot", 'String'>
    readonly photoKey: FieldRef<"Spot", 'String'>
    readonly title: FieldRef<"Spot", 'String'>
    readonly description: FieldRef<"Spot", 'String'>
    readonly isFree: FieldRef<"Spot", 'Boolean'>
    readonly priceInfo: FieldRef<"Spot", 'String'>
    readonly visibility: FieldRef<"Spot", 'SpotVisibility'>
    readonly customComposition: FieldRef<"Spot", 'String'>
    readonly colors: FieldRef<"Spot", 'String[]'>
    readonly compositions: FieldRef<"Spot", 'CompositionType[]'>
    readonly tags: FieldRef<"Spot", 'String[]'>
    readonly createdAt: FieldRef<"Spot", 'DateTime'>
    readonly updatedAt: FieldRef<"Spot", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * Spot findUnique
   */
  export type SpotFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotInclude<ExtArgs> | null
    /**
     * Filter, which Spot to fetch.
     */
    where: SpotWhereUniqueInput
  }

  /**
   * Spot findUniqueOrThrow
   */
  export type SpotFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotInclude<ExtArgs> | null
    /**
     * Filter, which Spot to fetch.
     */
    where: SpotWhereUniqueInput
  }

  /**
   * Spot findFirst
   */
  export type SpotFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotInclude<ExtArgs> | null
    /**
     * Filter, which Spot to fetch.
     */
    where?: SpotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Spots to fetch.
     */
    orderBy?: SpotOrderByWithRelationInput | SpotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Spots.
     */
    cursor?: SpotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Spots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Spots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Spots.
     */
    distinct?: SpotScalarFieldEnum | SpotScalarFieldEnum[]
  }

  /**
   * Spot findFirstOrThrow
   */
  export type SpotFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotInclude<ExtArgs> | null
    /**
     * Filter, which Spot to fetch.
     */
    where?: SpotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Spots to fetch.
     */
    orderBy?: SpotOrderByWithRelationInput | SpotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Spots.
     */
    cursor?: SpotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Spots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Spots.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Spots.
     */
    distinct?: SpotScalarFieldEnum | SpotScalarFieldEnum[]
  }

  /**
   * Spot findMany
   */
  export type SpotFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotInclude<ExtArgs> | null
    /**
     * Filter, which Spots to fetch.
     */
    where?: SpotWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Spots to fetch.
     */
    orderBy?: SpotOrderByWithRelationInput | SpotOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Spots.
     */
    cursor?: SpotWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Spots from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Spots.
     */
    skip?: number
    distinct?: SpotScalarFieldEnum | SpotScalarFieldEnum[]
  }

  /**
   * Spot create
   */
  export type SpotCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotInclude<ExtArgs> | null
    /**
     * The data needed to create a Spot.
     */
    data: XOR<SpotCreateInput, SpotUncheckedCreateInput>
  }

  /**
   * Spot createMany
   */
  export type SpotCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Spots.
     */
    data: SpotCreateManyInput | SpotCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Spot createManyAndReturn
   */
  export type SpotCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * The data used to create many Spots.
     */
    data: SpotCreateManyInput | SpotCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Spot update
   */
  export type SpotUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotInclude<ExtArgs> | null
    /**
     * The data needed to update a Spot.
     */
    data: XOR<SpotUpdateInput, SpotUncheckedUpdateInput>
    /**
     * Choose, which Spot to update.
     */
    where: SpotWhereUniqueInput
  }

  /**
   * Spot updateMany
   */
  export type SpotUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Spots.
     */
    data: XOR<SpotUpdateManyMutationInput, SpotUncheckedUpdateManyInput>
    /**
     * Filter which Spots to update
     */
    where?: SpotWhereInput
    /**
     * Limit how many Spots to update.
     */
    limit?: number
  }

  /**
   * Spot updateManyAndReturn
   */
  export type SpotUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * The data used to update Spots.
     */
    data: XOR<SpotUpdateManyMutationInput, SpotUncheckedUpdateManyInput>
    /**
     * Filter which Spots to update
     */
    where?: SpotWhereInput
    /**
     * Limit how many Spots to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Spot upsert
   */
  export type SpotUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotInclude<ExtArgs> | null
    /**
     * The filter to search for the Spot to update in case it exists.
     */
    where: SpotWhereUniqueInput
    /**
     * In case the Spot found by the `where` argument doesn't exist, create a new Spot with this data.
     */
    create: XOR<SpotCreateInput, SpotUncheckedCreateInput>
    /**
     * In case the Spot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SpotUpdateInput, SpotUncheckedUpdateInput>
  }

  /**
   * Spot delete
   */
  export type SpotDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotInclude<ExtArgs> | null
    /**
     * Filter which Spot to delete.
     */
    where: SpotWhereUniqueInput
  }

  /**
   * Spot deleteMany
   */
  export type SpotDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Spots to delete
     */
    where?: SpotWhereInput
    /**
     * Limit how many Spots to delete.
     */
    limit?: number
  }

  /**
   * Spot.spotPhotos
   */
  export type Spot$spotPhotosArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoInclude<ExtArgs> | null
    where?: SpotPhotoWhereInput
    orderBy?: SpotPhotoOrderByWithRelationInput | SpotPhotoOrderByWithRelationInput[]
    cursor?: SpotPhotoWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SpotPhotoScalarFieldEnum | SpotPhotoScalarFieldEnum[]
  }

  /**
   * Spot.images
   */
  export type Spot$imagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageInclude<ExtArgs> | null
    where?: SpotImageWhereInput
    orderBy?: SpotImageOrderByWithRelationInput | SpotImageOrderByWithRelationInput[]
    cursor?: SpotImageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SpotImageScalarFieldEnum | SpotImageScalarFieldEnum[]
  }

  /**
   * Spot without action
   */
  export type SpotDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Spot
     */
    select?: SpotSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Spot
     */
    omit?: SpotOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotInclude<ExtArgs> | null
  }


  /**
   * Model SpotImage
   */

  export type AggregateSpotImage = {
    _count: SpotImageCountAggregateOutputType | null
    _avg: SpotImageAvgAggregateOutputType | null
    _sum: SpotImageSumAggregateOutputType | null
    _min: SpotImageMinAggregateOutputType | null
    _max: SpotImageMaxAggregateOutputType | null
  }

  export type SpotImageAvgAggregateOutputType = {
    order: number | null
  }

  export type SpotImageSumAggregateOutputType = {
    order: number | null
  }

  export type SpotImageMinAggregateOutputType = {
    id: string | null
    spotId: string | null
    photoUrl: string | null
    photoKey: string | null
    order: number | null
  }

  export type SpotImageMaxAggregateOutputType = {
    id: string | null
    spotId: string | null
    photoUrl: string | null
    photoKey: string | null
    order: number | null
  }

  export type SpotImageCountAggregateOutputType = {
    id: number
    spotId: number
    photoUrl: number
    photoKey: number
    order: number
    _all: number
  }


  export type SpotImageAvgAggregateInputType = {
    order?: true
  }

  export type SpotImageSumAggregateInputType = {
    order?: true
  }

  export type SpotImageMinAggregateInputType = {
    id?: true
    spotId?: true
    photoUrl?: true
    photoKey?: true
    order?: true
  }

  export type SpotImageMaxAggregateInputType = {
    id?: true
    spotId?: true
    photoUrl?: true
    photoKey?: true
    order?: true
  }

  export type SpotImageCountAggregateInputType = {
    id?: true
    spotId?: true
    photoUrl?: true
    photoKey?: true
    order?: true
    _all?: true
  }

  export type SpotImageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SpotImage to aggregate.
     */
    where?: SpotImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of SpotImages to fetch.
     */
    orderBy?: SpotImageOrderByWithRelationInput | SpotImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: SpotImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` SpotImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` SpotImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned SpotImages
    **/
    _count?: true | SpotImageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: SpotImageAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: SpotImageSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: SpotImageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: SpotImageMaxAggregateInputType
  }

  export type GetSpotImageAggregateType<T extends SpotImageAggregateArgs> = {
        [P in keyof T & keyof AggregateSpotImage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSpotImage[P]>
      : GetScalarType<T[P], AggregateSpotImage[P]>
  }




  export type SpotImageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpotImageWhereInput
    orderBy?: SpotImageOrderByWithAggregationInput | SpotImageOrderByWithAggregationInput[]
    by: SpotImageScalarFieldEnum[] | SpotImageScalarFieldEnum
    having?: SpotImageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SpotImageCountAggregateInputType | true
    _avg?: SpotImageAvgAggregateInputType
    _sum?: SpotImageSumAggregateInputType
    _min?: SpotImageMinAggregateInputType
    _max?: SpotImageMaxAggregateInputType
  }

  export type SpotImageGroupByOutputType = {
    id: string
    spotId: string
    photoUrl: string
    photoKey: string
    order: number
    _count: SpotImageCountAggregateOutputType | null
    _avg: SpotImageAvgAggregateOutputType | null
    _sum: SpotImageSumAggregateOutputType | null
    _min: SpotImageMinAggregateOutputType | null
    _max: SpotImageMaxAggregateOutputType | null
  }

  type GetSpotImageGroupByPayload<T extends SpotImageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SpotImageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SpotImageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SpotImageGroupByOutputType[P]>
            : GetScalarType<T[P], SpotImageGroupByOutputType[P]>
        }
      >
    >


  export type SpotImageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spotId?: boolean
    photoUrl?: boolean
    photoKey?: boolean
    order?: boolean
    spot?: boolean | SpotDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spotImage"]>

  export type SpotImageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spotId?: boolean
    photoUrl?: boolean
    photoKey?: boolean
    order?: boolean
    spot?: boolean | SpotDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spotImage"]>

  export type SpotImageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spotId?: boolean
    photoUrl?: boolean
    photoKey?: boolean
    order?: boolean
    spot?: boolean | SpotDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spotImage"]>

  export type SpotImageSelectScalar = {
    id?: boolean
    spotId?: boolean
    photoUrl?: boolean
    photoKey?: boolean
    order?: boolean
  }

  export type SpotImageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "spotId" | "photoUrl" | "photoKey" | "order", ExtArgs["result"]["spotImage"]>
  export type SpotImageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spot?: boolean | SpotDefaultArgs<ExtArgs>
  }
  export type SpotImageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spot?: boolean | SpotDefaultArgs<ExtArgs>
  }
  export type SpotImageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spot?: boolean | SpotDefaultArgs<ExtArgs>
  }

  export type $SpotImagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SpotImage"
    objects: {
      spot: Prisma.$SpotPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      spotId: string
      photoUrl: string
      photoKey: string
      order: number
    }, ExtArgs["result"]["spotImage"]>
    composites: {}
  }

  type SpotImageGetPayload<S extends boolean | null | undefined | SpotImageDefaultArgs> = $Result.GetResult<Prisma.$SpotImagePayload, S>

  type SpotImageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SpotImageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SpotImageCountAggregateInputType | true
    }

  export interface SpotImageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SpotImage'], meta: { name: 'SpotImage' } }
    /**
     * Find zero or one SpotImage that matches the filter.
     * @param {SpotImageFindUniqueArgs} args - Arguments to find a SpotImage
     * @example
     * // Get one SpotImage
     * const spotImage = await prisma.spotImage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SpotImageFindUniqueArgs>(args: SelectSubset<T, SpotImageFindUniqueArgs<ExtArgs>>): Prisma__SpotImageClient<$Result.GetResult<Prisma.$SpotImagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SpotImage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SpotImageFindUniqueOrThrowArgs} args - Arguments to find a SpotImage
     * @example
     * // Get one SpotImage
     * const spotImage = await prisma.spotImage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SpotImageFindUniqueOrThrowArgs>(args: SelectSubset<T, SpotImageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SpotImageClient<$Result.GetResult<Prisma.$SpotImagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SpotImage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotImageFindFirstArgs} args - Arguments to find a SpotImage
     * @example
     * // Get one SpotImage
     * const spotImage = await prisma.spotImage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SpotImageFindFirstArgs>(args?: SelectSubset<T, SpotImageFindFirstArgs<ExtArgs>>): Prisma__SpotImageClient<$Result.GetResult<Prisma.$SpotImagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SpotImage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotImageFindFirstOrThrowArgs} args - Arguments to find a SpotImage
     * @example
     * // Get one SpotImage
     * const spotImage = await prisma.spotImage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SpotImageFindFirstOrThrowArgs>(args?: SelectSubset<T, SpotImageFindFirstOrThrowArgs<ExtArgs>>): Prisma__SpotImageClient<$Result.GetResult<Prisma.$SpotImagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SpotImages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotImageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SpotImages
     * const spotImages = await prisma.spotImage.findMany()
     *
     * // Get first 10 SpotImages
     * const spotImages = await prisma.spotImage.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const spotImageWithIdOnly = await prisma.spotImage.findMany({ select: { id: true } })
     *
     */
    findMany<T extends SpotImageFindManyArgs>(args?: SelectSubset<T, SpotImageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotImagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SpotImage.
     * @param {SpotImageCreateArgs} args - Arguments to create a SpotImage.
     * @example
     * // Create one SpotImage
     * const SpotImage = await prisma.spotImage.create({
     *   data: {
     *     // ... data to create a SpotImage
     *   }
     * })
     *
     */
    create<T extends SpotImageCreateArgs>(args: SelectSubset<T, SpotImageCreateArgs<ExtArgs>>): Prisma__SpotImageClient<$Result.GetResult<Prisma.$SpotImagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SpotImages.
     * @param {SpotImageCreateManyArgs} args - Arguments to create many SpotImages.
     * @example
     * // Create many SpotImages
     * const spotImage = await prisma.spotImage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends SpotImageCreateManyArgs>(args?: SelectSubset<T, SpotImageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SpotImages and returns the data saved in the database.
     * @param {SpotImageCreateManyAndReturnArgs} args - Arguments to create many SpotImages.
     * @example
     * // Create many SpotImages
     * const spotImage = await prisma.spotImage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many SpotImages and only return the `id`
     * const spotImageWithIdOnly = await prisma.spotImage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends SpotImageCreateManyAndReturnArgs>(args?: SelectSubset<T, SpotImageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotImagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SpotImage.
     * @param {SpotImageDeleteArgs} args - Arguments to delete one SpotImage.
     * @example
     * // Delete one SpotImage
     * const SpotImage = await prisma.spotImage.delete({
     *   where: {
     *     // ... filter to delete one SpotImage
     *   }
     * })
     *
     */
    delete<T extends SpotImageDeleteArgs>(args: SelectSubset<T, SpotImageDeleteArgs<ExtArgs>>): Prisma__SpotImageClient<$Result.GetResult<Prisma.$SpotImagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SpotImage.
     * @param {SpotImageUpdateArgs} args - Arguments to update one SpotImage.
     * @example
     * // Update one SpotImage
     * const spotImage = await prisma.spotImage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends SpotImageUpdateArgs>(args: SelectSubset<T, SpotImageUpdateArgs<ExtArgs>>): Prisma__SpotImageClient<$Result.GetResult<Prisma.$SpotImagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SpotImages.
     * @param {SpotImageDeleteManyArgs} args - Arguments to filter SpotImages to delete.
     * @example
     * // Delete a few SpotImages
     * const { count } = await prisma.spotImage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends SpotImageDeleteManyArgs>(args?: SelectSubset<T, SpotImageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SpotImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotImageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SpotImages
     * const spotImage = await prisma.spotImage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends SpotImageUpdateManyArgs>(args: SelectSubset<T, SpotImageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SpotImages and returns the data updated in the database.
     * @param {SpotImageUpdateManyAndReturnArgs} args - Arguments to update many SpotImages.
     * @example
     * // Update many SpotImages
     * const spotImage = await prisma.spotImage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more SpotImages and only return the `id`
     * const spotImageWithIdOnly = await prisma.spotImage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends SpotImageUpdateManyAndReturnArgs>(args: SelectSubset<T, SpotImageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotImagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SpotImage.
     * @param {SpotImageUpsertArgs} args - Arguments to update or create a SpotImage.
     * @example
     * // Update or create a SpotImage
     * const spotImage = await prisma.spotImage.upsert({
     *   create: {
     *     // ... data to create a SpotImage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SpotImage we want to update
     *   }
     * })
     */
    upsert<T extends SpotImageUpsertArgs>(args: SelectSubset<T, SpotImageUpsertArgs<ExtArgs>>): Prisma__SpotImageClient<$Result.GetResult<Prisma.$SpotImagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SpotImages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotImageCountArgs} args - Arguments to filter SpotImages to count.
     * @example
     * // Count the number of SpotImages
     * const count = await prisma.spotImage.count({
     *   where: {
     *     // ... the filter for the SpotImages we want to count
     *   }
     * })
    **/
    count<T extends SpotImageCountArgs>(
      args?: Subset<T, SpotImageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SpotImageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SpotImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotImageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SpotImageAggregateArgs>(args: Subset<T, SpotImageAggregateArgs>): Prisma.PrismaPromise<GetSpotImageAggregateType<T>>

    /**
     * Group by SpotImage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotImageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends SpotImageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SpotImageGroupByArgs['orderBy'] }
        : { orderBy?: SpotImageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SpotImageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSpotImageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SpotImage model
   */
  readonly fields: SpotImageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SpotImage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SpotImageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    spot<T extends SpotDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SpotDefaultArgs<ExtArgs>>): Prisma__SpotClient<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SpotImage model
   */
  interface SpotImageFieldRefs {
    readonly id: FieldRef<"SpotImage", 'String'>
    readonly spotId: FieldRef<"SpotImage", 'String'>
    readonly photoUrl: FieldRef<"SpotImage", 'String'>
    readonly photoKey: FieldRef<"SpotImage", 'String'>
    readonly order: FieldRef<"SpotImage", 'Int'>
  }


  // Custom InputTypes
  /**
   * SpotImage findUnique
   */
  export type SpotImageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageInclude<ExtArgs> | null
    /**
     * Filter, which SpotImage to fetch.
     */
    where: SpotImageWhereUniqueInput
  }

  /**
   * SpotImage findUniqueOrThrow
   */
  export type SpotImageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageInclude<ExtArgs> | null
    /**
     * Filter, which SpotImage to fetch.
     */
    where: SpotImageWhereUniqueInput
  }

  /**
   * SpotImage findFirst
   */
  export type SpotImageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageInclude<ExtArgs> | null
    /**
     * Filter, which SpotImage to fetch.
     */
    where?: SpotImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of SpotImages to fetch.
     */
    orderBy?: SpotImageOrderByWithRelationInput | SpotImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for SpotImages.
     */
    cursor?: SpotImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` SpotImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` SpotImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of SpotImages.
     */
    distinct?: SpotImageScalarFieldEnum | SpotImageScalarFieldEnum[]
  }

  /**
   * SpotImage findFirstOrThrow
   */
  export type SpotImageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageInclude<ExtArgs> | null
    /**
     * Filter, which SpotImage to fetch.
     */
    where?: SpotImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of SpotImages to fetch.
     */
    orderBy?: SpotImageOrderByWithRelationInput | SpotImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for SpotImages.
     */
    cursor?: SpotImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` SpotImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` SpotImages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of SpotImages.
     */
    distinct?: SpotImageScalarFieldEnum | SpotImageScalarFieldEnum[]
  }

  /**
   * SpotImage findMany
   */
  export type SpotImageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageInclude<ExtArgs> | null
    /**
     * Filter, which SpotImages to fetch.
     */
    where?: SpotImageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of SpotImages to fetch.
     */
    orderBy?: SpotImageOrderByWithRelationInput | SpotImageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing SpotImages.
     */
    cursor?: SpotImageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` SpotImages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` SpotImages.
     */
    skip?: number
    distinct?: SpotImageScalarFieldEnum | SpotImageScalarFieldEnum[]
  }

  /**
   * SpotImage create
   */
  export type SpotImageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageInclude<ExtArgs> | null
    /**
     * The data needed to create a SpotImage.
     */
    data: XOR<SpotImageCreateInput, SpotImageUncheckedCreateInput>
  }

  /**
   * SpotImage createMany
   */
  export type SpotImageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SpotImages.
     */
    data: SpotImageCreateManyInput | SpotImageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SpotImage createManyAndReturn
   */
  export type SpotImageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * The data used to create many SpotImages.
     */
    data: SpotImageCreateManyInput | SpotImageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SpotImage update
   */
  export type SpotImageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageInclude<ExtArgs> | null
    /**
     * The data needed to update a SpotImage.
     */
    data: XOR<SpotImageUpdateInput, SpotImageUncheckedUpdateInput>
    /**
     * Choose, which SpotImage to update.
     */
    where: SpotImageWhereUniqueInput
  }

  /**
   * SpotImage updateMany
   */
  export type SpotImageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SpotImages.
     */
    data: XOR<SpotImageUpdateManyMutationInput, SpotImageUncheckedUpdateManyInput>
    /**
     * Filter which SpotImages to update
     */
    where?: SpotImageWhereInput
    /**
     * Limit how many SpotImages to update.
     */
    limit?: number
  }

  /**
   * SpotImage updateManyAndReturn
   */
  export type SpotImageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * The data used to update SpotImages.
     */
    data: XOR<SpotImageUpdateManyMutationInput, SpotImageUncheckedUpdateManyInput>
    /**
     * Filter which SpotImages to update
     */
    where?: SpotImageWhereInput
    /**
     * Limit how many SpotImages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SpotImage upsert
   */
  export type SpotImageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageInclude<ExtArgs> | null
    /**
     * The filter to search for the SpotImage to update in case it exists.
     */
    where: SpotImageWhereUniqueInput
    /**
     * In case the SpotImage found by the `where` argument doesn't exist, create a new SpotImage with this data.
     */
    create: XOR<SpotImageCreateInput, SpotImageUncheckedCreateInput>
    /**
     * In case the SpotImage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SpotImageUpdateInput, SpotImageUncheckedUpdateInput>
  }

  /**
   * SpotImage delete
   */
  export type SpotImageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageInclude<ExtArgs> | null
    /**
     * Filter which SpotImage to delete.
     */
    where: SpotImageWhereUniqueInput
  }

  /**
   * SpotImage deleteMany
   */
  export type SpotImageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SpotImages to delete
     */
    where?: SpotImageWhereInput
    /**
     * Limit how many SpotImages to delete.
     */
    limit?: number
  }

  /**
   * SpotImage without action
   */
  export type SpotImageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotImage
     */
    select?: SpotImageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotImage
     */
    omit?: SpotImageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotImageInclude<ExtArgs> | null
  }


  /**
   * Model SpotPhoto
   */

  export type AggregateSpotPhoto = {
    _count: SpotPhotoCountAggregateOutputType | null
    _min: SpotPhotoMinAggregateOutputType | null
    _max: SpotPhotoMaxAggregateOutputType | null
  }

  export type SpotPhotoMinAggregateOutputType = {
    id: string | null
    spotId: string | null
    userId: string | null
    photoUrl: string | null
    photoKey: string | null
    caption: string | null
    createdAt: Date | null
  }

  export type SpotPhotoMaxAggregateOutputType = {
    id: string | null
    spotId: string | null
    userId: string | null
    photoUrl: string | null
    photoKey: string | null
    caption: string | null
    createdAt: Date | null
  }

  export type SpotPhotoCountAggregateOutputType = {
    id: number
    spotId: number
    userId: number
    photoUrl: number
    photoKey: number
    caption: number
    createdAt: number
    _all: number
  }


  export type SpotPhotoMinAggregateInputType = {
    id?: true
    spotId?: true
    userId?: true
    photoUrl?: true
    photoKey?: true
    caption?: true
    createdAt?: true
  }

  export type SpotPhotoMaxAggregateInputType = {
    id?: true
    spotId?: true
    userId?: true
    photoUrl?: true
    photoKey?: true
    caption?: true
    createdAt?: true
  }

  export type SpotPhotoCountAggregateInputType = {
    id?: true
    spotId?: true
    userId?: true
    photoUrl?: true
    photoKey?: true
    caption?: true
    createdAt?: true
    _all?: true
  }

  export type SpotPhotoAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SpotPhoto to aggregate.
     */
    where?: SpotPhotoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of SpotPhotos to fetch.
     */
    orderBy?: SpotPhotoOrderByWithRelationInput | SpotPhotoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: SpotPhotoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` SpotPhotos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` SpotPhotos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned SpotPhotos
    **/
    _count?: true | SpotPhotoCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: SpotPhotoMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: SpotPhotoMaxAggregateInputType
  }

  export type GetSpotPhotoAggregateType<T extends SpotPhotoAggregateArgs> = {
        [P in keyof T & keyof AggregateSpotPhoto]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSpotPhoto[P]>
      : GetScalarType<T[P], AggregateSpotPhoto[P]>
  }




  export type SpotPhotoGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpotPhotoWhereInput
    orderBy?: SpotPhotoOrderByWithAggregationInput | SpotPhotoOrderByWithAggregationInput[]
    by: SpotPhotoScalarFieldEnum[] | SpotPhotoScalarFieldEnum
    having?: SpotPhotoScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SpotPhotoCountAggregateInputType | true
    _min?: SpotPhotoMinAggregateInputType
    _max?: SpotPhotoMaxAggregateInputType
  }

  export type SpotPhotoGroupByOutputType = {
    id: string
    spotId: string
    userId: string
    photoUrl: string
    photoKey: string
    caption: string | null
    createdAt: Date
    _count: SpotPhotoCountAggregateOutputType | null
    _min: SpotPhotoMinAggregateOutputType | null
    _max: SpotPhotoMaxAggregateOutputType | null
  }

  type GetSpotPhotoGroupByPayload<T extends SpotPhotoGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SpotPhotoGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SpotPhotoGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SpotPhotoGroupByOutputType[P]>
            : GetScalarType<T[P], SpotPhotoGroupByOutputType[P]>
        }
      >
    >


  export type SpotPhotoSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spotId?: boolean
    userId?: boolean
    photoUrl?: boolean
    photoKey?: boolean
    caption?: boolean
    createdAt?: boolean
    spot?: boolean | SpotDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spotPhoto"]>

  export type SpotPhotoSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spotId?: boolean
    userId?: boolean
    photoUrl?: boolean
    photoKey?: boolean
    caption?: boolean
    createdAt?: boolean
    spot?: boolean | SpotDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spotPhoto"]>

  export type SpotPhotoSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spotId?: boolean
    userId?: boolean
    photoUrl?: boolean
    photoKey?: boolean
    caption?: boolean
    createdAt?: boolean
    spot?: boolean | SpotDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spotPhoto"]>

  export type SpotPhotoSelectScalar = {
    id?: boolean
    spotId?: boolean
    userId?: boolean
    photoUrl?: boolean
    photoKey?: boolean
    caption?: boolean
    createdAt?: boolean
  }

  export type SpotPhotoOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "spotId" | "userId" | "photoUrl" | "photoKey" | "caption" | "createdAt", ExtArgs["result"]["spotPhoto"]>
  export type SpotPhotoInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spot?: boolean | SpotDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SpotPhotoIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spot?: boolean | SpotDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SpotPhotoIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spot?: boolean | SpotDefaultArgs<ExtArgs>
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SpotPhotoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SpotPhoto"
    objects: {
      spot: Prisma.$SpotPayload<ExtArgs>
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      spotId: string
      userId: string
      photoUrl: string
      photoKey: string
      caption: string | null
      createdAt: Date
    }, ExtArgs["result"]["spotPhoto"]>
    composites: {}
  }

  type SpotPhotoGetPayload<S extends boolean | null | undefined | SpotPhotoDefaultArgs> = $Result.GetResult<Prisma.$SpotPhotoPayload, S>

  type SpotPhotoCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SpotPhotoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SpotPhotoCountAggregateInputType | true
    }

  export interface SpotPhotoDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SpotPhoto'], meta: { name: 'SpotPhoto' } }
    /**
     * Find zero or one SpotPhoto that matches the filter.
     * @param {SpotPhotoFindUniqueArgs} args - Arguments to find a SpotPhoto
     * @example
     * // Get one SpotPhoto
     * const spotPhoto = await prisma.spotPhoto.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SpotPhotoFindUniqueArgs>(args: SelectSubset<T, SpotPhotoFindUniqueArgs<ExtArgs>>): Prisma__SpotPhotoClient<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SpotPhoto that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SpotPhotoFindUniqueOrThrowArgs} args - Arguments to find a SpotPhoto
     * @example
     * // Get one SpotPhoto
     * const spotPhoto = await prisma.spotPhoto.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SpotPhotoFindUniqueOrThrowArgs>(args: SelectSubset<T, SpotPhotoFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SpotPhotoClient<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SpotPhoto that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotPhotoFindFirstArgs} args - Arguments to find a SpotPhoto
     * @example
     * // Get one SpotPhoto
     * const spotPhoto = await prisma.spotPhoto.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SpotPhotoFindFirstArgs>(args?: SelectSubset<T, SpotPhotoFindFirstArgs<ExtArgs>>): Prisma__SpotPhotoClient<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SpotPhoto that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotPhotoFindFirstOrThrowArgs} args - Arguments to find a SpotPhoto
     * @example
     * // Get one SpotPhoto
     * const spotPhoto = await prisma.spotPhoto.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SpotPhotoFindFirstOrThrowArgs>(args?: SelectSubset<T, SpotPhotoFindFirstOrThrowArgs<ExtArgs>>): Prisma__SpotPhotoClient<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SpotPhotos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotPhotoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SpotPhotos
     * const spotPhotos = await prisma.spotPhoto.findMany()
     *
     * // Get first 10 SpotPhotos
     * const spotPhotos = await prisma.spotPhoto.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const spotPhotoWithIdOnly = await prisma.spotPhoto.findMany({ select: { id: true } })
     *
     */
    findMany<T extends SpotPhotoFindManyArgs>(args?: SelectSubset<T, SpotPhotoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SpotPhoto.
     * @param {SpotPhotoCreateArgs} args - Arguments to create a SpotPhoto.
     * @example
     * // Create one SpotPhoto
     * const SpotPhoto = await prisma.spotPhoto.create({
     *   data: {
     *     // ... data to create a SpotPhoto
     *   }
     * })
     *
     */
    create<T extends SpotPhotoCreateArgs>(args: SelectSubset<T, SpotPhotoCreateArgs<ExtArgs>>): Prisma__SpotPhotoClient<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SpotPhotos.
     * @param {SpotPhotoCreateManyArgs} args - Arguments to create many SpotPhotos.
     * @example
     * // Create many SpotPhotos
     * const spotPhoto = await prisma.spotPhoto.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends SpotPhotoCreateManyArgs>(args?: SelectSubset<T, SpotPhotoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SpotPhotos and returns the data saved in the database.
     * @param {SpotPhotoCreateManyAndReturnArgs} args - Arguments to create many SpotPhotos.
     * @example
     * // Create many SpotPhotos
     * const spotPhoto = await prisma.spotPhoto.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many SpotPhotos and only return the `id`
     * const spotPhotoWithIdOnly = await prisma.spotPhoto.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends SpotPhotoCreateManyAndReturnArgs>(args?: SelectSubset<T, SpotPhotoCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SpotPhoto.
     * @param {SpotPhotoDeleteArgs} args - Arguments to delete one SpotPhoto.
     * @example
     * // Delete one SpotPhoto
     * const SpotPhoto = await prisma.spotPhoto.delete({
     *   where: {
     *     // ... filter to delete one SpotPhoto
     *   }
     * })
     *
     */
    delete<T extends SpotPhotoDeleteArgs>(args: SelectSubset<T, SpotPhotoDeleteArgs<ExtArgs>>): Prisma__SpotPhotoClient<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SpotPhoto.
     * @param {SpotPhotoUpdateArgs} args - Arguments to update one SpotPhoto.
     * @example
     * // Update one SpotPhoto
     * const spotPhoto = await prisma.spotPhoto.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends SpotPhotoUpdateArgs>(args: SelectSubset<T, SpotPhotoUpdateArgs<ExtArgs>>): Prisma__SpotPhotoClient<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SpotPhotos.
     * @param {SpotPhotoDeleteManyArgs} args - Arguments to filter SpotPhotos to delete.
     * @example
     * // Delete a few SpotPhotos
     * const { count } = await prisma.spotPhoto.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends SpotPhotoDeleteManyArgs>(args?: SelectSubset<T, SpotPhotoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SpotPhotos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotPhotoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SpotPhotos
     * const spotPhoto = await prisma.spotPhoto.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends SpotPhotoUpdateManyArgs>(args: SelectSubset<T, SpotPhotoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SpotPhotos and returns the data updated in the database.
     * @param {SpotPhotoUpdateManyAndReturnArgs} args - Arguments to update many SpotPhotos.
     * @example
     * // Update many SpotPhotos
     * const spotPhoto = await prisma.spotPhoto.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more SpotPhotos and only return the `id`
     * const spotPhotoWithIdOnly = await prisma.spotPhoto.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends SpotPhotoUpdateManyAndReturnArgs>(args: SelectSubset<T, SpotPhotoUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SpotPhoto.
     * @param {SpotPhotoUpsertArgs} args - Arguments to update or create a SpotPhoto.
     * @example
     * // Update or create a SpotPhoto
     * const spotPhoto = await prisma.spotPhoto.upsert({
     *   create: {
     *     // ... data to create a SpotPhoto
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SpotPhoto we want to update
     *   }
     * })
     */
    upsert<T extends SpotPhotoUpsertArgs>(args: SelectSubset<T, SpotPhotoUpsertArgs<ExtArgs>>): Prisma__SpotPhotoClient<$Result.GetResult<Prisma.$SpotPhotoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SpotPhotos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotPhotoCountArgs} args - Arguments to filter SpotPhotos to count.
     * @example
     * // Count the number of SpotPhotos
     * const count = await prisma.spotPhoto.count({
     *   where: {
     *     // ... the filter for the SpotPhotos we want to count
     *   }
     * })
    **/
    count<T extends SpotPhotoCountArgs>(
      args?: Subset<T, SpotPhotoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SpotPhotoCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SpotPhoto.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotPhotoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SpotPhotoAggregateArgs>(args: Subset<T, SpotPhotoAggregateArgs>): Prisma.PrismaPromise<GetSpotPhotoAggregateType<T>>

    /**
     * Group by SpotPhoto.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpotPhotoGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<
      T extends SpotPhotoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SpotPhotoGroupByArgs['orderBy'] }
        : { orderBy?: SpotPhotoGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SpotPhotoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSpotPhotoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SpotPhoto model
   */
  readonly fields: SpotPhotoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SpotPhoto.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SpotPhotoClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    spot<T extends SpotDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SpotDefaultArgs<ExtArgs>>): Prisma__SpotClient<$Result.GetResult<Prisma.$SpotPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SpotPhoto model
   */
  interface SpotPhotoFieldRefs {
    readonly id: FieldRef<"SpotPhoto", 'String'>
    readonly spotId: FieldRef<"SpotPhoto", 'String'>
    readonly userId: FieldRef<"SpotPhoto", 'String'>
    readonly photoUrl: FieldRef<"SpotPhoto", 'String'>
    readonly photoKey: FieldRef<"SpotPhoto", 'String'>
    readonly caption: FieldRef<"SpotPhoto", 'String'>
    readonly createdAt: FieldRef<"SpotPhoto", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * SpotPhoto findUnique
   */
  export type SpotPhotoFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoInclude<ExtArgs> | null
    /**
     * Filter, which SpotPhoto to fetch.
     */
    where: SpotPhotoWhereUniqueInput
  }

  /**
   * SpotPhoto findUniqueOrThrow
   */
  export type SpotPhotoFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoInclude<ExtArgs> | null
    /**
     * Filter, which SpotPhoto to fetch.
     */
    where: SpotPhotoWhereUniqueInput
  }

  /**
   * SpotPhoto findFirst
   */
  export type SpotPhotoFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoInclude<ExtArgs> | null
    /**
     * Filter, which SpotPhoto to fetch.
     */
    where?: SpotPhotoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of SpotPhotos to fetch.
     */
    orderBy?: SpotPhotoOrderByWithRelationInput | SpotPhotoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for SpotPhotos.
     */
    cursor?: SpotPhotoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` SpotPhotos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` SpotPhotos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of SpotPhotos.
     */
    distinct?: SpotPhotoScalarFieldEnum | SpotPhotoScalarFieldEnum[]
  }

  /**
   * SpotPhoto findFirstOrThrow
   */
  export type SpotPhotoFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoInclude<ExtArgs> | null
    /**
     * Filter, which SpotPhoto to fetch.
     */
    where?: SpotPhotoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of SpotPhotos to fetch.
     */
    orderBy?: SpotPhotoOrderByWithRelationInput | SpotPhotoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for SpotPhotos.
     */
    cursor?: SpotPhotoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` SpotPhotos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` SpotPhotos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of SpotPhotos.
     */
    distinct?: SpotPhotoScalarFieldEnum | SpotPhotoScalarFieldEnum[]
  }

  /**
   * SpotPhoto findMany
   */
  export type SpotPhotoFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoInclude<ExtArgs> | null
    /**
     * Filter, which SpotPhotos to fetch.
     */
    where?: SpotPhotoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of SpotPhotos to fetch.
     */
    orderBy?: SpotPhotoOrderByWithRelationInput | SpotPhotoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing SpotPhotos.
     */
    cursor?: SpotPhotoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` SpotPhotos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` SpotPhotos.
     */
    skip?: number
    distinct?: SpotPhotoScalarFieldEnum | SpotPhotoScalarFieldEnum[]
  }

  /**
   * SpotPhoto create
   */
  export type SpotPhotoCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoInclude<ExtArgs> | null
    /**
     * The data needed to create a SpotPhoto.
     */
    data: XOR<SpotPhotoCreateInput, SpotPhotoUncheckedCreateInput>
  }

  /**
   * SpotPhoto createMany
   */
  export type SpotPhotoCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SpotPhotos.
     */
    data: SpotPhotoCreateManyInput | SpotPhotoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SpotPhoto createManyAndReturn
   */
  export type SpotPhotoCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * The data used to create many SpotPhotos.
     */
    data: SpotPhotoCreateManyInput | SpotPhotoCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SpotPhoto update
   */
  export type SpotPhotoUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoInclude<ExtArgs> | null
    /**
     * The data needed to update a SpotPhoto.
     */
    data: XOR<SpotPhotoUpdateInput, SpotPhotoUncheckedUpdateInput>
    /**
     * Choose, which SpotPhoto to update.
     */
    where: SpotPhotoWhereUniqueInput
  }

  /**
   * SpotPhoto updateMany
   */
  export type SpotPhotoUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SpotPhotos.
     */
    data: XOR<SpotPhotoUpdateManyMutationInput, SpotPhotoUncheckedUpdateManyInput>
    /**
     * Filter which SpotPhotos to update
     */
    where?: SpotPhotoWhereInput
    /**
     * Limit how many SpotPhotos to update.
     */
    limit?: number
  }

  /**
   * SpotPhoto updateManyAndReturn
   */
  export type SpotPhotoUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * The data used to update SpotPhotos.
     */
    data: XOR<SpotPhotoUpdateManyMutationInput, SpotPhotoUncheckedUpdateManyInput>
    /**
     * Filter which SpotPhotos to update
     */
    where?: SpotPhotoWhereInput
    /**
     * Limit how many SpotPhotos to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SpotPhoto upsert
   */
  export type SpotPhotoUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoInclude<ExtArgs> | null
    /**
     * The filter to search for the SpotPhoto to update in case it exists.
     */
    where: SpotPhotoWhereUniqueInput
    /**
     * In case the SpotPhoto found by the `where` argument doesn't exist, create a new SpotPhoto with this data.
     */
    create: XOR<SpotPhotoCreateInput, SpotPhotoUncheckedCreateInput>
    /**
     * In case the SpotPhoto was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SpotPhotoUpdateInput, SpotPhotoUncheckedUpdateInput>
  }

  /**
   * SpotPhoto delete
   */
  export type SpotPhotoDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoInclude<ExtArgs> | null
    /**
     * Filter which SpotPhoto to delete.
     */
    where: SpotPhotoWhereUniqueInput
  }

  /**
   * SpotPhoto deleteMany
   */
  export type SpotPhotoDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SpotPhotos to delete
     */
    where?: SpotPhotoWhereInput
    /**
     * Limit how many SpotPhotos to delete.
     */
    limit?: number
  }

  /**
   * SpotPhoto without action
   */
  export type SpotPhotoDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpotPhoto
     */
    select?: SpotPhotoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpotPhoto
     */
    omit?: SpotPhotoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpotPhotoInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    passwordHash: 'passwordHash',
    provider: 'provider',
    providerId: 'providerId',
    username: 'username',
    name: 'name',
    avatarUrl: 'avatarUrl',
    bio: 'bio',
    locale: 'locale',
    isPrivate: 'isPrivate',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const FollowScalarFieldEnum: {
    id: 'id',
    followerId: 'followerId',
    followingId: 'followingId',
    status: 'status',
    createdAt: 'createdAt'
  };

  export type FollowScalarFieldEnum = (typeof FollowScalarFieldEnum)[keyof typeof FollowScalarFieldEnum]


  export const PasswordResetTokenScalarFieldEnum: {
    id: 'id',
    token: 'token',
    userId: 'userId',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt'
  };

  export type PasswordResetTokenScalarFieldEnum = (typeof PasswordResetTokenScalarFieldEnum)[keyof typeof PasswordResetTokenScalarFieldEnum]


  export const SpotScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    latitude: 'latitude',
    longitude: 'longitude',
    address: 'address',
    city: 'city',
    country: 'country',
    photoUrl: 'photoUrl',
    photoKey: 'photoKey',
    title: 'title',
    description: 'description',
    isFree: 'isFree',
    priceInfo: 'priceInfo',
    visibility: 'visibility',
    customComposition: 'customComposition',
    colors: 'colors',
    compositions: 'compositions',
    tags: 'tags',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SpotScalarFieldEnum = (typeof SpotScalarFieldEnum)[keyof typeof SpotScalarFieldEnum]


  export const SpotImageScalarFieldEnum: {
    id: 'id',
    spotId: 'spotId',
    photoUrl: 'photoUrl',
    photoKey: 'photoKey',
    order: 'order'
  };

  export type SpotImageScalarFieldEnum = (typeof SpotImageScalarFieldEnum)[keyof typeof SpotImageScalarFieldEnum]


  export const SpotPhotoScalarFieldEnum: {
    id: 'id',
    spotId: 'spotId',
    userId: 'userId',
    photoUrl: 'photoUrl',
    photoKey: 'photoKey',
    caption: 'caption',
    createdAt: 'createdAt'
  };

  export type SpotPhotoScalarFieldEnum = (typeof SpotPhotoScalarFieldEnum)[keyof typeof SpotPhotoScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>



  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>



  /**
   * Reference to a field of type 'AuthProvider'
   */
  export type EnumAuthProviderFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AuthProvider'>



  /**
   * Reference to a field of type 'AuthProvider[]'
   */
  export type ListEnumAuthProviderFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AuthProvider[]'>



  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>



  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>



  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>



  /**
   * Reference to a field of type 'FollowStatus'
   */
  export type EnumFollowStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'FollowStatus'>



  /**
   * Reference to a field of type 'FollowStatus[]'
   */
  export type ListEnumFollowStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'FollowStatus[]'>



  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>



  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>



  /**
   * Reference to a field of type 'SpotVisibility'
   */
  export type EnumSpotVisibilityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SpotVisibility'>



  /**
   * Reference to a field of type 'SpotVisibility[]'
   */
  export type ListEnumSpotVisibilityFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SpotVisibility[]'>



  /**
   * Reference to a field of type 'CompositionType[]'
   */
  export type ListEnumCompositionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CompositionType[]'>



  /**
   * Reference to a field of type 'CompositionType'
   */
  export type EnumCompositionTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CompositionType'>



  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>



  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>

  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    passwordHash?: StringNullableFilter<"User"> | string | null
    provider?: EnumAuthProviderFilter<"User"> | $Enums.AuthProvider
    providerId?: StringNullableFilter<"User"> | string | null
    username?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    avatarUrl?: StringNullableFilter<"User"> | string | null
    bio?: StringNullableFilter<"User"> | string | null
    locale?: StringFilter<"User"> | string
    isPrivate?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    spots?: SpotListRelationFilter
    spotPhotos?: SpotPhotoListRelationFilter
    followers?: FollowListRelationFilter
    following?: FollowListRelationFilter
    passwordResetTokens?: PasswordResetTokenListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrderInput | SortOrder
    provider?: SortOrder
    providerId?: SortOrderInput | SortOrder
    username?: SortOrder
    name?: SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    locale?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    spots?: SpotOrderByRelationAggregateInput
    spotPhotos?: SpotPhotoOrderByRelationAggregateInput
    followers?: FollowOrderByRelationAggregateInput
    following?: FollowOrderByRelationAggregateInput
    passwordResetTokens?: PasswordResetTokenOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    username?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    passwordHash?: StringNullableFilter<"User"> | string | null
    provider?: EnumAuthProviderFilter<"User"> | $Enums.AuthProvider
    providerId?: StringNullableFilter<"User"> | string | null
    name?: StringFilter<"User"> | string
    avatarUrl?: StringNullableFilter<"User"> | string | null
    bio?: StringNullableFilter<"User"> | string | null
    locale?: StringFilter<"User"> | string
    isPrivate?: BoolFilter<"User"> | boolean
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    spots?: SpotListRelationFilter
    spotPhotos?: SpotPhotoListRelationFilter
    followers?: FollowListRelationFilter
    following?: FollowListRelationFilter
    passwordResetTokens?: PasswordResetTokenListRelationFilter
  }, "id" | "email" | "username">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrderInput | SortOrder
    provider?: SortOrder
    providerId?: SortOrderInput | SortOrder
    username?: SortOrder
    name?: SortOrder
    avatarUrl?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    locale?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    passwordHash?: StringNullableWithAggregatesFilter<"User"> | string | null
    provider?: EnumAuthProviderWithAggregatesFilter<"User"> | $Enums.AuthProvider
    providerId?: StringNullableWithAggregatesFilter<"User"> | string | null
    username?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    avatarUrl?: StringNullableWithAggregatesFilter<"User"> | string | null
    bio?: StringNullableWithAggregatesFilter<"User"> | string | null
    locale?: StringWithAggregatesFilter<"User"> | string
    isPrivate?: BoolWithAggregatesFilter<"User"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type FollowWhereInput = {
    AND?: FollowWhereInput | FollowWhereInput[]
    OR?: FollowWhereInput[]
    NOT?: FollowWhereInput | FollowWhereInput[]
    id?: StringFilter<"Follow"> | string
    followerId?: StringFilter<"Follow"> | string
    followingId?: StringFilter<"Follow"> | string
    status?: EnumFollowStatusFilter<"Follow"> | $Enums.FollowStatus
    createdAt?: DateTimeFilter<"Follow"> | Date | string
    follower?: XOR<UserScalarRelationFilter, UserWhereInput>
    following?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type FollowOrderByWithRelationInput = {
    id?: SortOrder
    followerId?: SortOrder
    followingId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    follower?: UserOrderByWithRelationInput
    following?: UserOrderByWithRelationInput
  }

  export type FollowWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    followerId_followingId?: FollowFollowerIdFollowingIdCompoundUniqueInput
    AND?: FollowWhereInput | FollowWhereInput[]
    OR?: FollowWhereInput[]
    NOT?: FollowWhereInput | FollowWhereInput[]
    followerId?: StringFilter<"Follow"> | string
    followingId?: StringFilter<"Follow"> | string
    status?: EnumFollowStatusFilter<"Follow"> | $Enums.FollowStatus
    createdAt?: DateTimeFilter<"Follow"> | Date | string
    follower?: XOR<UserScalarRelationFilter, UserWhereInput>
    following?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "followerId_followingId">

  export type FollowOrderByWithAggregationInput = {
    id?: SortOrder
    followerId?: SortOrder
    followingId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    _count?: FollowCountOrderByAggregateInput
    _max?: FollowMaxOrderByAggregateInput
    _min?: FollowMinOrderByAggregateInput
  }

  export type FollowScalarWhereWithAggregatesInput = {
    AND?: FollowScalarWhereWithAggregatesInput | FollowScalarWhereWithAggregatesInput[]
    OR?: FollowScalarWhereWithAggregatesInput[]
    NOT?: FollowScalarWhereWithAggregatesInput | FollowScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Follow"> | string
    followerId?: StringWithAggregatesFilter<"Follow"> | string
    followingId?: StringWithAggregatesFilter<"Follow"> | string
    status?: EnumFollowStatusWithAggregatesFilter<"Follow"> | $Enums.FollowStatus
    createdAt?: DateTimeWithAggregatesFilter<"Follow"> | Date | string
  }

  export type PasswordResetTokenWhereInput = {
    AND?: PasswordResetTokenWhereInput | PasswordResetTokenWhereInput[]
    OR?: PasswordResetTokenWhereInput[]
    NOT?: PasswordResetTokenWhereInput | PasswordResetTokenWhereInput[]
    id?: StringFilter<"PasswordResetToken"> | string
    token?: StringFilter<"PasswordResetToken"> | string
    userId?: StringFilter<"PasswordResetToken"> | string
    expiresAt?: DateTimeFilter<"PasswordResetToken"> | Date | string
    createdAt?: DateTimeFilter<"PasswordResetToken"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type PasswordResetTokenOrderByWithRelationInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type PasswordResetTokenWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token?: string
    AND?: PasswordResetTokenWhereInput | PasswordResetTokenWhereInput[]
    OR?: PasswordResetTokenWhereInput[]
    NOT?: PasswordResetTokenWhereInput | PasswordResetTokenWhereInput[]
    userId?: StringFilter<"PasswordResetToken"> | string
    expiresAt?: DateTimeFilter<"PasswordResetToken"> | Date | string
    createdAt?: DateTimeFilter<"PasswordResetToken"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "token">

  export type PasswordResetTokenOrderByWithAggregationInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    _count?: PasswordResetTokenCountOrderByAggregateInput
    _max?: PasswordResetTokenMaxOrderByAggregateInput
    _min?: PasswordResetTokenMinOrderByAggregateInput
  }

  export type PasswordResetTokenScalarWhereWithAggregatesInput = {
    AND?: PasswordResetTokenScalarWhereWithAggregatesInput | PasswordResetTokenScalarWhereWithAggregatesInput[]
    OR?: PasswordResetTokenScalarWhereWithAggregatesInput[]
    NOT?: PasswordResetTokenScalarWhereWithAggregatesInput | PasswordResetTokenScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PasswordResetToken"> | string
    token?: StringWithAggregatesFilter<"PasswordResetToken"> | string
    userId?: StringWithAggregatesFilter<"PasswordResetToken"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"PasswordResetToken"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"PasswordResetToken"> | Date | string
  }

  export type SpotWhereInput = {
    AND?: SpotWhereInput | SpotWhereInput[]
    OR?: SpotWhereInput[]
    NOT?: SpotWhereInput | SpotWhereInput[]
    id?: StringFilter<"Spot"> | string
    userId?: StringFilter<"Spot"> | string
    latitude?: FloatFilter<"Spot"> | number
    longitude?: FloatFilter<"Spot"> | number
    address?: StringNullableFilter<"Spot"> | string | null
    city?: StringNullableFilter<"Spot"> | string | null
    country?: StringNullableFilter<"Spot"> | string | null
    photoUrl?: StringFilter<"Spot"> | string
    photoKey?: StringFilter<"Spot"> | string
    title?: StringNullableFilter<"Spot"> | string | null
    description?: StringNullableFilter<"Spot"> | string | null
    isFree?: BoolFilter<"Spot"> | boolean
    priceInfo?: StringNullableFilter<"Spot"> | string | null
    visibility?: EnumSpotVisibilityFilter<"Spot"> | $Enums.SpotVisibility
    customComposition?: StringNullableFilter<"Spot"> | string | null
    colors?: StringNullableListFilter<"Spot">
    compositions?: EnumCompositionTypeNullableListFilter<"Spot">
    tags?: StringNullableListFilter<"Spot">
    createdAt?: DateTimeFilter<"Spot"> | Date | string
    updatedAt?: DateTimeFilter<"Spot"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    spotPhotos?: SpotPhotoListRelationFilter
    images?: SpotImageListRelationFilter
  }

  export type SpotOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    address?: SortOrderInput | SortOrder
    city?: SortOrderInput | SortOrder
    country?: SortOrderInput | SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    title?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    isFree?: SortOrder
    priceInfo?: SortOrderInput | SortOrder
    visibility?: SortOrder
    customComposition?: SortOrderInput | SortOrder
    colors?: SortOrder
    compositions?: SortOrder
    tags?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    spotPhotos?: SpotPhotoOrderByRelationAggregateInput
    images?: SpotImageOrderByRelationAggregateInput
  }

  export type SpotWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SpotWhereInput | SpotWhereInput[]
    OR?: SpotWhereInput[]
    NOT?: SpotWhereInput | SpotWhereInput[]
    userId?: StringFilter<"Spot"> | string
    latitude?: FloatFilter<"Spot"> | number
    longitude?: FloatFilter<"Spot"> | number
    address?: StringNullableFilter<"Spot"> | string | null
    city?: StringNullableFilter<"Spot"> | string | null
    country?: StringNullableFilter<"Spot"> | string | null
    photoUrl?: StringFilter<"Spot"> | string
    photoKey?: StringFilter<"Spot"> | string
    title?: StringNullableFilter<"Spot"> | string | null
    description?: StringNullableFilter<"Spot"> | string | null
    isFree?: BoolFilter<"Spot"> | boolean
    priceInfo?: StringNullableFilter<"Spot"> | string | null
    visibility?: EnumSpotVisibilityFilter<"Spot"> | $Enums.SpotVisibility
    customComposition?: StringNullableFilter<"Spot"> | string | null
    colors?: StringNullableListFilter<"Spot">
    compositions?: EnumCompositionTypeNullableListFilter<"Spot">
    tags?: StringNullableListFilter<"Spot">
    createdAt?: DateTimeFilter<"Spot"> | Date | string
    updatedAt?: DateTimeFilter<"Spot"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    spotPhotos?: SpotPhotoListRelationFilter
    images?: SpotImageListRelationFilter
  }, "id">

  export type SpotOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    address?: SortOrderInput | SortOrder
    city?: SortOrderInput | SortOrder
    country?: SortOrderInput | SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    title?: SortOrderInput | SortOrder
    description?: SortOrderInput | SortOrder
    isFree?: SortOrder
    priceInfo?: SortOrderInput | SortOrder
    visibility?: SortOrder
    customComposition?: SortOrderInput | SortOrder
    colors?: SortOrder
    compositions?: SortOrder
    tags?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SpotCountOrderByAggregateInput
    _avg?: SpotAvgOrderByAggregateInput
    _max?: SpotMaxOrderByAggregateInput
    _min?: SpotMinOrderByAggregateInput
    _sum?: SpotSumOrderByAggregateInput
  }

  export type SpotScalarWhereWithAggregatesInput = {
    AND?: SpotScalarWhereWithAggregatesInput | SpotScalarWhereWithAggregatesInput[]
    OR?: SpotScalarWhereWithAggregatesInput[]
    NOT?: SpotScalarWhereWithAggregatesInput | SpotScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Spot"> | string
    userId?: StringWithAggregatesFilter<"Spot"> | string
    latitude?: FloatWithAggregatesFilter<"Spot"> | number
    longitude?: FloatWithAggregatesFilter<"Spot"> | number
    address?: StringNullableWithAggregatesFilter<"Spot"> | string | null
    city?: StringNullableWithAggregatesFilter<"Spot"> | string | null
    country?: StringNullableWithAggregatesFilter<"Spot"> | string | null
    photoUrl?: StringWithAggregatesFilter<"Spot"> | string
    photoKey?: StringWithAggregatesFilter<"Spot"> | string
    title?: StringNullableWithAggregatesFilter<"Spot"> | string | null
    description?: StringNullableWithAggregatesFilter<"Spot"> | string | null
    isFree?: BoolWithAggregatesFilter<"Spot"> | boolean
    priceInfo?: StringNullableWithAggregatesFilter<"Spot"> | string | null
    visibility?: EnumSpotVisibilityWithAggregatesFilter<"Spot"> | $Enums.SpotVisibility
    customComposition?: StringNullableWithAggregatesFilter<"Spot"> | string | null
    colors?: StringNullableListFilter<"Spot">
    compositions?: EnumCompositionTypeNullableListFilter<"Spot">
    tags?: StringNullableListFilter<"Spot">
    createdAt?: DateTimeWithAggregatesFilter<"Spot"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Spot"> | Date | string
  }

  export type SpotImageWhereInput = {
    AND?: SpotImageWhereInput | SpotImageWhereInput[]
    OR?: SpotImageWhereInput[]
    NOT?: SpotImageWhereInput | SpotImageWhereInput[]
    id?: StringFilter<"SpotImage"> | string
    spotId?: StringFilter<"SpotImage"> | string
    photoUrl?: StringFilter<"SpotImage"> | string
    photoKey?: StringFilter<"SpotImage"> | string
    order?: IntFilter<"SpotImage"> | number
    spot?: XOR<SpotScalarRelationFilter, SpotWhereInput>
  }

  export type SpotImageOrderByWithRelationInput = {
    id?: SortOrder
    spotId?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    order?: SortOrder
    spot?: SpotOrderByWithRelationInput
  }

  export type SpotImageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SpotImageWhereInput | SpotImageWhereInput[]
    OR?: SpotImageWhereInput[]
    NOT?: SpotImageWhereInput | SpotImageWhereInput[]
    spotId?: StringFilter<"SpotImage"> | string
    photoUrl?: StringFilter<"SpotImage"> | string
    photoKey?: StringFilter<"SpotImage"> | string
    order?: IntFilter<"SpotImage"> | number
    spot?: XOR<SpotScalarRelationFilter, SpotWhereInput>
  }, "id">

  export type SpotImageOrderByWithAggregationInput = {
    id?: SortOrder
    spotId?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    order?: SortOrder
    _count?: SpotImageCountOrderByAggregateInput
    _avg?: SpotImageAvgOrderByAggregateInput
    _max?: SpotImageMaxOrderByAggregateInput
    _min?: SpotImageMinOrderByAggregateInput
    _sum?: SpotImageSumOrderByAggregateInput
  }

  export type SpotImageScalarWhereWithAggregatesInput = {
    AND?: SpotImageScalarWhereWithAggregatesInput | SpotImageScalarWhereWithAggregatesInput[]
    OR?: SpotImageScalarWhereWithAggregatesInput[]
    NOT?: SpotImageScalarWhereWithAggregatesInput | SpotImageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SpotImage"> | string
    spotId?: StringWithAggregatesFilter<"SpotImage"> | string
    photoUrl?: StringWithAggregatesFilter<"SpotImage"> | string
    photoKey?: StringWithAggregatesFilter<"SpotImage"> | string
    order?: IntWithAggregatesFilter<"SpotImage"> | number
  }

  export type SpotPhotoWhereInput = {
    AND?: SpotPhotoWhereInput | SpotPhotoWhereInput[]
    OR?: SpotPhotoWhereInput[]
    NOT?: SpotPhotoWhereInput | SpotPhotoWhereInput[]
    id?: StringFilter<"SpotPhoto"> | string
    spotId?: StringFilter<"SpotPhoto"> | string
    userId?: StringFilter<"SpotPhoto"> | string
    photoUrl?: StringFilter<"SpotPhoto"> | string
    photoKey?: StringFilter<"SpotPhoto"> | string
    caption?: StringNullableFilter<"SpotPhoto"> | string | null
    createdAt?: DateTimeFilter<"SpotPhoto"> | Date | string
    spot?: XOR<SpotScalarRelationFilter, SpotWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SpotPhotoOrderByWithRelationInput = {
    id?: SortOrder
    spotId?: SortOrder
    userId?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    caption?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    spot?: SpotOrderByWithRelationInput
    user?: UserOrderByWithRelationInput
  }

  export type SpotPhotoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SpotPhotoWhereInput | SpotPhotoWhereInput[]
    OR?: SpotPhotoWhereInput[]
    NOT?: SpotPhotoWhereInput | SpotPhotoWhereInput[]
    spotId?: StringFilter<"SpotPhoto"> | string
    userId?: StringFilter<"SpotPhoto"> | string
    photoUrl?: StringFilter<"SpotPhoto"> | string
    photoKey?: StringFilter<"SpotPhoto"> | string
    caption?: StringNullableFilter<"SpotPhoto"> | string | null
    createdAt?: DateTimeFilter<"SpotPhoto"> | Date | string
    spot?: XOR<SpotScalarRelationFilter, SpotWhereInput>
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type SpotPhotoOrderByWithAggregationInput = {
    id?: SortOrder
    spotId?: SortOrder
    userId?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    caption?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: SpotPhotoCountOrderByAggregateInput
    _max?: SpotPhotoMaxOrderByAggregateInput
    _min?: SpotPhotoMinOrderByAggregateInput
  }

  export type SpotPhotoScalarWhereWithAggregatesInput = {
    AND?: SpotPhotoScalarWhereWithAggregatesInput | SpotPhotoScalarWhereWithAggregatesInput[]
    OR?: SpotPhotoScalarWhereWithAggregatesInput[]
    NOT?: SpotPhotoScalarWhereWithAggregatesInput | SpotPhotoScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SpotPhoto"> | string
    spotId?: StringWithAggregatesFilter<"SpotPhoto"> | string
    userId?: StringWithAggregatesFilter<"SpotPhoto"> | string
    photoUrl?: StringWithAggregatesFilter<"SpotPhoto"> | string
    photoKey?: StringWithAggregatesFilter<"SpotPhoto"> | string
    caption?: StringNullableWithAggregatesFilter<"SpotPhoto"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"SpotPhoto"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    spots?: SpotCreateNestedManyWithoutUserInput
    spotPhotos?: SpotPhotoCreateNestedManyWithoutUserInput
    followers?: FollowCreateNestedManyWithoutFollowingInput
    following?: FollowCreateNestedManyWithoutFollowerInput
    passwordResetTokens?: PasswordResetTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    spots?: SpotUncheckedCreateNestedManyWithoutUserInput
    spotPhotos?: SpotPhotoUncheckedCreateNestedManyWithoutUserInput
    followers?: FollowUncheckedCreateNestedManyWithoutFollowingInput
    following?: FollowUncheckedCreateNestedManyWithoutFollowerInput
    passwordResetTokens?: PasswordResetTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spots?: SpotUpdateManyWithoutUserNestedInput
    spotPhotos?: SpotPhotoUpdateManyWithoutUserNestedInput
    followers?: FollowUpdateManyWithoutFollowingNestedInput
    following?: FollowUpdateManyWithoutFollowerNestedInput
    passwordResetTokens?: PasswordResetTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spots?: SpotUncheckedUpdateManyWithoutUserNestedInput
    spotPhotos?: SpotPhotoUncheckedUpdateManyWithoutUserNestedInput
    followers?: FollowUncheckedUpdateManyWithoutFollowingNestedInput
    following?: FollowUncheckedUpdateManyWithoutFollowerNestedInput
    passwordResetTokens?: PasswordResetTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FollowCreateInput = {
    id?: string
    status?: $Enums.FollowStatus
    createdAt?: Date | string
    follower: UserCreateNestedOneWithoutFollowingInput
    following: UserCreateNestedOneWithoutFollowersInput
  }

  export type FollowUncheckedCreateInput = {
    id?: string
    followerId: string
    followingId: string
    status?: $Enums.FollowStatus
    createdAt?: Date | string
  }

  export type FollowUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumFollowStatusFieldUpdateOperationsInput | $Enums.FollowStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    follower?: UserUpdateOneRequiredWithoutFollowingNestedInput
    following?: UserUpdateOneRequiredWithoutFollowersNestedInput
  }

  export type FollowUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    followerId?: StringFieldUpdateOperationsInput | string
    followingId?: StringFieldUpdateOperationsInput | string
    status?: EnumFollowStatusFieldUpdateOperationsInput | $Enums.FollowStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FollowCreateManyInput = {
    id?: string
    followerId: string
    followingId: string
    status?: $Enums.FollowStatus
    createdAt?: Date | string
  }

  export type FollowUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumFollowStatusFieldUpdateOperationsInput | $Enums.FollowStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FollowUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    followerId?: StringFieldUpdateOperationsInput | string
    followingId?: StringFieldUpdateOperationsInput | string
    status?: EnumFollowStatusFieldUpdateOperationsInput | $Enums.FollowStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetTokenCreateInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutPasswordResetTokensInput
  }

  export type PasswordResetTokenUncheckedCreateInput = {
    id?: string
    token: string
    userId: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type PasswordResetTokenUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutPasswordResetTokensNestedInput
  }

  export type PasswordResetTokenUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetTokenCreateManyInput = {
    id?: string
    token: string
    userId: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type PasswordResetTokenUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetTokenUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpotCreateInput = {
    id?: string
    latitude: number
    longitude: number
    address?: string | null
    city?: string | null
    country?: string | null
    photoUrl: string
    photoKey: string
    title?: string | null
    description?: string | null
    isFree?: boolean
    priceInfo?: string | null
    visibility?: $Enums.SpotVisibility
    customComposition?: string | null
    colors?: SpotCreatecolorsInput | string[]
    compositions?: SpotCreatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutSpotsInput
    spotPhotos?: SpotPhotoCreateNestedManyWithoutSpotInput
    images?: SpotImageCreateNestedManyWithoutSpotInput
  }

  export type SpotUncheckedCreateInput = {
    id?: string
    userId: string
    latitude: number
    longitude: number
    address?: string | null
    city?: string | null
    country?: string | null
    photoUrl: string
    photoKey: string
    title?: string | null
    description?: string | null
    isFree?: boolean
    priceInfo?: string | null
    visibility?: $Enums.SpotVisibility
    customComposition?: string | null
    colors?: SpotCreatecolorsInput | string[]
    compositions?: SpotCreatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    spotPhotos?: SpotPhotoUncheckedCreateNestedManyWithoutSpotInput
    images?: SpotImageUncheckedCreateNestedManyWithoutSpotInput
  }

  export type SpotUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isFree?: BoolFieldUpdateOperationsInput | boolean
    priceInfo?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: EnumSpotVisibilityFieldUpdateOperationsInput | $Enums.SpotVisibility
    customComposition?: NullableStringFieldUpdateOperationsInput | string | null
    colors?: SpotUpdatecolorsInput | string[]
    compositions?: SpotUpdatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSpotsNestedInput
    spotPhotos?: SpotPhotoUpdateManyWithoutSpotNestedInput
    images?: SpotImageUpdateManyWithoutSpotNestedInput
  }

  export type SpotUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isFree?: BoolFieldUpdateOperationsInput | boolean
    priceInfo?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: EnumSpotVisibilityFieldUpdateOperationsInput | $Enums.SpotVisibility
    customComposition?: NullableStringFieldUpdateOperationsInput | string | null
    colors?: SpotUpdatecolorsInput | string[]
    compositions?: SpotUpdatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spotPhotos?: SpotPhotoUncheckedUpdateManyWithoutSpotNestedInput
    images?: SpotImageUncheckedUpdateManyWithoutSpotNestedInput
  }

  export type SpotCreateManyInput = {
    id?: string
    userId: string
    latitude: number
    longitude: number
    address?: string | null
    city?: string | null
    country?: string | null
    photoUrl: string
    photoKey: string
    title?: string | null
    description?: string | null
    isFree?: boolean
    priceInfo?: string | null
    visibility?: $Enums.SpotVisibility
    customComposition?: string | null
    colors?: SpotCreatecolorsInput | string[]
    compositions?: SpotCreatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SpotUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isFree?: BoolFieldUpdateOperationsInput | boolean
    priceInfo?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: EnumSpotVisibilityFieldUpdateOperationsInput | $Enums.SpotVisibility
    customComposition?: NullableStringFieldUpdateOperationsInput | string | null
    colors?: SpotUpdatecolorsInput | string[]
    compositions?: SpotUpdatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpotUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isFree?: BoolFieldUpdateOperationsInput | boolean
    priceInfo?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: EnumSpotVisibilityFieldUpdateOperationsInput | $Enums.SpotVisibility
    customComposition?: NullableStringFieldUpdateOperationsInput | string | null
    colors?: SpotUpdatecolorsInput | string[]
    compositions?: SpotUpdatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpotImageCreateInput = {
    id?: string
    photoUrl: string
    photoKey: string
    order?: number
    spot: SpotCreateNestedOneWithoutImagesInput
  }

  export type SpotImageUncheckedCreateInput = {
    id?: string
    spotId: string
    photoUrl: string
    photoKey: string
    order?: number
  }

  export type SpotImageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
    spot?: SpotUpdateOneRequiredWithoutImagesNestedInput
  }

  export type SpotImageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotId?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
  }

  export type SpotImageCreateManyInput = {
    id?: string
    spotId: string
    photoUrl: string
    photoKey: string
    order?: number
  }

  export type SpotImageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
  }

  export type SpotImageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotId?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
  }

  export type SpotPhotoCreateInput = {
    id?: string
    photoUrl: string
    photoKey: string
    caption?: string | null
    createdAt?: Date | string
    spot: SpotCreateNestedOneWithoutSpotPhotosInput
    user: UserCreateNestedOneWithoutSpotPhotosInput
  }

  export type SpotPhotoUncheckedCreateInput = {
    id?: string
    spotId: string
    userId: string
    photoUrl: string
    photoKey: string
    caption?: string | null
    createdAt?: Date | string
  }

  export type SpotPhotoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spot?: SpotUpdateOneRequiredWithoutSpotPhotosNestedInput
    user?: UserUpdateOneRequiredWithoutSpotPhotosNestedInput
  }

  export type SpotPhotoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpotPhotoCreateManyInput = {
    id?: string
    spotId: string
    userId: string
    photoUrl: string
    photoKey: string
    caption?: string | null
    createdAt?: Date | string
  }

  export type SpotPhotoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpotPhotoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotId?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumAuthProviderFilter<$PrismaModel = never> = {
    equals?: $Enums.AuthProvider | EnumAuthProviderFieldRefInput<$PrismaModel>
    in?: $Enums.AuthProvider[] | ListEnumAuthProviderFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuthProvider[] | ListEnumAuthProviderFieldRefInput<$PrismaModel>
    not?: NestedEnumAuthProviderFilter<$PrismaModel> | $Enums.AuthProvider
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SpotListRelationFilter = {
    every?: SpotWhereInput
    some?: SpotWhereInput
    none?: SpotWhereInput
  }

  export type SpotPhotoListRelationFilter = {
    every?: SpotPhotoWhereInput
    some?: SpotPhotoWhereInput
    none?: SpotPhotoWhereInput
  }

  export type FollowListRelationFilter = {
    every?: FollowWhereInput
    some?: FollowWhereInput
    none?: FollowWhereInput
  }

  export type PasswordResetTokenListRelationFilter = {
    every?: PasswordResetTokenWhereInput
    some?: PasswordResetTokenWhereInput
    none?: PasswordResetTokenWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type SpotOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SpotPhotoOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type FollowOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PasswordResetTokenOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    provider?: SortOrder
    providerId?: SortOrder
    username?: SortOrder
    name?: SortOrder
    avatarUrl?: SortOrder
    bio?: SortOrder
    locale?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    provider?: SortOrder
    providerId?: SortOrder
    username?: SortOrder
    name?: SortOrder
    avatarUrl?: SortOrder
    bio?: SortOrder
    locale?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    provider?: SortOrder
    providerId?: SortOrder
    username?: SortOrder
    name?: SortOrder
    avatarUrl?: SortOrder
    bio?: SortOrder
    locale?: SortOrder
    isPrivate?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumAuthProviderWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AuthProvider | EnumAuthProviderFieldRefInput<$PrismaModel>
    in?: $Enums.AuthProvider[] | ListEnumAuthProviderFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuthProvider[] | ListEnumAuthProviderFieldRefInput<$PrismaModel>
    not?: NestedEnumAuthProviderWithAggregatesFilter<$PrismaModel> | $Enums.AuthProvider
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAuthProviderFilter<$PrismaModel>
    _max?: NestedEnumAuthProviderFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumFollowStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.FollowStatus | EnumFollowStatusFieldRefInput<$PrismaModel>
    in?: $Enums.FollowStatus[] | ListEnumFollowStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.FollowStatus[] | ListEnumFollowStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumFollowStatusFilter<$PrismaModel> | $Enums.FollowStatus
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type FollowFollowerIdFollowingIdCompoundUniqueInput = {
    followerId: string
    followingId: string
  }

  export type FollowCountOrderByAggregateInput = {
    id?: SortOrder
    followerId?: SortOrder
    followingId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type FollowMaxOrderByAggregateInput = {
    id?: SortOrder
    followerId?: SortOrder
    followingId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type FollowMinOrderByAggregateInput = {
    id?: SortOrder
    followerId?: SortOrder
    followingId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumFollowStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FollowStatus | EnumFollowStatusFieldRefInput<$PrismaModel>
    in?: $Enums.FollowStatus[] | ListEnumFollowStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.FollowStatus[] | ListEnumFollowStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumFollowStatusWithAggregatesFilter<$PrismaModel> | $Enums.FollowStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFollowStatusFilter<$PrismaModel>
    _max?: NestedEnumFollowStatusFilter<$PrismaModel>
  }

  export type PasswordResetTokenCountOrderByAggregateInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type PasswordResetTokenMaxOrderByAggregateInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type PasswordResetTokenMinOrderByAggregateInput = {
    id?: SortOrder
    token?: SortOrder
    userId?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type EnumSpotVisibilityFilter<$PrismaModel = never> = {
    equals?: $Enums.SpotVisibility | EnumSpotVisibilityFieldRefInput<$PrismaModel>
    in?: $Enums.SpotVisibility[] | ListEnumSpotVisibilityFieldRefInput<$PrismaModel>
    notIn?: $Enums.SpotVisibility[] | ListEnumSpotVisibilityFieldRefInput<$PrismaModel>
    not?: NestedEnumSpotVisibilityFilter<$PrismaModel> | $Enums.SpotVisibility
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type EnumCompositionTypeNullableListFilter<$PrismaModel = never> = {
    equals?: $Enums.CompositionType[] | ListEnumCompositionTypeFieldRefInput<$PrismaModel> | null
    has?: $Enums.CompositionType | EnumCompositionTypeFieldRefInput<$PrismaModel> | null
    hasEvery?: $Enums.CompositionType[] | ListEnumCompositionTypeFieldRefInput<$PrismaModel>
    hasSome?: $Enums.CompositionType[] | ListEnumCompositionTypeFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type SpotImageListRelationFilter = {
    every?: SpotImageWhereInput
    some?: SpotImageWhereInput
    none?: SpotImageWhereInput
  }

  export type SpotImageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SpotCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    address?: SortOrder
    city?: SortOrder
    country?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    title?: SortOrder
    description?: SortOrder
    isFree?: SortOrder
    priceInfo?: SortOrder
    visibility?: SortOrder
    customComposition?: SortOrder
    colors?: SortOrder
    compositions?: SortOrder
    tags?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SpotAvgOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type SpotMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    address?: SortOrder
    city?: SortOrder
    country?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    title?: SortOrder
    description?: SortOrder
    isFree?: SortOrder
    priceInfo?: SortOrder
    visibility?: SortOrder
    customComposition?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SpotMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    address?: SortOrder
    city?: SortOrder
    country?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    title?: SortOrder
    description?: SortOrder
    isFree?: SortOrder
    priceInfo?: SortOrder
    visibility?: SortOrder
    customComposition?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SpotSumOrderByAggregateInput = {
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type EnumSpotVisibilityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SpotVisibility | EnumSpotVisibilityFieldRefInput<$PrismaModel>
    in?: $Enums.SpotVisibility[] | ListEnumSpotVisibilityFieldRefInput<$PrismaModel>
    notIn?: $Enums.SpotVisibility[] | ListEnumSpotVisibilityFieldRefInput<$PrismaModel>
    not?: NestedEnumSpotVisibilityWithAggregatesFilter<$PrismaModel> | $Enums.SpotVisibility
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSpotVisibilityFilter<$PrismaModel>
    _max?: NestedEnumSpotVisibilityFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type SpotScalarRelationFilter = {
    is?: SpotWhereInput
    isNot?: SpotWhereInput
  }

  export type SpotImageCountOrderByAggregateInput = {
    id?: SortOrder
    spotId?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    order?: SortOrder
  }

  export type SpotImageAvgOrderByAggregateInput = {
    order?: SortOrder
  }

  export type SpotImageMaxOrderByAggregateInput = {
    id?: SortOrder
    spotId?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    order?: SortOrder
  }

  export type SpotImageMinOrderByAggregateInput = {
    id?: SortOrder
    spotId?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    order?: SortOrder
  }

  export type SpotImageSumOrderByAggregateInput = {
    order?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type SpotPhotoCountOrderByAggregateInput = {
    id?: SortOrder
    spotId?: SortOrder
    userId?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    caption?: SortOrder
    createdAt?: SortOrder
  }

  export type SpotPhotoMaxOrderByAggregateInput = {
    id?: SortOrder
    spotId?: SortOrder
    userId?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    caption?: SortOrder
    createdAt?: SortOrder
  }

  export type SpotPhotoMinOrderByAggregateInput = {
    id?: SortOrder
    spotId?: SortOrder
    userId?: SortOrder
    photoUrl?: SortOrder
    photoKey?: SortOrder
    caption?: SortOrder
    createdAt?: SortOrder
  }

  export type SpotCreateNestedManyWithoutUserInput = {
    create?: XOR<SpotCreateWithoutUserInput, SpotUncheckedCreateWithoutUserInput> | SpotCreateWithoutUserInput[] | SpotUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SpotCreateOrConnectWithoutUserInput | SpotCreateOrConnectWithoutUserInput[]
    createMany?: SpotCreateManyUserInputEnvelope
    connect?: SpotWhereUniqueInput | SpotWhereUniqueInput[]
  }

  export type SpotPhotoCreateNestedManyWithoutUserInput = {
    create?: XOR<SpotPhotoCreateWithoutUserInput, SpotPhotoUncheckedCreateWithoutUserInput> | SpotPhotoCreateWithoutUserInput[] | SpotPhotoUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SpotPhotoCreateOrConnectWithoutUserInput | SpotPhotoCreateOrConnectWithoutUserInput[]
    createMany?: SpotPhotoCreateManyUserInputEnvelope
    connect?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
  }

  export type FollowCreateNestedManyWithoutFollowingInput = {
    create?: XOR<FollowCreateWithoutFollowingInput, FollowUncheckedCreateWithoutFollowingInput> | FollowCreateWithoutFollowingInput[] | FollowUncheckedCreateWithoutFollowingInput[]
    connectOrCreate?: FollowCreateOrConnectWithoutFollowingInput | FollowCreateOrConnectWithoutFollowingInput[]
    createMany?: FollowCreateManyFollowingInputEnvelope
    connect?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
  }

  export type FollowCreateNestedManyWithoutFollowerInput = {
    create?: XOR<FollowCreateWithoutFollowerInput, FollowUncheckedCreateWithoutFollowerInput> | FollowCreateWithoutFollowerInput[] | FollowUncheckedCreateWithoutFollowerInput[]
    connectOrCreate?: FollowCreateOrConnectWithoutFollowerInput | FollowCreateOrConnectWithoutFollowerInput[]
    createMany?: FollowCreateManyFollowerInputEnvelope
    connect?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
  }

  export type PasswordResetTokenCreateNestedManyWithoutUserInput = {
    create?: XOR<PasswordResetTokenCreateWithoutUserInput, PasswordResetTokenUncheckedCreateWithoutUserInput> | PasswordResetTokenCreateWithoutUserInput[] | PasswordResetTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PasswordResetTokenCreateOrConnectWithoutUserInput | PasswordResetTokenCreateOrConnectWithoutUserInput[]
    createMany?: PasswordResetTokenCreateManyUserInputEnvelope
    connect?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
  }

  export type SpotUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SpotCreateWithoutUserInput, SpotUncheckedCreateWithoutUserInput> | SpotCreateWithoutUserInput[] | SpotUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SpotCreateOrConnectWithoutUserInput | SpotCreateOrConnectWithoutUserInput[]
    createMany?: SpotCreateManyUserInputEnvelope
    connect?: SpotWhereUniqueInput | SpotWhereUniqueInput[]
  }

  export type SpotPhotoUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SpotPhotoCreateWithoutUserInput, SpotPhotoUncheckedCreateWithoutUserInput> | SpotPhotoCreateWithoutUserInput[] | SpotPhotoUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SpotPhotoCreateOrConnectWithoutUserInput | SpotPhotoCreateOrConnectWithoutUserInput[]
    createMany?: SpotPhotoCreateManyUserInputEnvelope
    connect?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
  }

  export type FollowUncheckedCreateNestedManyWithoutFollowingInput = {
    create?: XOR<FollowCreateWithoutFollowingInput, FollowUncheckedCreateWithoutFollowingInput> | FollowCreateWithoutFollowingInput[] | FollowUncheckedCreateWithoutFollowingInput[]
    connectOrCreate?: FollowCreateOrConnectWithoutFollowingInput | FollowCreateOrConnectWithoutFollowingInput[]
    createMany?: FollowCreateManyFollowingInputEnvelope
    connect?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
  }

  export type FollowUncheckedCreateNestedManyWithoutFollowerInput = {
    create?: XOR<FollowCreateWithoutFollowerInput, FollowUncheckedCreateWithoutFollowerInput> | FollowCreateWithoutFollowerInput[] | FollowUncheckedCreateWithoutFollowerInput[]
    connectOrCreate?: FollowCreateOrConnectWithoutFollowerInput | FollowCreateOrConnectWithoutFollowerInput[]
    createMany?: FollowCreateManyFollowerInputEnvelope
    connect?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
  }

  export type PasswordResetTokenUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<PasswordResetTokenCreateWithoutUserInput, PasswordResetTokenUncheckedCreateWithoutUserInput> | PasswordResetTokenCreateWithoutUserInput[] | PasswordResetTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PasswordResetTokenCreateOrConnectWithoutUserInput | PasswordResetTokenCreateOrConnectWithoutUserInput[]
    createMany?: PasswordResetTokenCreateManyUserInputEnvelope
    connect?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumAuthProviderFieldUpdateOperationsInput = {
    set?: $Enums.AuthProvider
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type SpotUpdateManyWithoutUserNestedInput = {
    create?: XOR<SpotCreateWithoutUserInput, SpotUncheckedCreateWithoutUserInput> | SpotCreateWithoutUserInput[] | SpotUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SpotCreateOrConnectWithoutUserInput | SpotCreateOrConnectWithoutUserInput[]
    upsert?: SpotUpsertWithWhereUniqueWithoutUserInput | SpotUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SpotCreateManyUserInputEnvelope
    set?: SpotWhereUniqueInput | SpotWhereUniqueInput[]
    disconnect?: SpotWhereUniqueInput | SpotWhereUniqueInput[]
    delete?: SpotWhereUniqueInput | SpotWhereUniqueInput[]
    connect?: SpotWhereUniqueInput | SpotWhereUniqueInput[]
    update?: SpotUpdateWithWhereUniqueWithoutUserInput | SpotUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SpotUpdateManyWithWhereWithoutUserInput | SpotUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SpotScalarWhereInput | SpotScalarWhereInput[]
  }

  export type SpotPhotoUpdateManyWithoutUserNestedInput = {
    create?: XOR<SpotPhotoCreateWithoutUserInput, SpotPhotoUncheckedCreateWithoutUserInput> | SpotPhotoCreateWithoutUserInput[] | SpotPhotoUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SpotPhotoCreateOrConnectWithoutUserInput | SpotPhotoCreateOrConnectWithoutUserInput[]
    upsert?: SpotPhotoUpsertWithWhereUniqueWithoutUserInput | SpotPhotoUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SpotPhotoCreateManyUserInputEnvelope
    set?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    disconnect?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    delete?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    connect?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    update?: SpotPhotoUpdateWithWhereUniqueWithoutUserInput | SpotPhotoUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SpotPhotoUpdateManyWithWhereWithoutUserInput | SpotPhotoUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SpotPhotoScalarWhereInput | SpotPhotoScalarWhereInput[]
  }

  export type FollowUpdateManyWithoutFollowingNestedInput = {
    create?: XOR<FollowCreateWithoutFollowingInput, FollowUncheckedCreateWithoutFollowingInput> | FollowCreateWithoutFollowingInput[] | FollowUncheckedCreateWithoutFollowingInput[]
    connectOrCreate?: FollowCreateOrConnectWithoutFollowingInput | FollowCreateOrConnectWithoutFollowingInput[]
    upsert?: FollowUpsertWithWhereUniqueWithoutFollowingInput | FollowUpsertWithWhereUniqueWithoutFollowingInput[]
    createMany?: FollowCreateManyFollowingInputEnvelope
    set?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    disconnect?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    delete?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    connect?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    update?: FollowUpdateWithWhereUniqueWithoutFollowingInput | FollowUpdateWithWhereUniqueWithoutFollowingInput[]
    updateMany?: FollowUpdateManyWithWhereWithoutFollowingInput | FollowUpdateManyWithWhereWithoutFollowingInput[]
    deleteMany?: FollowScalarWhereInput | FollowScalarWhereInput[]
  }

  export type FollowUpdateManyWithoutFollowerNestedInput = {
    create?: XOR<FollowCreateWithoutFollowerInput, FollowUncheckedCreateWithoutFollowerInput> | FollowCreateWithoutFollowerInput[] | FollowUncheckedCreateWithoutFollowerInput[]
    connectOrCreate?: FollowCreateOrConnectWithoutFollowerInput | FollowCreateOrConnectWithoutFollowerInput[]
    upsert?: FollowUpsertWithWhereUniqueWithoutFollowerInput | FollowUpsertWithWhereUniqueWithoutFollowerInput[]
    createMany?: FollowCreateManyFollowerInputEnvelope
    set?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    disconnect?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    delete?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    connect?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    update?: FollowUpdateWithWhereUniqueWithoutFollowerInput | FollowUpdateWithWhereUniqueWithoutFollowerInput[]
    updateMany?: FollowUpdateManyWithWhereWithoutFollowerInput | FollowUpdateManyWithWhereWithoutFollowerInput[]
    deleteMany?: FollowScalarWhereInput | FollowScalarWhereInput[]
  }

  export type PasswordResetTokenUpdateManyWithoutUserNestedInput = {
    create?: XOR<PasswordResetTokenCreateWithoutUserInput, PasswordResetTokenUncheckedCreateWithoutUserInput> | PasswordResetTokenCreateWithoutUserInput[] | PasswordResetTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PasswordResetTokenCreateOrConnectWithoutUserInput | PasswordResetTokenCreateOrConnectWithoutUserInput[]
    upsert?: PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput | PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PasswordResetTokenCreateManyUserInputEnvelope
    set?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    disconnect?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    delete?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    connect?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    update?: PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput | PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PasswordResetTokenUpdateManyWithWhereWithoutUserInput | PasswordResetTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PasswordResetTokenScalarWhereInput | PasswordResetTokenScalarWhereInput[]
  }

  export type SpotUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SpotCreateWithoutUserInput, SpotUncheckedCreateWithoutUserInput> | SpotCreateWithoutUserInput[] | SpotUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SpotCreateOrConnectWithoutUserInput | SpotCreateOrConnectWithoutUserInput[]
    upsert?: SpotUpsertWithWhereUniqueWithoutUserInput | SpotUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SpotCreateManyUserInputEnvelope
    set?: SpotWhereUniqueInput | SpotWhereUniqueInput[]
    disconnect?: SpotWhereUniqueInput | SpotWhereUniqueInput[]
    delete?: SpotWhereUniqueInput | SpotWhereUniqueInput[]
    connect?: SpotWhereUniqueInput | SpotWhereUniqueInput[]
    update?: SpotUpdateWithWhereUniqueWithoutUserInput | SpotUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SpotUpdateManyWithWhereWithoutUserInput | SpotUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SpotScalarWhereInput | SpotScalarWhereInput[]
  }

  export type SpotPhotoUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SpotPhotoCreateWithoutUserInput, SpotPhotoUncheckedCreateWithoutUserInput> | SpotPhotoCreateWithoutUserInput[] | SpotPhotoUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SpotPhotoCreateOrConnectWithoutUserInput | SpotPhotoCreateOrConnectWithoutUserInput[]
    upsert?: SpotPhotoUpsertWithWhereUniqueWithoutUserInput | SpotPhotoUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SpotPhotoCreateManyUserInputEnvelope
    set?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    disconnect?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    delete?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    connect?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    update?: SpotPhotoUpdateWithWhereUniqueWithoutUserInput | SpotPhotoUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SpotPhotoUpdateManyWithWhereWithoutUserInput | SpotPhotoUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SpotPhotoScalarWhereInput | SpotPhotoScalarWhereInput[]
  }

  export type FollowUncheckedUpdateManyWithoutFollowingNestedInput = {
    create?: XOR<FollowCreateWithoutFollowingInput, FollowUncheckedCreateWithoutFollowingInput> | FollowCreateWithoutFollowingInput[] | FollowUncheckedCreateWithoutFollowingInput[]
    connectOrCreate?: FollowCreateOrConnectWithoutFollowingInput | FollowCreateOrConnectWithoutFollowingInput[]
    upsert?: FollowUpsertWithWhereUniqueWithoutFollowingInput | FollowUpsertWithWhereUniqueWithoutFollowingInput[]
    createMany?: FollowCreateManyFollowingInputEnvelope
    set?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    disconnect?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    delete?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    connect?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    update?: FollowUpdateWithWhereUniqueWithoutFollowingInput | FollowUpdateWithWhereUniqueWithoutFollowingInput[]
    updateMany?: FollowUpdateManyWithWhereWithoutFollowingInput | FollowUpdateManyWithWhereWithoutFollowingInput[]
    deleteMany?: FollowScalarWhereInput | FollowScalarWhereInput[]
  }

  export type FollowUncheckedUpdateManyWithoutFollowerNestedInput = {
    create?: XOR<FollowCreateWithoutFollowerInput, FollowUncheckedCreateWithoutFollowerInput> | FollowCreateWithoutFollowerInput[] | FollowUncheckedCreateWithoutFollowerInput[]
    connectOrCreate?: FollowCreateOrConnectWithoutFollowerInput | FollowCreateOrConnectWithoutFollowerInput[]
    upsert?: FollowUpsertWithWhereUniqueWithoutFollowerInput | FollowUpsertWithWhereUniqueWithoutFollowerInput[]
    createMany?: FollowCreateManyFollowerInputEnvelope
    set?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    disconnect?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    delete?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    connect?: FollowWhereUniqueInput | FollowWhereUniqueInput[]
    update?: FollowUpdateWithWhereUniqueWithoutFollowerInput | FollowUpdateWithWhereUniqueWithoutFollowerInput[]
    updateMany?: FollowUpdateManyWithWhereWithoutFollowerInput | FollowUpdateManyWithWhereWithoutFollowerInput[]
    deleteMany?: FollowScalarWhereInput | FollowScalarWhereInput[]
  }

  export type PasswordResetTokenUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<PasswordResetTokenCreateWithoutUserInput, PasswordResetTokenUncheckedCreateWithoutUserInput> | PasswordResetTokenCreateWithoutUserInput[] | PasswordResetTokenUncheckedCreateWithoutUserInput[]
    connectOrCreate?: PasswordResetTokenCreateOrConnectWithoutUserInput | PasswordResetTokenCreateOrConnectWithoutUserInput[]
    upsert?: PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput | PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: PasswordResetTokenCreateManyUserInputEnvelope
    set?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    disconnect?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    delete?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    connect?: PasswordResetTokenWhereUniqueInput | PasswordResetTokenWhereUniqueInput[]
    update?: PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput | PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: PasswordResetTokenUpdateManyWithWhereWithoutUserInput | PasswordResetTokenUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: PasswordResetTokenScalarWhereInput | PasswordResetTokenScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutFollowingInput = {
    create?: XOR<UserCreateWithoutFollowingInput, UserUncheckedCreateWithoutFollowingInput>
    connectOrCreate?: UserCreateOrConnectWithoutFollowingInput
    connect?: UserWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutFollowersInput = {
    create?: XOR<UserCreateWithoutFollowersInput, UserUncheckedCreateWithoutFollowersInput>
    connectOrCreate?: UserCreateOrConnectWithoutFollowersInput
    connect?: UserWhereUniqueInput
  }

  export type EnumFollowStatusFieldUpdateOperationsInput = {
    set?: $Enums.FollowStatus
  }

  export type UserUpdateOneRequiredWithoutFollowingNestedInput = {
    create?: XOR<UserCreateWithoutFollowingInput, UserUncheckedCreateWithoutFollowingInput>
    connectOrCreate?: UserCreateOrConnectWithoutFollowingInput
    upsert?: UserUpsertWithoutFollowingInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutFollowingInput, UserUpdateWithoutFollowingInput>, UserUncheckedUpdateWithoutFollowingInput>
  }

  export type UserUpdateOneRequiredWithoutFollowersNestedInput = {
    create?: XOR<UserCreateWithoutFollowersInput, UserUncheckedCreateWithoutFollowersInput>
    connectOrCreate?: UserCreateOrConnectWithoutFollowersInput
    upsert?: UserUpsertWithoutFollowersInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutFollowersInput, UserUpdateWithoutFollowersInput>, UserUncheckedUpdateWithoutFollowersInput>
  }

  export type UserCreateNestedOneWithoutPasswordResetTokensInput = {
    create?: XOR<UserCreateWithoutPasswordResetTokensInput, UserUncheckedCreateWithoutPasswordResetTokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutPasswordResetTokensInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutPasswordResetTokensNestedInput = {
    create?: XOR<UserCreateWithoutPasswordResetTokensInput, UserUncheckedCreateWithoutPasswordResetTokensInput>
    connectOrCreate?: UserCreateOrConnectWithoutPasswordResetTokensInput
    upsert?: UserUpsertWithoutPasswordResetTokensInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPasswordResetTokensInput, UserUpdateWithoutPasswordResetTokensInput>, UserUncheckedUpdateWithoutPasswordResetTokensInput>
  }

  export type SpotCreatecolorsInput = {
    set: string[]
  }

  export type SpotCreatecompositionsInput = {
    set: $Enums.CompositionType[]
  }

  export type SpotCreatetagsInput = {
    set: string[]
  }

  export type UserCreateNestedOneWithoutSpotsInput = {
    create?: XOR<UserCreateWithoutSpotsInput, UserUncheckedCreateWithoutSpotsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSpotsInput
    connect?: UserWhereUniqueInput
  }

  export type SpotPhotoCreateNestedManyWithoutSpotInput = {
    create?: XOR<SpotPhotoCreateWithoutSpotInput, SpotPhotoUncheckedCreateWithoutSpotInput> | SpotPhotoCreateWithoutSpotInput[] | SpotPhotoUncheckedCreateWithoutSpotInput[]
    connectOrCreate?: SpotPhotoCreateOrConnectWithoutSpotInput | SpotPhotoCreateOrConnectWithoutSpotInput[]
    createMany?: SpotPhotoCreateManySpotInputEnvelope
    connect?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
  }

  export type SpotImageCreateNestedManyWithoutSpotInput = {
    create?: XOR<SpotImageCreateWithoutSpotInput, SpotImageUncheckedCreateWithoutSpotInput> | SpotImageCreateWithoutSpotInput[] | SpotImageUncheckedCreateWithoutSpotInput[]
    connectOrCreate?: SpotImageCreateOrConnectWithoutSpotInput | SpotImageCreateOrConnectWithoutSpotInput[]
    createMany?: SpotImageCreateManySpotInputEnvelope
    connect?: SpotImageWhereUniqueInput | SpotImageWhereUniqueInput[]
  }

  export type SpotPhotoUncheckedCreateNestedManyWithoutSpotInput = {
    create?: XOR<SpotPhotoCreateWithoutSpotInput, SpotPhotoUncheckedCreateWithoutSpotInput> | SpotPhotoCreateWithoutSpotInput[] | SpotPhotoUncheckedCreateWithoutSpotInput[]
    connectOrCreate?: SpotPhotoCreateOrConnectWithoutSpotInput | SpotPhotoCreateOrConnectWithoutSpotInput[]
    createMany?: SpotPhotoCreateManySpotInputEnvelope
    connect?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
  }

  export type SpotImageUncheckedCreateNestedManyWithoutSpotInput = {
    create?: XOR<SpotImageCreateWithoutSpotInput, SpotImageUncheckedCreateWithoutSpotInput> | SpotImageCreateWithoutSpotInput[] | SpotImageUncheckedCreateWithoutSpotInput[]
    connectOrCreate?: SpotImageCreateOrConnectWithoutSpotInput | SpotImageCreateOrConnectWithoutSpotInput[]
    createMany?: SpotImageCreateManySpotInputEnvelope
    connect?: SpotImageWhereUniqueInput | SpotImageWhereUniqueInput[]
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumSpotVisibilityFieldUpdateOperationsInput = {
    set?: $Enums.SpotVisibility
  }

  export type SpotUpdatecolorsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type SpotUpdatecompositionsInput = {
    set?: $Enums.CompositionType[]
    push?: $Enums.CompositionType | $Enums.CompositionType[]
  }

  export type SpotUpdatetagsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type UserUpdateOneRequiredWithoutSpotsNestedInput = {
    create?: XOR<UserCreateWithoutSpotsInput, UserUncheckedCreateWithoutSpotsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSpotsInput
    upsert?: UserUpsertWithoutSpotsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSpotsInput, UserUpdateWithoutSpotsInput>, UserUncheckedUpdateWithoutSpotsInput>
  }

  export type SpotPhotoUpdateManyWithoutSpotNestedInput = {
    create?: XOR<SpotPhotoCreateWithoutSpotInput, SpotPhotoUncheckedCreateWithoutSpotInput> | SpotPhotoCreateWithoutSpotInput[] | SpotPhotoUncheckedCreateWithoutSpotInput[]
    connectOrCreate?: SpotPhotoCreateOrConnectWithoutSpotInput | SpotPhotoCreateOrConnectWithoutSpotInput[]
    upsert?: SpotPhotoUpsertWithWhereUniqueWithoutSpotInput | SpotPhotoUpsertWithWhereUniqueWithoutSpotInput[]
    createMany?: SpotPhotoCreateManySpotInputEnvelope
    set?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    disconnect?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    delete?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    connect?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    update?: SpotPhotoUpdateWithWhereUniqueWithoutSpotInput | SpotPhotoUpdateWithWhereUniqueWithoutSpotInput[]
    updateMany?: SpotPhotoUpdateManyWithWhereWithoutSpotInput | SpotPhotoUpdateManyWithWhereWithoutSpotInput[]
    deleteMany?: SpotPhotoScalarWhereInput | SpotPhotoScalarWhereInput[]
  }

  export type SpotImageUpdateManyWithoutSpotNestedInput = {
    create?: XOR<SpotImageCreateWithoutSpotInput, SpotImageUncheckedCreateWithoutSpotInput> | SpotImageCreateWithoutSpotInput[] | SpotImageUncheckedCreateWithoutSpotInput[]
    connectOrCreate?: SpotImageCreateOrConnectWithoutSpotInput | SpotImageCreateOrConnectWithoutSpotInput[]
    upsert?: SpotImageUpsertWithWhereUniqueWithoutSpotInput | SpotImageUpsertWithWhereUniqueWithoutSpotInput[]
    createMany?: SpotImageCreateManySpotInputEnvelope
    set?: SpotImageWhereUniqueInput | SpotImageWhereUniqueInput[]
    disconnect?: SpotImageWhereUniqueInput | SpotImageWhereUniqueInput[]
    delete?: SpotImageWhereUniqueInput | SpotImageWhereUniqueInput[]
    connect?: SpotImageWhereUniqueInput | SpotImageWhereUniqueInput[]
    update?: SpotImageUpdateWithWhereUniqueWithoutSpotInput | SpotImageUpdateWithWhereUniqueWithoutSpotInput[]
    updateMany?: SpotImageUpdateManyWithWhereWithoutSpotInput | SpotImageUpdateManyWithWhereWithoutSpotInput[]
    deleteMany?: SpotImageScalarWhereInput | SpotImageScalarWhereInput[]
  }

  export type SpotPhotoUncheckedUpdateManyWithoutSpotNestedInput = {
    create?: XOR<SpotPhotoCreateWithoutSpotInput, SpotPhotoUncheckedCreateWithoutSpotInput> | SpotPhotoCreateWithoutSpotInput[] | SpotPhotoUncheckedCreateWithoutSpotInput[]
    connectOrCreate?: SpotPhotoCreateOrConnectWithoutSpotInput | SpotPhotoCreateOrConnectWithoutSpotInput[]
    upsert?: SpotPhotoUpsertWithWhereUniqueWithoutSpotInput | SpotPhotoUpsertWithWhereUniqueWithoutSpotInput[]
    createMany?: SpotPhotoCreateManySpotInputEnvelope
    set?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    disconnect?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    delete?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    connect?: SpotPhotoWhereUniqueInput | SpotPhotoWhereUniqueInput[]
    update?: SpotPhotoUpdateWithWhereUniqueWithoutSpotInput | SpotPhotoUpdateWithWhereUniqueWithoutSpotInput[]
    updateMany?: SpotPhotoUpdateManyWithWhereWithoutSpotInput | SpotPhotoUpdateManyWithWhereWithoutSpotInput[]
    deleteMany?: SpotPhotoScalarWhereInput | SpotPhotoScalarWhereInput[]
  }

  export type SpotImageUncheckedUpdateManyWithoutSpotNestedInput = {
    create?: XOR<SpotImageCreateWithoutSpotInput, SpotImageUncheckedCreateWithoutSpotInput> | SpotImageCreateWithoutSpotInput[] | SpotImageUncheckedCreateWithoutSpotInput[]
    connectOrCreate?: SpotImageCreateOrConnectWithoutSpotInput | SpotImageCreateOrConnectWithoutSpotInput[]
    upsert?: SpotImageUpsertWithWhereUniqueWithoutSpotInput | SpotImageUpsertWithWhereUniqueWithoutSpotInput[]
    createMany?: SpotImageCreateManySpotInputEnvelope
    set?: SpotImageWhereUniqueInput | SpotImageWhereUniqueInput[]
    disconnect?: SpotImageWhereUniqueInput | SpotImageWhereUniqueInput[]
    delete?: SpotImageWhereUniqueInput | SpotImageWhereUniqueInput[]
    connect?: SpotImageWhereUniqueInput | SpotImageWhereUniqueInput[]
    update?: SpotImageUpdateWithWhereUniqueWithoutSpotInput | SpotImageUpdateWithWhereUniqueWithoutSpotInput[]
    updateMany?: SpotImageUpdateManyWithWhereWithoutSpotInput | SpotImageUpdateManyWithWhereWithoutSpotInput[]
    deleteMany?: SpotImageScalarWhereInput | SpotImageScalarWhereInput[]
  }

  export type SpotCreateNestedOneWithoutImagesInput = {
    create?: XOR<SpotCreateWithoutImagesInput, SpotUncheckedCreateWithoutImagesInput>
    connectOrCreate?: SpotCreateOrConnectWithoutImagesInput
    connect?: SpotWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type SpotUpdateOneRequiredWithoutImagesNestedInput = {
    create?: XOR<SpotCreateWithoutImagesInput, SpotUncheckedCreateWithoutImagesInput>
    connectOrCreate?: SpotCreateOrConnectWithoutImagesInput
    upsert?: SpotUpsertWithoutImagesInput
    connect?: SpotWhereUniqueInput
    update?: XOR<XOR<SpotUpdateToOneWithWhereWithoutImagesInput, SpotUpdateWithoutImagesInput>, SpotUncheckedUpdateWithoutImagesInput>
  }

  export type SpotCreateNestedOneWithoutSpotPhotosInput = {
    create?: XOR<SpotCreateWithoutSpotPhotosInput, SpotUncheckedCreateWithoutSpotPhotosInput>
    connectOrCreate?: SpotCreateOrConnectWithoutSpotPhotosInput
    connect?: SpotWhereUniqueInput
  }

  export type UserCreateNestedOneWithoutSpotPhotosInput = {
    create?: XOR<UserCreateWithoutSpotPhotosInput, UserUncheckedCreateWithoutSpotPhotosInput>
    connectOrCreate?: UserCreateOrConnectWithoutSpotPhotosInput
    connect?: UserWhereUniqueInput
  }

  export type SpotUpdateOneRequiredWithoutSpotPhotosNestedInput = {
    create?: XOR<SpotCreateWithoutSpotPhotosInput, SpotUncheckedCreateWithoutSpotPhotosInput>
    connectOrCreate?: SpotCreateOrConnectWithoutSpotPhotosInput
    upsert?: SpotUpsertWithoutSpotPhotosInput
    connect?: SpotWhereUniqueInput
    update?: XOR<XOR<SpotUpdateToOneWithWhereWithoutSpotPhotosInput, SpotUpdateWithoutSpotPhotosInput>, SpotUncheckedUpdateWithoutSpotPhotosInput>
  }

  export type UserUpdateOneRequiredWithoutSpotPhotosNestedInput = {
    create?: XOR<UserCreateWithoutSpotPhotosInput, UserUncheckedCreateWithoutSpotPhotosInput>
    connectOrCreate?: UserCreateOrConnectWithoutSpotPhotosInput
    upsert?: UserUpsertWithoutSpotPhotosInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSpotPhotosInput, UserUpdateWithoutSpotPhotosInput>, UserUncheckedUpdateWithoutSpotPhotosInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumAuthProviderFilter<$PrismaModel = never> = {
    equals?: $Enums.AuthProvider | EnumAuthProviderFieldRefInput<$PrismaModel>
    in?: $Enums.AuthProvider[] | ListEnumAuthProviderFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuthProvider[] | ListEnumAuthProviderFieldRefInput<$PrismaModel>
    not?: NestedEnumAuthProviderFilter<$PrismaModel> | $Enums.AuthProvider
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumAuthProviderWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AuthProvider | EnumAuthProviderFieldRefInput<$PrismaModel>
    in?: $Enums.AuthProvider[] | ListEnumAuthProviderFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuthProvider[] | ListEnumAuthProviderFieldRefInput<$PrismaModel>
    not?: NestedEnumAuthProviderWithAggregatesFilter<$PrismaModel> | $Enums.AuthProvider
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAuthProviderFilter<$PrismaModel>
    _max?: NestedEnumAuthProviderFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumFollowStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.FollowStatus | EnumFollowStatusFieldRefInput<$PrismaModel>
    in?: $Enums.FollowStatus[] | ListEnumFollowStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.FollowStatus[] | ListEnumFollowStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumFollowStatusFilter<$PrismaModel> | $Enums.FollowStatus
  }

  export type NestedEnumFollowStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FollowStatus | EnumFollowStatusFieldRefInput<$PrismaModel>
    in?: $Enums.FollowStatus[] | ListEnumFollowStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.FollowStatus[] | ListEnumFollowStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumFollowStatusWithAggregatesFilter<$PrismaModel> | $Enums.FollowStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFollowStatusFilter<$PrismaModel>
    _max?: NestedEnumFollowStatusFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumSpotVisibilityFilter<$PrismaModel = never> = {
    equals?: $Enums.SpotVisibility | EnumSpotVisibilityFieldRefInput<$PrismaModel>
    in?: $Enums.SpotVisibility[] | ListEnumSpotVisibilityFieldRefInput<$PrismaModel>
    notIn?: $Enums.SpotVisibility[] | ListEnumSpotVisibilityFieldRefInput<$PrismaModel>
    not?: NestedEnumSpotVisibilityFilter<$PrismaModel> | $Enums.SpotVisibility
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedEnumSpotVisibilityWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SpotVisibility | EnumSpotVisibilityFieldRefInput<$PrismaModel>
    in?: $Enums.SpotVisibility[] | ListEnumSpotVisibilityFieldRefInput<$PrismaModel>
    notIn?: $Enums.SpotVisibility[] | ListEnumSpotVisibilityFieldRefInput<$PrismaModel>
    not?: NestedEnumSpotVisibilityWithAggregatesFilter<$PrismaModel> | $Enums.SpotVisibility
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSpotVisibilityFilter<$PrismaModel>
    _max?: NestedEnumSpotVisibilityFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type SpotCreateWithoutUserInput = {
    id?: string
    latitude: number
    longitude: number
    address?: string | null
    city?: string | null
    country?: string | null
    photoUrl: string
    photoKey: string
    title?: string | null
    description?: string | null
    isFree?: boolean
    priceInfo?: string | null
    visibility?: $Enums.SpotVisibility
    customComposition?: string | null
    colors?: SpotCreatecolorsInput | string[]
    compositions?: SpotCreatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    spotPhotos?: SpotPhotoCreateNestedManyWithoutSpotInput
    images?: SpotImageCreateNestedManyWithoutSpotInput
  }

  export type SpotUncheckedCreateWithoutUserInput = {
    id?: string
    latitude: number
    longitude: number
    address?: string | null
    city?: string | null
    country?: string | null
    photoUrl: string
    photoKey: string
    title?: string | null
    description?: string | null
    isFree?: boolean
    priceInfo?: string | null
    visibility?: $Enums.SpotVisibility
    customComposition?: string | null
    colors?: SpotCreatecolorsInput | string[]
    compositions?: SpotCreatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    spotPhotos?: SpotPhotoUncheckedCreateNestedManyWithoutSpotInput
    images?: SpotImageUncheckedCreateNestedManyWithoutSpotInput
  }

  export type SpotCreateOrConnectWithoutUserInput = {
    where: SpotWhereUniqueInput
    create: XOR<SpotCreateWithoutUserInput, SpotUncheckedCreateWithoutUserInput>
  }

  export type SpotCreateManyUserInputEnvelope = {
    data: SpotCreateManyUserInput | SpotCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SpotPhotoCreateWithoutUserInput = {
    id?: string
    photoUrl: string
    photoKey: string
    caption?: string | null
    createdAt?: Date | string
    spot: SpotCreateNestedOneWithoutSpotPhotosInput
  }

  export type SpotPhotoUncheckedCreateWithoutUserInput = {
    id?: string
    spotId: string
    photoUrl: string
    photoKey: string
    caption?: string | null
    createdAt?: Date | string
  }

  export type SpotPhotoCreateOrConnectWithoutUserInput = {
    where: SpotPhotoWhereUniqueInput
    create: XOR<SpotPhotoCreateWithoutUserInput, SpotPhotoUncheckedCreateWithoutUserInput>
  }

  export type SpotPhotoCreateManyUserInputEnvelope = {
    data: SpotPhotoCreateManyUserInput | SpotPhotoCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type FollowCreateWithoutFollowingInput = {
    id?: string
    status?: $Enums.FollowStatus
    createdAt?: Date | string
    follower: UserCreateNestedOneWithoutFollowingInput
  }

  export type FollowUncheckedCreateWithoutFollowingInput = {
    id?: string
    followerId: string
    status?: $Enums.FollowStatus
    createdAt?: Date | string
  }

  export type FollowCreateOrConnectWithoutFollowingInput = {
    where: FollowWhereUniqueInput
    create: XOR<FollowCreateWithoutFollowingInput, FollowUncheckedCreateWithoutFollowingInput>
  }

  export type FollowCreateManyFollowingInputEnvelope = {
    data: FollowCreateManyFollowingInput | FollowCreateManyFollowingInput[]
    skipDuplicates?: boolean
  }

  export type FollowCreateWithoutFollowerInput = {
    id?: string
    status?: $Enums.FollowStatus
    createdAt?: Date | string
    following: UserCreateNestedOneWithoutFollowersInput
  }

  export type FollowUncheckedCreateWithoutFollowerInput = {
    id?: string
    followingId: string
    status?: $Enums.FollowStatus
    createdAt?: Date | string
  }

  export type FollowCreateOrConnectWithoutFollowerInput = {
    where: FollowWhereUniqueInput
    create: XOR<FollowCreateWithoutFollowerInput, FollowUncheckedCreateWithoutFollowerInput>
  }

  export type FollowCreateManyFollowerInputEnvelope = {
    data: FollowCreateManyFollowerInput | FollowCreateManyFollowerInput[]
    skipDuplicates?: boolean
  }

  export type PasswordResetTokenCreateWithoutUserInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type PasswordResetTokenUncheckedCreateWithoutUserInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type PasswordResetTokenCreateOrConnectWithoutUserInput = {
    where: PasswordResetTokenWhereUniqueInput
    create: XOR<PasswordResetTokenCreateWithoutUserInput, PasswordResetTokenUncheckedCreateWithoutUserInput>
  }

  export type PasswordResetTokenCreateManyUserInputEnvelope = {
    data: PasswordResetTokenCreateManyUserInput | PasswordResetTokenCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SpotUpsertWithWhereUniqueWithoutUserInput = {
    where: SpotWhereUniqueInput
    update: XOR<SpotUpdateWithoutUserInput, SpotUncheckedUpdateWithoutUserInput>
    create: XOR<SpotCreateWithoutUserInput, SpotUncheckedCreateWithoutUserInput>
  }

  export type SpotUpdateWithWhereUniqueWithoutUserInput = {
    where: SpotWhereUniqueInput
    data: XOR<SpotUpdateWithoutUserInput, SpotUncheckedUpdateWithoutUserInput>
  }

  export type SpotUpdateManyWithWhereWithoutUserInput = {
    where: SpotScalarWhereInput
    data: XOR<SpotUpdateManyMutationInput, SpotUncheckedUpdateManyWithoutUserInput>
  }

  export type SpotScalarWhereInput = {
    AND?: SpotScalarWhereInput | SpotScalarWhereInput[]
    OR?: SpotScalarWhereInput[]
    NOT?: SpotScalarWhereInput | SpotScalarWhereInput[]
    id?: StringFilter<"Spot"> | string
    userId?: StringFilter<"Spot"> | string
    latitude?: FloatFilter<"Spot"> | number
    longitude?: FloatFilter<"Spot"> | number
    address?: StringNullableFilter<"Spot"> | string | null
    city?: StringNullableFilter<"Spot"> | string | null
    country?: StringNullableFilter<"Spot"> | string | null
    photoUrl?: StringFilter<"Spot"> | string
    photoKey?: StringFilter<"Spot"> | string
    title?: StringNullableFilter<"Spot"> | string | null
    description?: StringNullableFilter<"Spot"> | string | null
    isFree?: BoolFilter<"Spot"> | boolean
    priceInfo?: StringNullableFilter<"Spot"> | string | null
    visibility?: EnumSpotVisibilityFilter<"Spot"> | $Enums.SpotVisibility
    customComposition?: StringNullableFilter<"Spot"> | string | null
    colors?: StringNullableListFilter<"Spot">
    compositions?: EnumCompositionTypeNullableListFilter<"Spot">
    tags?: StringNullableListFilter<"Spot">
    createdAt?: DateTimeFilter<"Spot"> | Date | string
    updatedAt?: DateTimeFilter<"Spot"> | Date | string
  }

  export type SpotPhotoUpsertWithWhereUniqueWithoutUserInput = {
    where: SpotPhotoWhereUniqueInput
    update: XOR<SpotPhotoUpdateWithoutUserInput, SpotPhotoUncheckedUpdateWithoutUserInput>
    create: XOR<SpotPhotoCreateWithoutUserInput, SpotPhotoUncheckedCreateWithoutUserInput>
  }

  export type SpotPhotoUpdateWithWhereUniqueWithoutUserInput = {
    where: SpotPhotoWhereUniqueInput
    data: XOR<SpotPhotoUpdateWithoutUserInput, SpotPhotoUncheckedUpdateWithoutUserInput>
  }

  export type SpotPhotoUpdateManyWithWhereWithoutUserInput = {
    where: SpotPhotoScalarWhereInput
    data: XOR<SpotPhotoUpdateManyMutationInput, SpotPhotoUncheckedUpdateManyWithoutUserInput>
  }

  export type SpotPhotoScalarWhereInput = {
    AND?: SpotPhotoScalarWhereInput | SpotPhotoScalarWhereInput[]
    OR?: SpotPhotoScalarWhereInput[]
    NOT?: SpotPhotoScalarWhereInput | SpotPhotoScalarWhereInput[]
    id?: StringFilter<"SpotPhoto"> | string
    spotId?: StringFilter<"SpotPhoto"> | string
    userId?: StringFilter<"SpotPhoto"> | string
    photoUrl?: StringFilter<"SpotPhoto"> | string
    photoKey?: StringFilter<"SpotPhoto"> | string
    caption?: StringNullableFilter<"SpotPhoto"> | string | null
    createdAt?: DateTimeFilter<"SpotPhoto"> | Date | string
  }

  export type FollowUpsertWithWhereUniqueWithoutFollowingInput = {
    where: FollowWhereUniqueInput
    update: XOR<FollowUpdateWithoutFollowingInput, FollowUncheckedUpdateWithoutFollowingInput>
    create: XOR<FollowCreateWithoutFollowingInput, FollowUncheckedCreateWithoutFollowingInput>
  }

  export type FollowUpdateWithWhereUniqueWithoutFollowingInput = {
    where: FollowWhereUniqueInput
    data: XOR<FollowUpdateWithoutFollowingInput, FollowUncheckedUpdateWithoutFollowingInput>
  }

  export type FollowUpdateManyWithWhereWithoutFollowingInput = {
    where: FollowScalarWhereInput
    data: XOR<FollowUpdateManyMutationInput, FollowUncheckedUpdateManyWithoutFollowingInput>
  }

  export type FollowScalarWhereInput = {
    AND?: FollowScalarWhereInput | FollowScalarWhereInput[]
    OR?: FollowScalarWhereInput[]
    NOT?: FollowScalarWhereInput | FollowScalarWhereInput[]
    id?: StringFilter<"Follow"> | string
    followerId?: StringFilter<"Follow"> | string
    followingId?: StringFilter<"Follow"> | string
    status?: EnumFollowStatusFilter<"Follow"> | $Enums.FollowStatus
    createdAt?: DateTimeFilter<"Follow"> | Date | string
  }

  export type FollowUpsertWithWhereUniqueWithoutFollowerInput = {
    where: FollowWhereUniqueInput
    update: XOR<FollowUpdateWithoutFollowerInput, FollowUncheckedUpdateWithoutFollowerInput>
    create: XOR<FollowCreateWithoutFollowerInput, FollowUncheckedCreateWithoutFollowerInput>
  }

  export type FollowUpdateWithWhereUniqueWithoutFollowerInput = {
    where: FollowWhereUniqueInput
    data: XOR<FollowUpdateWithoutFollowerInput, FollowUncheckedUpdateWithoutFollowerInput>
  }

  export type FollowUpdateManyWithWhereWithoutFollowerInput = {
    where: FollowScalarWhereInput
    data: XOR<FollowUpdateManyMutationInput, FollowUncheckedUpdateManyWithoutFollowerInput>
  }

  export type PasswordResetTokenUpsertWithWhereUniqueWithoutUserInput = {
    where: PasswordResetTokenWhereUniqueInput
    update: XOR<PasswordResetTokenUpdateWithoutUserInput, PasswordResetTokenUncheckedUpdateWithoutUserInput>
    create: XOR<PasswordResetTokenCreateWithoutUserInput, PasswordResetTokenUncheckedCreateWithoutUserInput>
  }

  export type PasswordResetTokenUpdateWithWhereUniqueWithoutUserInput = {
    where: PasswordResetTokenWhereUniqueInput
    data: XOR<PasswordResetTokenUpdateWithoutUserInput, PasswordResetTokenUncheckedUpdateWithoutUserInput>
  }

  export type PasswordResetTokenUpdateManyWithWhereWithoutUserInput = {
    where: PasswordResetTokenScalarWhereInput
    data: XOR<PasswordResetTokenUpdateManyMutationInput, PasswordResetTokenUncheckedUpdateManyWithoutUserInput>
  }

  export type PasswordResetTokenScalarWhereInput = {
    AND?: PasswordResetTokenScalarWhereInput | PasswordResetTokenScalarWhereInput[]
    OR?: PasswordResetTokenScalarWhereInput[]
    NOT?: PasswordResetTokenScalarWhereInput | PasswordResetTokenScalarWhereInput[]
    id?: StringFilter<"PasswordResetToken"> | string
    token?: StringFilter<"PasswordResetToken"> | string
    userId?: StringFilter<"PasswordResetToken"> | string
    expiresAt?: DateTimeFilter<"PasswordResetToken"> | Date | string
    createdAt?: DateTimeFilter<"PasswordResetToken"> | Date | string
  }

  export type UserCreateWithoutFollowingInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    spots?: SpotCreateNestedManyWithoutUserInput
    spotPhotos?: SpotPhotoCreateNestedManyWithoutUserInput
    followers?: FollowCreateNestedManyWithoutFollowingInput
    passwordResetTokens?: PasswordResetTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutFollowingInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    spots?: SpotUncheckedCreateNestedManyWithoutUserInput
    spotPhotos?: SpotPhotoUncheckedCreateNestedManyWithoutUserInput
    followers?: FollowUncheckedCreateNestedManyWithoutFollowingInput
    passwordResetTokens?: PasswordResetTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutFollowingInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutFollowingInput, UserUncheckedCreateWithoutFollowingInput>
  }

  export type UserCreateWithoutFollowersInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    spots?: SpotCreateNestedManyWithoutUserInput
    spotPhotos?: SpotPhotoCreateNestedManyWithoutUserInput
    following?: FollowCreateNestedManyWithoutFollowerInput
    passwordResetTokens?: PasswordResetTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutFollowersInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    spots?: SpotUncheckedCreateNestedManyWithoutUserInput
    spotPhotos?: SpotPhotoUncheckedCreateNestedManyWithoutUserInput
    following?: FollowUncheckedCreateNestedManyWithoutFollowerInput
    passwordResetTokens?: PasswordResetTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutFollowersInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutFollowersInput, UserUncheckedCreateWithoutFollowersInput>
  }

  export type UserUpsertWithoutFollowingInput = {
    update: XOR<UserUpdateWithoutFollowingInput, UserUncheckedUpdateWithoutFollowingInput>
    create: XOR<UserCreateWithoutFollowingInput, UserUncheckedCreateWithoutFollowingInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutFollowingInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutFollowingInput, UserUncheckedUpdateWithoutFollowingInput>
  }

  export type UserUpdateWithoutFollowingInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spots?: SpotUpdateManyWithoutUserNestedInput
    spotPhotos?: SpotPhotoUpdateManyWithoutUserNestedInput
    followers?: FollowUpdateManyWithoutFollowingNestedInput
    passwordResetTokens?: PasswordResetTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutFollowingInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spots?: SpotUncheckedUpdateManyWithoutUserNestedInput
    spotPhotos?: SpotPhotoUncheckedUpdateManyWithoutUserNestedInput
    followers?: FollowUncheckedUpdateManyWithoutFollowingNestedInput
    passwordResetTokens?: PasswordResetTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserUpsertWithoutFollowersInput = {
    update: XOR<UserUpdateWithoutFollowersInput, UserUncheckedUpdateWithoutFollowersInput>
    create: XOR<UserCreateWithoutFollowersInput, UserUncheckedCreateWithoutFollowersInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutFollowersInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutFollowersInput, UserUncheckedUpdateWithoutFollowersInput>
  }

  export type UserUpdateWithoutFollowersInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spots?: SpotUpdateManyWithoutUserNestedInput
    spotPhotos?: SpotPhotoUpdateManyWithoutUserNestedInput
    following?: FollowUpdateManyWithoutFollowerNestedInput
    passwordResetTokens?: PasswordResetTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutFollowersInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spots?: SpotUncheckedUpdateManyWithoutUserNestedInput
    spotPhotos?: SpotPhotoUncheckedUpdateManyWithoutUserNestedInput
    following?: FollowUncheckedUpdateManyWithoutFollowerNestedInput
    passwordResetTokens?: PasswordResetTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateWithoutPasswordResetTokensInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    spots?: SpotCreateNestedManyWithoutUserInput
    spotPhotos?: SpotPhotoCreateNestedManyWithoutUserInput
    followers?: FollowCreateNestedManyWithoutFollowingInput
    following?: FollowCreateNestedManyWithoutFollowerInput
  }

  export type UserUncheckedCreateWithoutPasswordResetTokensInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    spots?: SpotUncheckedCreateNestedManyWithoutUserInput
    spotPhotos?: SpotPhotoUncheckedCreateNestedManyWithoutUserInput
    followers?: FollowUncheckedCreateNestedManyWithoutFollowingInput
    following?: FollowUncheckedCreateNestedManyWithoutFollowerInput
  }

  export type UserCreateOrConnectWithoutPasswordResetTokensInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPasswordResetTokensInput, UserUncheckedCreateWithoutPasswordResetTokensInput>
  }

  export type UserUpsertWithoutPasswordResetTokensInput = {
    update: XOR<UserUpdateWithoutPasswordResetTokensInput, UserUncheckedUpdateWithoutPasswordResetTokensInput>
    create: XOR<UserCreateWithoutPasswordResetTokensInput, UserUncheckedCreateWithoutPasswordResetTokensInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPasswordResetTokensInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPasswordResetTokensInput, UserUncheckedUpdateWithoutPasswordResetTokensInput>
  }

  export type UserUpdateWithoutPasswordResetTokensInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spots?: SpotUpdateManyWithoutUserNestedInput
    spotPhotos?: SpotPhotoUpdateManyWithoutUserNestedInput
    followers?: FollowUpdateManyWithoutFollowingNestedInput
    following?: FollowUpdateManyWithoutFollowerNestedInput
  }

  export type UserUncheckedUpdateWithoutPasswordResetTokensInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spots?: SpotUncheckedUpdateManyWithoutUserNestedInput
    spotPhotos?: SpotPhotoUncheckedUpdateManyWithoutUserNestedInput
    followers?: FollowUncheckedUpdateManyWithoutFollowingNestedInput
    following?: FollowUncheckedUpdateManyWithoutFollowerNestedInput
  }

  export type UserCreateWithoutSpotsInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    spotPhotos?: SpotPhotoCreateNestedManyWithoutUserInput
    followers?: FollowCreateNestedManyWithoutFollowingInput
    following?: FollowCreateNestedManyWithoutFollowerInput
    passwordResetTokens?: PasswordResetTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSpotsInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    spotPhotos?: SpotPhotoUncheckedCreateNestedManyWithoutUserInput
    followers?: FollowUncheckedCreateNestedManyWithoutFollowingInput
    following?: FollowUncheckedCreateNestedManyWithoutFollowerInput
    passwordResetTokens?: PasswordResetTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSpotsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSpotsInput, UserUncheckedCreateWithoutSpotsInput>
  }

  export type SpotPhotoCreateWithoutSpotInput = {
    id?: string
    photoUrl: string
    photoKey: string
    caption?: string | null
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutSpotPhotosInput
  }

  export type SpotPhotoUncheckedCreateWithoutSpotInput = {
    id?: string
    userId: string
    photoUrl: string
    photoKey: string
    caption?: string | null
    createdAt?: Date | string
  }

  export type SpotPhotoCreateOrConnectWithoutSpotInput = {
    where: SpotPhotoWhereUniqueInput
    create: XOR<SpotPhotoCreateWithoutSpotInput, SpotPhotoUncheckedCreateWithoutSpotInput>
  }

  export type SpotPhotoCreateManySpotInputEnvelope = {
    data: SpotPhotoCreateManySpotInput | SpotPhotoCreateManySpotInput[]
    skipDuplicates?: boolean
  }

  export type SpotImageCreateWithoutSpotInput = {
    id?: string
    photoUrl: string
    photoKey: string
    order?: number
  }

  export type SpotImageUncheckedCreateWithoutSpotInput = {
    id?: string
    photoUrl: string
    photoKey: string
    order?: number
  }

  export type SpotImageCreateOrConnectWithoutSpotInput = {
    where: SpotImageWhereUniqueInput
    create: XOR<SpotImageCreateWithoutSpotInput, SpotImageUncheckedCreateWithoutSpotInput>
  }

  export type SpotImageCreateManySpotInputEnvelope = {
    data: SpotImageCreateManySpotInput | SpotImageCreateManySpotInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutSpotsInput = {
    update: XOR<UserUpdateWithoutSpotsInput, UserUncheckedUpdateWithoutSpotsInput>
    create: XOR<UserCreateWithoutSpotsInput, UserUncheckedCreateWithoutSpotsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSpotsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSpotsInput, UserUncheckedUpdateWithoutSpotsInput>
  }

  export type UserUpdateWithoutSpotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spotPhotos?: SpotPhotoUpdateManyWithoutUserNestedInput
    followers?: FollowUpdateManyWithoutFollowingNestedInput
    following?: FollowUpdateManyWithoutFollowerNestedInput
    passwordResetTokens?: PasswordResetTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSpotsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spotPhotos?: SpotPhotoUncheckedUpdateManyWithoutUserNestedInput
    followers?: FollowUncheckedUpdateManyWithoutFollowingNestedInput
    following?: FollowUncheckedUpdateManyWithoutFollowerNestedInput
    passwordResetTokens?: PasswordResetTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type SpotPhotoUpsertWithWhereUniqueWithoutSpotInput = {
    where: SpotPhotoWhereUniqueInput
    update: XOR<SpotPhotoUpdateWithoutSpotInput, SpotPhotoUncheckedUpdateWithoutSpotInput>
    create: XOR<SpotPhotoCreateWithoutSpotInput, SpotPhotoUncheckedCreateWithoutSpotInput>
  }

  export type SpotPhotoUpdateWithWhereUniqueWithoutSpotInput = {
    where: SpotPhotoWhereUniqueInput
    data: XOR<SpotPhotoUpdateWithoutSpotInput, SpotPhotoUncheckedUpdateWithoutSpotInput>
  }

  export type SpotPhotoUpdateManyWithWhereWithoutSpotInput = {
    where: SpotPhotoScalarWhereInput
    data: XOR<SpotPhotoUpdateManyMutationInput, SpotPhotoUncheckedUpdateManyWithoutSpotInput>
  }

  export type SpotImageUpsertWithWhereUniqueWithoutSpotInput = {
    where: SpotImageWhereUniqueInput
    update: XOR<SpotImageUpdateWithoutSpotInput, SpotImageUncheckedUpdateWithoutSpotInput>
    create: XOR<SpotImageCreateWithoutSpotInput, SpotImageUncheckedCreateWithoutSpotInput>
  }

  export type SpotImageUpdateWithWhereUniqueWithoutSpotInput = {
    where: SpotImageWhereUniqueInput
    data: XOR<SpotImageUpdateWithoutSpotInput, SpotImageUncheckedUpdateWithoutSpotInput>
  }

  export type SpotImageUpdateManyWithWhereWithoutSpotInput = {
    where: SpotImageScalarWhereInput
    data: XOR<SpotImageUpdateManyMutationInput, SpotImageUncheckedUpdateManyWithoutSpotInput>
  }

  export type SpotImageScalarWhereInput = {
    AND?: SpotImageScalarWhereInput | SpotImageScalarWhereInput[]
    OR?: SpotImageScalarWhereInput[]
    NOT?: SpotImageScalarWhereInput | SpotImageScalarWhereInput[]
    id?: StringFilter<"SpotImage"> | string
    spotId?: StringFilter<"SpotImage"> | string
    photoUrl?: StringFilter<"SpotImage"> | string
    photoKey?: StringFilter<"SpotImage"> | string
    order?: IntFilter<"SpotImage"> | number
  }

  export type SpotCreateWithoutImagesInput = {
    id?: string
    latitude: number
    longitude: number
    address?: string | null
    city?: string | null
    country?: string | null
    photoUrl: string
    photoKey: string
    title?: string | null
    description?: string | null
    isFree?: boolean
    priceInfo?: string | null
    visibility?: $Enums.SpotVisibility
    customComposition?: string | null
    colors?: SpotCreatecolorsInput | string[]
    compositions?: SpotCreatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutSpotsInput
    spotPhotos?: SpotPhotoCreateNestedManyWithoutSpotInput
  }

  export type SpotUncheckedCreateWithoutImagesInput = {
    id?: string
    userId: string
    latitude: number
    longitude: number
    address?: string | null
    city?: string | null
    country?: string | null
    photoUrl: string
    photoKey: string
    title?: string | null
    description?: string | null
    isFree?: boolean
    priceInfo?: string | null
    visibility?: $Enums.SpotVisibility
    customComposition?: string | null
    colors?: SpotCreatecolorsInput | string[]
    compositions?: SpotCreatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    spotPhotos?: SpotPhotoUncheckedCreateNestedManyWithoutSpotInput
  }

  export type SpotCreateOrConnectWithoutImagesInput = {
    where: SpotWhereUniqueInput
    create: XOR<SpotCreateWithoutImagesInput, SpotUncheckedCreateWithoutImagesInput>
  }

  export type SpotUpsertWithoutImagesInput = {
    update: XOR<SpotUpdateWithoutImagesInput, SpotUncheckedUpdateWithoutImagesInput>
    create: XOR<SpotCreateWithoutImagesInput, SpotUncheckedCreateWithoutImagesInput>
    where?: SpotWhereInput
  }

  export type SpotUpdateToOneWithWhereWithoutImagesInput = {
    where?: SpotWhereInput
    data: XOR<SpotUpdateWithoutImagesInput, SpotUncheckedUpdateWithoutImagesInput>
  }

  export type SpotUpdateWithoutImagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isFree?: BoolFieldUpdateOperationsInput | boolean
    priceInfo?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: EnumSpotVisibilityFieldUpdateOperationsInput | $Enums.SpotVisibility
    customComposition?: NullableStringFieldUpdateOperationsInput | string | null
    colors?: SpotUpdatecolorsInput | string[]
    compositions?: SpotUpdatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSpotsNestedInput
    spotPhotos?: SpotPhotoUpdateManyWithoutSpotNestedInput
  }

  export type SpotUncheckedUpdateWithoutImagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isFree?: BoolFieldUpdateOperationsInput | boolean
    priceInfo?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: EnumSpotVisibilityFieldUpdateOperationsInput | $Enums.SpotVisibility
    customComposition?: NullableStringFieldUpdateOperationsInput | string | null
    colors?: SpotUpdatecolorsInput | string[]
    compositions?: SpotUpdatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spotPhotos?: SpotPhotoUncheckedUpdateManyWithoutSpotNestedInput
  }

  export type SpotCreateWithoutSpotPhotosInput = {
    id?: string
    latitude: number
    longitude: number
    address?: string | null
    city?: string | null
    country?: string | null
    photoUrl: string
    photoKey: string
    title?: string | null
    description?: string | null
    isFree?: boolean
    priceInfo?: string | null
    visibility?: $Enums.SpotVisibility
    customComposition?: string | null
    colors?: SpotCreatecolorsInput | string[]
    compositions?: SpotCreatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutSpotsInput
    images?: SpotImageCreateNestedManyWithoutSpotInput
  }

  export type SpotUncheckedCreateWithoutSpotPhotosInput = {
    id?: string
    userId: string
    latitude: number
    longitude: number
    address?: string | null
    city?: string | null
    country?: string | null
    photoUrl: string
    photoKey: string
    title?: string | null
    description?: string | null
    isFree?: boolean
    priceInfo?: string | null
    visibility?: $Enums.SpotVisibility
    customComposition?: string | null
    colors?: SpotCreatecolorsInput | string[]
    compositions?: SpotCreatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
    images?: SpotImageUncheckedCreateNestedManyWithoutSpotInput
  }

  export type SpotCreateOrConnectWithoutSpotPhotosInput = {
    where: SpotWhereUniqueInput
    create: XOR<SpotCreateWithoutSpotPhotosInput, SpotUncheckedCreateWithoutSpotPhotosInput>
  }

  export type UserCreateWithoutSpotPhotosInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    spots?: SpotCreateNestedManyWithoutUserInput
    followers?: FollowCreateNestedManyWithoutFollowingInput
    following?: FollowCreateNestedManyWithoutFollowerInput
    passwordResetTokens?: PasswordResetTokenCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSpotPhotosInput = {
    id?: string
    email: string
    passwordHash?: string | null
    provider?: $Enums.AuthProvider
    providerId?: string | null
    username: string
    name: string
    avatarUrl?: string | null
    bio?: string | null
    locale?: string
    isPrivate?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    spots?: SpotUncheckedCreateNestedManyWithoutUserInput
    followers?: FollowUncheckedCreateNestedManyWithoutFollowingInput
    following?: FollowUncheckedCreateNestedManyWithoutFollowerInput
    passwordResetTokens?: PasswordResetTokenUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSpotPhotosInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSpotPhotosInput, UserUncheckedCreateWithoutSpotPhotosInput>
  }

  export type SpotUpsertWithoutSpotPhotosInput = {
    update: XOR<SpotUpdateWithoutSpotPhotosInput, SpotUncheckedUpdateWithoutSpotPhotosInput>
    create: XOR<SpotCreateWithoutSpotPhotosInput, SpotUncheckedCreateWithoutSpotPhotosInput>
    where?: SpotWhereInput
  }

  export type SpotUpdateToOneWithWhereWithoutSpotPhotosInput = {
    where?: SpotWhereInput
    data: XOR<SpotUpdateWithoutSpotPhotosInput, SpotUncheckedUpdateWithoutSpotPhotosInput>
  }

  export type SpotUpdateWithoutSpotPhotosInput = {
    id?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isFree?: BoolFieldUpdateOperationsInput | boolean
    priceInfo?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: EnumSpotVisibilityFieldUpdateOperationsInput | $Enums.SpotVisibility
    customComposition?: NullableStringFieldUpdateOperationsInput | string | null
    colors?: SpotUpdatecolorsInput | string[]
    compositions?: SpotUpdatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSpotsNestedInput
    images?: SpotImageUpdateManyWithoutSpotNestedInput
  }

  export type SpotUncheckedUpdateWithoutSpotPhotosInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isFree?: BoolFieldUpdateOperationsInput | boolean
    priceInfo?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: EnumSpotVisibilityFieldUpdateOperationsInput | $Enums.SpotVisibility
    customComposition?: NullableStringFieldUpdateOperationsInput | string | null
    colors?: SpotUpdatecolorsInput | string[]
    compositions?: SpotUpdatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    images?: SpotImageUncheckedUpdateManyWithoutSpotNestedInput
  }

  export type UserUpsertWithoutSpotPhotosInput = {
    update: XOR<UserUpdateWithoutSpotPhotosInput, UserUncheckedUpdateWithoutSpotPhotosInput>
    create: XOR<UserCreateWithoutSpotPhotosInput, UserUncheckedCreateWithoutSpotPhotosInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSpotPhotosInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSpotPhotosInput, UserUncheckedUpdateWithoutSpotPhotosInput>
  }

  export type UserUpdateWithoutSpotPhotosInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spots?: SpotUpdateManyWithoutUserNestedInput
    followers?: FollowUpdateManyWithoutFollowingNestedInput
    following?: FollowUpdateManyWithoutFollowerNestedInput
    passwordResetTokens?: PasswordResetTokenUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSpotPhotosInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: EnumAuthProviderFieldUpdateOperationsInput | $Enums.AuthProvider
    providerId?: NullableStringFieldUpdateOperationsInput | string | null
    username?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    avatarUrl?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    locale?: StringFieldUpdateOperationsInput | string
    isPrivate?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spots?: SpotUncheckedUpdateManyWithoutUserNestedInput
    followers?: FollowUncheckedUpdateManyWithoutFollowingNestedInput
    following?: FollowUncheckedUpdateManyWithoutFollowerNestedInput
    passwordResetTokens?: PasswordResetTokenUncheckedUpdateManyWithoutUserNestedInput
  }

  export type SpotCreateManyUserInput = {
    id?: string
    latitude: number
    longitude: number
    address?: string | null
    city?: string | null
    country?: string | null
    photoUrl: string
    photoKey: string
    title?: string | null
    description?: string | null
    isFree?: boolean
    priceInfo?: string | null
    visibility?: $Enums.SpotVisibility
    customComposition?: string | null
    colors?: SpotCreatecolorsInput | string[]
    compositions?: SpotCreatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotCreatetagsInput | string[]
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SpotPhotoCreateManyUserInput = {
    id?: string
    spotId: string
    photoUrl: string
    photoKey: string
    caption?: string | null
    createdAt?: Date | string
  }

  export type FollowCreateManyFollowingInput = {
    id?: string
    followerId: string
    status?: $Enums.FollowStatus
    createdAt?: Date | string
  }

  export type FollowCreateManyFollowerInput = {
    id?: string
    followingId: string
    status?: $Enums.FollowStatus
    createdAt?: Date | string
  }

  export type PasswordResetTokenCreateManyUserInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type SpotUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isFree?: BoolFieldUpdateOperationsInput | boolean
    priceInfo?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: EnumSpotVisibilityFieldUpdateOperationsInput | $Enums.SpotVisibility
    customComposition?: NullableStringFieldUpdateOperationsInput | string | null
    colors?: SpotUpdatecolorsInput | string[]
    compositions?: SpotUpdatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spotPhotos?: SpotPhotoUpdateManyWithoutSpotNestedInput
    images?: SpotImageUpdateManyWithoutSpotNestedInput
  }

  export type SpotUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isFree?: BoolFieldUpdateOperationsInput | boolean
    priceInfo?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: EnumSpotVisibilityFieldUpdateOperationsInput | $Enums.SpotVisibility
    customComposition?: NullableStringFieldUpdateOperationsInput | string | null
    colors?: SpotUpdatecolorsInput | string[]
    compositions?: SpotUpdatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spotPhotos?: SpotPhotoUncheckedUpdateManyWithoutSpotNestedInput
    images?: SpotImageUncheckedUpdateManyWithoutSpotNestedInput
  }

  export type SpotUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    latitude?: FloatFieldUpdateOperationsInput | number
    longitude?: FloatFieldUpdateOperationsInput | number
    address?: NullableStringFieldUpdateOperationsInput | string | null
    city?: NullableStringFieldUpdateOperationsInput | string | null
    country?: NullableStringFieldUpdateOperationsInput | string | null
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    title?: NullableStringFieldUpdateOperationsInput | string | null
    description?: NullableStringFieldUpdateOperationsInput | string | null
    isFree?: BoolFieldUpdateOperationsInput | boolean
    priceInfo?: NullableStringFieldUpdateOperationsInput | string | null
    visibility?: EnumSpotVisibilityFieldUpdateOperationsInput | $Enums.SpotVisibility
    customComposition?: NullableStringFieldUpdateOperationsInput | string | null
    colors?: SpotUpdatecolorsInput | string[]
    compositions?: SpotUpdatecompositionsInput | $Enums.CompositionType[]
    tags?: SpotUpdatetagsInput | string[]
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpotPhotoUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    spot?: SpotUpdateOneRequiredWithoutSpotPhotosNestedInput
  }

  export type SpotPhotoUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotId?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpotPhotoUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    spotId?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FollowUpdateWithoutFollowingInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumFollowStatusFieldUpdateOperationsInput | $Enums.FollowStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    follower?: UserUpdateOneRequiredWithoutFollowingNestedInput
  }

  export type FollowUncheckedUpdateWithoutFollowingInput = {
    id?: StringFieldUpdateOperationsInput | string
    followerId?: StringFieldUpdateOperationsInput | string
    status?: EnumFollowStatusFieldUpdateOperationsInput | $Enums.FollowStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FollowUncheckedUpdateManyWithoutFollowingInput = {
    id?: StringFieldUpdateOperationsInput | string
    followerId?: StringFieldUpdateOperationsInput | string
    status?: EnumFollowStatusFieldUpdateOperationsInput | $Enums.FollowStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FollowUpdateWithoutFollowerInput = {
    id?: StringFieldUpdateOperationsInput | string
    status?: EnumFollowStatusFieldUpdateOperationsInput | $Enums.FollowStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    following?: UserUpdateOneRequiredWithoutFollowersNestedInput
  }

  export type FollowUncheckedUpdateWithoutFollowerInput = {
    id?: StringFieldUpdateOperationsInput | string
    followingId?: StringFieldUpdateOperationsInput | string
    status?: EnumFollowStatusFieldUpdateOperationsInput | $Enums.FollowStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FollowUncheckedUpdateManyWithoutFollowerInput = {
    id?: StringFieldUpdateOperationsInput | string
    followingId?: StringFieldUpdateOperationsInput | string
    status?: EnumFollowStatusFieldUpdateOperationsInput | $Enums.FollowStatus
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetTokenUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetTokenUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PasswordResetTokenUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpotPhotoCreateManySpotInput = {
    id?: string
    userId: string
    photoUrl: string
    photoKey: string
    caption?: string | null
    createdAt?: Date | string
  }

  export type SpotImageCreateManySpotInput = {
    id?: string
    photoUrl: string
    photoKey: string
    order?: number
  }

  export type SpotPhotoUpdateWithoutSpotInput = {
    id?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSpotPhotosNestedInput
  }

  export type SpotPhotoUncheckedUpdateWithoutSpotInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpotPhotoUncheckedUpdateManyWithoutSpotInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    caption?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpotImageUpdateWithoutSpotInput = {
    id?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
  }

  export type SpotImageUncheckedUpdateWithoutSpotInput = {
    id?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
  }

  export type SpotImageUncheckedUpdateManyWithoutSpotInput = {
    id?: StringFieldUpdateOperationsInput | string
    photoUrl?: StringFieldUpdateOperationsInput | string
    photoKey?: StringFieldUpdateOperationsInput | string
    order?: IntFieldUpdateOperationsInput | number
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}

import Observable from 'any-observable';
import { Dictionary } from 'lodash';
import { AuthToken, Config, Driver, Session } from 'neo4j-driver/types/v1';
import { Transformer } from './transformer';
import { Query } from './query';
import neo4j from 'neo4j-driver/lib/browser/neo4j-web';
import { Builder } from './builder';
import { Clause } from './clause';
export interface Observer<T> {
    closed?: boolean;
    next: (value: T) => void;
    error: (error: any) => void;
    complete: () => void;
}
export declare type DriverConstructor = typeof neo4j.driver;
export interface FullConnectionOptions {
    driverConstructor: DriverConstructor;
    driverConfig: Config;
}
export declare type ConnectionOptions = Partial<FullConnectionOptions>;
export interface Credentials {
    username: string;
    password: string;
}
/**
 * The Connection class lets you access the Neo4j server and run queries against it. Under the hood,
 * the Connection class uses the official Neo4j Nodejs driver which manages connection pooling on a
 * [session basis]{@link https://neo4j.com/docs/api/javascript-driver/current/class/src/v1/driver.js~Driver.html#instance-method-session}.
 * It should be enough to have a single Connection instance per database per application.
 *
 * To create the connection, simply call the
 * [constructor]{@link https://jamesfer.me/cypher-query-builder/classes/connection.html#constructor}
 * and pass in the database url, username and password.
 * ```
 * const db = new Connection('bolt://localhost', {
 *   username: 'neo4j',
 *   password: 'password',
 * })
 * ```
 *
 * To use the connection, just start calling any of the clause methods such as `match`, `create` or
 * `matchNode` etc. They automatically create a {@link Query} object that you can then chain other
 * methods off of.
 * ```
 * db.matchNode('people', 'Person')
 *   .where({ 'people.age': greaterThan(18) })
 *   .return('people')
 *   .run()
 * ```
 *
 * You can also pass a query to the
 * [run]{@link https://jamesfer.me/cypher-query-builder/classes/connection.html#run} method,
 * however, this is probably much less convenient.
 * ```
 * db.run(
 *   new Query().matchNode('people', 'Person')
 *     .where({ 'people.age': greaterThan(18) })
 *     .return('people')
 *     .run()
 * );
 * ```
 *
 * Once you've finished with the connection you should close the connection.
 * ```
 * db.close()
 * ```
 *
 * The library will attempt to clean up all connections when the process exits, but it is better to
 * be explicit.
 */
export declare class Connection extends Builder<Query> {
    protected url: string;
    protected auth: AuthToken;
    protected driver: Driver;
    protected options: FullConnectionOptions;
    protected open: boolean;
    protected transformer: Transformer;
    /**
     * Creates a new connection to the database.
     *
     * @param url Url of the database such as `'bolt://localhost'`
     * @param auth Auth can either be an object in the form `{ username: ..., password: ... }`, or a
     * Neo4j AuthToken object which contains the `scheme`, `principal` and `credentials` properties
     * for more advanced authentication scenarios. The AuthToken object is what is passed directly to
     * the neo4j javascript driver so checkout their docs for more information on it.
     * @param options Additional configuration options. If you provide a function instead of an
     * object, it will be used as the driver constructor. While passing a driver constructor function
     * here is not deprecated, it is the legacy way of setting it and you should prefer to pass an
     * options object with the `driverConstructor` parameter.
     * @param options.driverConstructor An optional driver constructor to use for
     * this connection. Defaults to the official Neo4j driver. The constructor is
     * given the url you pass to this constructor and an auth token that is
     * generated from calling [`neo4j.auth.basic`]{@link
     * https://neo4j.com/docs/api/javascript-driver/current#usage-examples}.
     * @param options.driverConfig Neo4j options that are passed directly to the underlying driver.
     */
    constructor(url: string, auth: Credentials | AuthToken, options?: DriverConstructor | ConnectionOptions);
    /**
     * Closes this connection if it is open. Closed connections cannot be
     * reopened.
     */
    close(): void;
    /**
     * Opens and returns a session. You should never need to use this directly.
     * Your probably better off with `run` instead.
     */
    session(): Session | null;
    /**
     * Returns a new query that uses this connection. The methods such as `match`
     * or `create` are probably more useful to you as they automatically create a
     * new chainable query for you.
     * @return {Query}
     */
    query(): Query;
    protected continueChainClause(clause: Clause): Query;
    /**
     * Runs the provided query on this connection, regardless of which connection
     * the query was created from. Each query is run on it's own session.
     *
     * Run returns a promise that resolves to an array of records. Each key of the
     * record is the name of a variable that you specified in your `RETURN`
     * clause.
     * Eg:
     * ```typescript
     * connection.match([
     *   node('steve', { name: 'Steve' }),
     *   relation('out', [ 'FriendsWith' ]),
     *   node('friends'),
     * ])
     *   .return([ 'steve', 'friends' ])
     *   .run();
     * ```
     *
     * Would result in the value:
     * ```
     * [
     *   {
     *     steve: { ... } // steve node,
     *     friends: { ... } // first friend,
     *   },
     *   {
     *     steve: { ... } // steve node,
     *     friends: { ... } // second friend,
     *   },
     *   {
     *     steve: { ... } // steve node,
     *     friends: { ... } // third friend,
     *   },
     * ]
     * ```
     *
     * Notice how the steve record is returned for each row, this is how cypher
     * works. If you use lodash you can extract all of Steve's friends from the
     * results like using `_.map(results, 'friends')`. If you don't, you can use
     * ES2015/ES6: `results.map(record => record.friends)`.
     *
     * If you use typescript you can use the type parameter to hint at the type of
     * the return value which is `Dictionary<R>[]`.
     *
     * Throws an exception if this connection is not open or there are no clauses
     * in the query.
     *
     * @param {Query} query
     * @returns {Promise<Dictionary<R>[]>}
     */
    run<R = any>(query: Query): Promise<Dictionary<R>[]>;
    /**
     * Runs the provided query on this connection, regardless of which connection
     * the query was created from. Each query is run on it's own session.
     *
     * Returns an observable that emits each record as it is received from the
     * database. This is the most efficient way of working with very large
     * datasets. Each record is an object where each key is the name of a variable
     * that you specified in your return clause.
     *
     * Eg:
     * ```typescript
     * const results$ = connection.match([
     *   node('steve', { name: 'Steve' }),
     *   relation('out', [ 'FriendsWith' ]),
     *   node('friends'),
     * ])
     *   .return([ 'steve', 'friends' ])
     *   .stream();
     *
     * // Emits
     * // {
     * //   steve: { ... } // steve node,
     * //   friends: { ... } // first friend,
     * // },
     * // Then emits
     * // {
     * //   steve: { ... } // steve node,
     * //   friends: { ... } // first friend,
     * // },
     * // And so on
     * ```
     *
     * Notice how the steve record is returned for each row, this is how cypher
     * works. You can extract all of steve's friends from the query by using
     * operators:
     * ```
     * const friends$ = results$.map(row => row.friends);
     * ```
     *
     * The observable class that is used is imported from
     * [any-observable](https://github.com/sindresorhus/any-observable) by default
     * it uses rxjs for the observables, but you can pick a different implementation
     * by registering it with any-observable before importing this module.
     *
     * If you use typescript you can use the type parameter to hint at the type of
     * the return value which is `Dictionary<R>`.
     *
     * Throws an exception if this connection is not open or there are no clauses
     * in the query.
     *
     * The query is run when you call stream so you should subscribe to the results
     * immediately to prevent missing any data.
     *
     * Due to the way the Neo4j javascript driver works, once you call stream there
     * is no way to stop the query until it is complete. Even if you unsubscribe from
     * the observable, all the remaining rows will still be parsed by the driver but
     * then immediately discarded.
     * ```typescript
     * const results$ = connection.matchNode('records')
     *   .return('records')
     *   .limit(1000) // 1000 records will be loaded and parsed from the database
     *   .stream()
     *   .take(10) // even though you only take the first 10
     *   .subscribe(record => {});
     * ```
     * In practice this should never happen unless you're doing some strange things.
     */
    stream<R = any>(query: Query): Observable<Dictionary<R>>;
}
import { Observable as RxObservable } from 'rxjs';
import { Dictionary } from 'lodash';
import { Connection } from './connection';
import { Builder } from './builder';
import { ClauseCollection } from './clause-collection';
import { Clause, QueryObject } from './clause';
export declare class Query extends Builder<Query> {
    protected connection: Connection | null;
    protected clauses: ClauseCollection;
    /**
     * Creates a new query with a given connection.
     *
     * @param {Connection} connection
     */
    constructor(connection?: Connection | null);
    protected continueChainClause(clause: Clause): this;
    /**
     * Runs this query on its connection. If this query was created by calling a
     * chainable method of a connection, then its connection was automatically
     * set.
     *
     * Returns a promise that resolves to an array of records. Each key of the
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
     * Throws an exception if this query does not have a connection or has no
     * clauses.
     *
     * @returns {Promise<Dictionary<R>[]>}
     */
    run<R = any>(): Promise<Dictionary<R>[]>;
    /**
     * Runs this query on its connection. If this query was created by calling a
     * chainable method of a connection, then its connection was automatically
     * set.
     *
     * Returns an observable that emits each record as it is received from the
     * database. This is the most efficient way of working with very large
     * datasets. Each record is an object where each key is the name of a variable
     * that you specified in your return clause.
     *
     * Eg:
     * ```typescript
     * const result$ = connection.match([
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
     * works. You can extract all of steve's friends from the query by using RxJS
     * operators:
     * ```
     * const friends$ = results$.map(row => row.friends);
     * ```
     *
     * If you use typescript you can use the type parameter to hint at the type of
     * the return value which is `Observable<Dictionary<R>>`.
     *
     * Throws an exception if this query does not have a connection or has no
     * clauses.
     */
    stream<R = any>(): RxObservable<Dictionary<R>>;
    /**
     * Runs the current query on its connection and returns the first result.
     * If the query was created by calling a chainable method of a connection,
     * the query's connection was automatically set.
     *
     * If 0 results were returned from the database, returns `undefined`.
     *
     * Returns a promise that resolves to a single record. Each key of the
     * record is the name of a variable that you specified in your `RETURN`
     * clause.
     *
     * If you use typescript you can use the type parameter to hint at the type of
     * the return value which is `Dictionary<R>`. Note that this function returns
     * `undefined` if the result set was empty.
     */
    first<R = any>(): Promise<Dictionary<R> | undefined>;
    /**
     * Returns the query as a string with parameter variables.
     *
     * Eg:
     * ```typescript
     * connection.match([
     *   node('steve', { name: 'Steve' }),
     *   relation('out', [ 'FriendsWith' ]),
     *   node('friends'),
     * ])
     *   .return([ 'steve', 'friends' ])
     *   .build();
     *
     * // MATCH (steve { name: $name })-[:FriendsWith]->(friends)
     * // RETURN steve, friends
     * ```
     *
     * @returns {string}
     */
    build(): string;
    /**
     * Synonym for `build()`.
     * @returns {string}
     */
    toString(): string;
    /**
     * Returns an object that includes both the query and the params ready to be
     * passed to the neo4j driver.
     */
    buildQueryObject(): QueryObject;
    /**
     * Like `build`, but will insert the values of the parameters into the string
     * so queries are easier to debug. __Note: this should only ever be used for
     * debugging__.
     *
     * ```typescript
     * connection.match([
     *   node('steve', { name: 'Steve' }),
     *   relation('out', [ 'FriendsWith' ]),
     *   node('friends'),
     * ])
     *   .return([ 'steve', 'friends' ])
     *   .build();
     *
     * // MATCH (steve { name: 'Steve' })-[:FriendsWith]->(friends)
     * // RETURN steve, friends
     * ```
     *
     * @returns {string}
     */
    interpolate(): string;
    /**
     * Returns an array of all the clauses in this query.
     * @returns {Clause[]}
     */
    getClauses(): Clause[];
    /**
     * Adds a new clause to the query. You probably won't ever need to call this
     * directly, but there is nothing stopping you.
     *
     * @param {Clause} clause
     * @returns {this}
     */
    addClause(clause: Clause): this;
}

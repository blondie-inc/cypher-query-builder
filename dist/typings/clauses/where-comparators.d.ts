import { ParameterBag } from '../parameter-bag';
export declare const comparisions: {
    equals: typeof equals;
    greaterThan: typeof greaterThan;
    greaterEqualTo: typeof greaterEqualTo;
    lessThan: typeof lessThan;
    lessEqualTo: typeof lessEqualTo;
    startsWith: typeof startsWith;
    endsWith: typeof endsWith;
    contains: typeof contains;
    inArray: typeof inArray;
    hasLabel: typeof hasLabel;
    exists: typeof exists;
    between: typeof between;
    isNull: typeof isNull;
    regexp: typeof regexp;
};
export declare type Comparator = (params: ParameterBag, name: string) => string;
/**
 * Equals comparator for use in where clauses. This is the default so you will
 * probably never need to use this.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ age: equals(18) })
 * // WHERE age = 18
 *
 * query.where({ name: equals('clientName', true) })
 * // WHERE age = clientName
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */
export declare function equals(value: any, variable?: boolean): Comparator;
/**
 * Greater than comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ age: greaterThan(18) })
 * // WHERE age > 18
 *
 * query.where({ age: greaterThan('clientAge', true) })
 * // WHERE age > clientAge
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */
export declare function greaterThan(value: any, variable?: boolean): Comparator;
/**
 * Greater or equal to comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ age: greaterEqualTo(18) })
 * // WHERE age >= 18
 *
 * query.where({ age: greaterEqualTo('clientAge', true) })
 * // WHERE age >= clientAge
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */
export declare function greaterEqualTo(value: any, variable?: boolean): Comparator;
/**
 * Less than comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ age: lessThan(18) })
 * // WHERE age < 18
 *
 * query.where({ age: lessThan('clientAge', true) })
 * // WHERE age < clientAge
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */
export declare function lessThan(value: any, variable?: boolean): Comparator;
/**
 * Less or equal to comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ age: lessEqualTo(18) })
 * // WHERE age <= 18
 *
 * query.where({ age: lessEqualTo('clientAge', true) })
 * // WHERE age >= clientAge
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */
export declare function lessEqualTo(value: any, variable?: boolean): Comparator;
/**
 * Starts with comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ name: startsWith('steve') })
 * // WHERE name STARTS WITH 'steve'
 *
 * query.where({ name: startsWith('clientName', true) })
 * // WHERE name STARTS WITH clientName
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */
export declare function startsWith(value: string, variable?: boolean): Comparator;
/**
 * Ends with comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ name: endsWith('steve') })
 * // WHERE name ENDS WITH 'steve'
 *
 * query.where({ name: endsWith('clientName', true) })
 * // WHERE name ENDS WITH clientName
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */
export declare function endsWith(value: string, variable?: boolean): Comparator;
/**
 * Contains comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ name: contains('steve') })
 * // WHERE name CONTAINS 'steve'
 *
 * query.where({ name: contains('clientName', true) })
 * // WHERE name CONTAINS clientName
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */
export declare function contains(value: string, variable?: boolean): Comparator;
/**
 * In comparator for use in where clauses.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ name: inArray([ 'steve', 'william' ]) })
 * // WHERE name IN [ 'steve', 'william' ]
 *
 * query.where({ name: inArray('clientNames', true) })
 * // WHERE name IN clientNames
 * ```
 * @param value
 * @param {boolean} variable
 * @returns {Comparator}
 */
export declare function inArray(value: any[], variable?: boolean): Comparator;
/**
 * Regexp comparator for use in where clauses. Also accepts a case insensitive
 * to make it easier to add the `'(?i)'` flag to the start of your regexp.
 * If you are already using flags in your regexp, you should not set insensitive
 * to true because it will prepend `'(?i)'` which will make your regexp
 * malformed.
 *
 * For convenience you can also pass a Javascript RegExp object into this
 * comparator, which will then be converted into a string before it is
 * passed to cypher. *However*, beware that the cypher regexp syntax is
 * inherited from [java]{@link
 * https://docs.oracle.com/javase/7/docs/api/java/util/regex/Pattern.html},
 * and may have slight differences to the Javascript syntax. For example,
 * Javascript RegExp flags will not be preserved when sent to cypher.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ name: regexp('s.*e') })
 * // WHERE name =~ 's.*e'
 *
 * query.where({ name: regexp('s.*e', true) })
 * // WHERE name =~ '(?i)s.*e'
 *
 * query.where({ name: regexp('clientPattern', false, true) })
 * // WHERE name =~ clientPattern
 * ```
 * @param exp
 * @param insensitive
 * @param {boolean} variable
 * @returns {Comparator}
 */
export declare function regexp(exp: string | RegExp, insensitive?: boolean, variable?: boolean): Comparator;
/**
 * Between comparator for use in where clauses. This comparator uses Neo4j's
 * shortcut comparison syntax: `18 <= age <= 65`.
 *
 * The `lower` and `upper` are the bounds of the comparison. You can use
 * `lowerInclusive` and `upperInclusive` to control whether it uses `<=` or `<`
 * for the comparison. They both default to `true`.
 *
 * If you pass only `lowerInclusive` then it will use that value for both.
 *
 * If you want to compare against a Neo4j variable you can set `variable` to
 * true and the value will be inserted literally into the query.
 *
 * ```
 * query.where({ age: between(18, 65) })
 * // WHERE age >= 18 AND age <= 65
 *
 * query.where({ age: between(18, 65, false) })
 * // WHERE age > 18 < AND age < 65
 *
 * query.where({ age: between(18, 65, true, false) })
 * // WHERE age >= 18 AND age < 65
 *
 * query.where({ age: between('lowerBound', 'upperBound', true, false, true) })
 * // WHERE age >= lowerBound AND age < upperBound
 * ```
 *
 * @param lower
 * @param upper
 * @param {boolean} lowerInclusive
 * @param {boolean} upperInclusive
 * @param {boolean} variables
 * @returns {Comparator}
 */
export declare function between(lower: any, upper: any, lowerInclusive?: boolean, upperInclusive?: boolean, variables?: boolean): Comparator;
/**
 * Is null comparator for use in where clauses. Note that this comparator does
 * not accept any arguments
 *
 * ```
 * query.where({ name: isNull() })
 * // WHERE name IS NULL
 * ```
 * @returns {Comparator}
 */
export declare function isNull(): Comparator;
/**
 * Has label comparator for use in where clauses.
 *
 * ```
 * query.where({ person: hasLabel('Manager') })
 * // WHERE person:Manager
 * ```
 * @param {string} label
 * @returns {Comparator}
 */
export declare function hasLabel(label: string): Comparator;
/**
 * Exists comparator for use in where clauses. Note that this comparator does
 * not accept any arguments
 *
 * ```
 * query.where({ person: exists() })
 * // WHERE exists(person)
 * ```
 * @returns {Comparator}
 */
export declare function exists(): Comparator;

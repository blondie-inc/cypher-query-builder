import { Dictionary, Many } from 'lodash';
import { Clause } from '../clause';
export declare type Properties = (string | Dictionary<string>)[];
export declare type Term = string | Dictionary<string> | Dictionary<Properties>;
export declare class TermListClause extends Clause {
    protected terms: Term[];
    /**
     * Accepts:
     *   node -> string
     *   many nodes -> string[]
     *   nodes with aliases -> Dictionary<string>
     *   node properties -> Dictionary<string[]>
     *   node properties with aliases -> Dictionary<Dictionary<string>[]>
     * or an array of any combination
     */
    constructor(terms: Many<Term>);
    toString(): string;
    private stringifyTerm;
    private stringifyProperty;
    private stringifyProperties;
    private stringifyDictionary;
    build(): string;
}

import {
  flatMapDeep,
  map,
  isPlainObject,
  isString,
  isArray,
  castArray,
  reduce,
  Dictionary,
  Many,
} from 'lodash';
import { Clause } from '../clause';

export type Properties = (string | Dictionary<string>)[];
export type Term
  = string
  | Dictionary<string>
  | Dictionary<Properties>;

export class TermListClause extends Clause {
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
  constructor(terms: Many<Term>) {
    super();
    this.terms = castArray(terms);
  }

  toString() {
    return flatMapDeep(this.terms, term => this.stringifyTerm(term)).join(', ');
  }

  private stringifyTerm(term: Term): Many<string> {
    // Just a node
    if (isString(term)) {
      return this.stringifyProperty(term);
    }

    // List of nodes
    if (isArray(term)) {
      return this.stringifyProperties(term);
    }

    // Node properties or aliases
    if (isPlainObject(term)) {
      return this.stringifyDictionary(term);
    }

    return '';
  }

  private stringifyProperty(prop: string, alias?: string, node?: string): string {
    let prefix = node ? `${node}.` : '';
    if (alias) {
      prefix += `${alias} AS `;
    }
    return prefix + prop;
  }

  private stringifyProperties(props: Properties, alias?: string, node?: string): string[] {
    const convertToString = (list: string[], prop: string | Dictionary<string>) => {
      if (isString(prop)) {
        // Single node property
        list.push(this.stringifyProperty(prop, alias, node));
      } else {
        // Node properties with aliases
        list.push(...map(prop, (name, alias) => this.stringifyProperty(name, alias, node)));
      }
      return list;
    };
    return reduce(props, convertToString, []);
  }

  private stringifyDictionary(node: Dictionary<string | Properties>): string[] {
    return reduce(
      node,
      (list, prop, key) => {
        if (isString(prop)) {
          // Alias
          list.push(this.stringifyProperty(prop, key));
        } else {
          // Node with properties
          list.push(...this.stringifyProperties(prop, undefined, key));
        }
        return list;
      },
      [] as string[],
    );
  }

  build() {
    return this.toString();
  }
}

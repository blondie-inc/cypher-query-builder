import { Dictionary, Many } from 'lodash';

export { Create } from './create';
export { NodePattern } from './node-pattern';
export { With } from './with';
export { Unwind } from './unwind';
export { Delete } from './delete';
export { Set } from './set';
export { RelationPattern } from './relation-pattern';
export { Match } from './match';
export { Return } from './return';
export { Skip } from './skip';
export { Limit } from './limit';
export { Where } from './where';
export { Raw } from './raw';
export { OrderBy } from './order-by';
export { and, or, xor, not, operators } from './where-operators';
export {
  equals,
  greaterThan,
  greaterEqualTo,
  lessThan,
  lessEqualTo,
  startsWith,
  endsWith,
  contains,
  inArray,
  hasLabel,
  exists,
  between,
  isNull,
  regexp,
  comparisions,
} from './where-comparators';

import { NodePattern } from './node-pattern';
import { RelationPattern } from './relation-pattern';
import { PathLength } from '../utils';

export function node(
  name?: Many<string> | Dictionary<any>,
  labels?: Many<string> | Dictionary<any>,
  conditions?: Dictionary<any>,
) {
  return new NodePattern(name, labels, conditions);
}

export function relation(
  dir: 'in' | 'out' | 'either',
  name?: Many<string> | Dictionary<any>,
  labels?: Many<string> | Dictionary<any>,
  conditions?: Dictionary<any>,
  length?: PathLength
) {
  return new RelationPattern(dir, name, labels, conditions, length);
}

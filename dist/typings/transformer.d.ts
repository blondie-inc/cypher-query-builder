import { Dictionary } from 'lodash';
import { Record, Integer } from 'neo4j-driver/types/v1';
export declare type NeoValue = string | boolean | null | number | Integer;
export interface NeoNode {
    identity: Integer;
    labels: string[];
    properties: Dictionary<NeoValue>;
}
export interface NeoRelation {
    identity: Integer;
    start: Integer;
    end: Integer;
    type: string;
    properties: Dictionary<NeoValue>;
}
export declare type PlainValue = string | boolean | null | number;
export declare type PlainArray = string[] | boolean[] | number[];
export interface Node<P = Dictionary<PlainValue | PlainArray>> {
    identity: string;
    labels: string[];
    properties: P;
}
export interface Relation<P = Dictionary<PlainValue | PlainArray>> {
    identity: string;
    start: string;
    end: string;
    label: string;
    properties: P;
}
export declare class Transformer {
    transformRecords<T = any>(records: Record[]): Dictionary<T>[];
    transformRecord<T = any>(record: Record): Dictionary<T>;
    private transformValue;
    private isPlainValue;
    private isNode;
    private transformNode;
    private isRelation;
    private transformRelation;
    private convertInteger;
}

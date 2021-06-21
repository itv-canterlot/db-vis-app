// Entity types
export interface Table {
    oid?: number,
    tableName: string,
    pk?: PrimaryKey,
    fk?: ForeignKey[],
    attr: Attribute[],
    idx: number,
}

interface ForeignKeyColumn extends KeyColumn {
    fkColName: string,
    fkColPos: number,
    pkColName: string,
    pkColPos: number
}

interface PrimaryKeyColumn extends KeyColumn {
    colName: string,
    colPos: number,
}

interface KeyColumn {

}

export interface Key {
    keyName: string,
    columns: KeyColumn[]
}

export interface PrimaryKey extends Key {
    columns: PrimaryKeyColumn[],
    keyCount: number
 }

export interface ForeignKey extends Key {
    pkTableName: string,
    columns: ForeignKeyColumn[]
}

export interface Attribute {
    attname: string,
    attnum: number,
    typname: string,
    isNullable?: boolean,
}

// Visualisation types
export const enum VISPARAMTYPES {
    TEMPORAL = "TEMPORAL",
    GEOGRAPHICAL = "GEOGRAPHICAL",
    LEXICAL = "LEXICAL",
    COLOR = "COLOR"
}


export enum VISSCHEMATYPES {
    BASIC = 0,
    WEAKENTITY = 1,
    ONEMANY = 2,
    MANYMANY = 3,
    SUBSET = 4
}

export type VisSchema = {
    name: string,
    type: VISSCHEMATYPES.BASIC,
    localKey: VisKey,
    mandatoryParameters: VisParam[],
    optionalParameters?: VisParam[],
    template?: string
} | {
    name: string,
    type: VISSCHEMATYPES.WEAKENTITY,
    localKey: VisKey,
    foreignKey: VisKey
    complete: boolean,
    mandatoryParameters: VisParam[],
    optionalParameters?: VisParam[],
    template?: string
} | {
    name: string,
    type: VISSCHEMATYPES.ONEMANY,
    localKey: VisKey,
    foreignKey: VisKey,
    mandatoryParameters?: VisParam[],
    optionalParameters?: VisParam[]
    template?: string
} | {
    name: string,
    type: VISSCHEMATYPES.MANYMANY,
    localKey: VisKey,
    foreignKey: VisKey,
    reflexive: boolean,
    mandatoryParameters?: VisParam[],
    optionalParameters?: VisParam[],
    template?: string
}

export interface VisParam {
    scalar?: boolean,
    type?: VISPARAMTYPES
}

export interface VisKey extends VisParam { 
    minCount: number,
    maxCount?: number
}

// Relation types
export type RelationNode = {
    type: VISSCHEMATYPES,
    parentEntity: Table,
    childRelations: ChildRelation[],
    index?: number
}

export type ChildRelation = {
    table: Table,
    fkIndex: number
}

export type VisTemplateBuilder = {
    width: number,
    height: number,
    margin?: marginObject,
    svg: any,
    data: any,
    args?: object
}

type marginObject = {
    left?: number,
    right?: number,
    top?: number,
    bottom?: number
}

// Pattern-matching
export type PatternMatchAttribute = {
    table: Table,
    attributeIndex: number,
    matchIndex?: number
}
export type PatternMatchResult = {
    vs: VisSchema,
    matched: boolean,
    mandatoryAttributes: PatternMatchAttribute[][],
    optionalAttributes: PatternMatchAttribute[][],
    responsibleRelation?: RelationNode
}
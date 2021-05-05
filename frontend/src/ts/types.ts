// Entity types
export interface Table {
    oid: number,
    relname: string,
    pk?: PrimaryKey,
    fk?: ForeignKey[],
    isJunction: boolean,
    attr: Attribute[]
    weakEntitiesIndices: number[]
}

export interface Key {
    oid: number,
    conname: string,
    conkey: number[],
    condef: string
}

export interface Attribute {
    attname: string,
    attlen: number,
    attnum: number,
    attndims: number,
    typname: string,
    typcategory: string, // TODO: enum?
    attrelid: number
}

export interface PrimaryKey extends Key { }

export interface ForeignKey extends Key {
    confrelid: number,
    confkey: number[],
    confname: string
}


// Visualisation types
export declare enum VISPARAMTYPES {
    TEMPORAL = "TEMPORAL",
    GEOGRAPHICAL = "GEOGRAPHICAL",
    LEXICAL = "LEXICAL",
    COLOR = "COLOR"
}


export enum VISSCHEMATYPES {
    BASIC = 0,
    WEAKENTITY = 1,
    ONEMANY = 2,
    MANYMANY = 3
}

export type VisSchema = {
    name: string,
    type: VISSCHEMATYPES.BASIC,
    keys: VisKey
    mandatoryParameters: VisParam[],
    optionalParameters?: VisParam[],
} | {
    name: string,
    type: VISSCHEMATYPES.WEAKENTITY,
    keys: VisKey[]
    complete: boolean,
    mandatoryParameters: VisParam[],
    optionalParameters?: VisParam[],
} | {
    name: string,
    type: VISSCHEMATYPES.ONEMANY,
    keys: VisKey[],
    mandatoryParameters?: VisParam[],
    optionalParameters?: []
} | {
    name: string,
    type: VISSCHEMATYPES.ONEMANY,
    keys: VisKey[],
    reflexive: boolean,
    mandatoryParameters?: VisParam[],
    optionalParameters?: []
}

export interface VisParam {
    scalar: boolean,
    type?: VISPARAMTYPES
}

interface VisKey extends VisParam { 
    minCount: number,
    maxCount?: number
}

// Relation types
export type RelationNode = {
    type: VISSCHEMATYPES.ONEMANY,
    parentEntity: Table,
    childEntities: RelationNode[]
} | {
    type: VISSCHEMATYPES.MANYMANY,
    parentEntity: Table,
    childEntities: RelationNode[]
} | {
    type: VISSCHEMATYPES.WEAKENTITY,
    parentEntity: Table,
    childEntities: RelationNode[]
}
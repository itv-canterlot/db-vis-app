// Entity types
export interface Table {
    oid?: number,
    tableName: string,
    pk?: PrimaryKey,
    fk?: ForeignKey[],
    isJunction: boolean,
    attr: Attribute[]
    weakEntitiesIndices: number[]
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
    columns: PrimaryKeyColumn[]
 }

export interface ForeignKey extends Key {
    pkTableName: string,
    columns: ForeignKeyColumn[]
}

// export interface Key {

// }

// export interface Key {
//     conName: string,
//     keyName: string,
//     keyPos: number[],
//     condef?: string
// }

export interface Attribute {
    attname: string,
    attnum: number,
    typname: string,
    isNullable?: boolean,
    // typcategory: string, // TODO: enum?
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
    childEntities: RelationNode[],
    index?: number
} | {
    type: VISSCHEMATYPES.MANYMANY,
    parentEntity: Table,
    childEntities: RelationNode[],
    index?: number
} | {
    type: VISSCHEMATYPES.WEAKENTITY,
    parentEntity: Table,
    childEntities: RelationNode[],
    index?: number
}
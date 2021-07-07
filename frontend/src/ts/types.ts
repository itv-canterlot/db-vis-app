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

export const visSchemaTypeToReadableString = (schema: VISSCHEMATYPES) => {
    switch (schema) {
        case VISSCHEMATYPES.BASIC:
            return "Basic entity";
        case VISSCHEMATYPES.WEAKENTITY:
            return "Weak entity";
        case VISSCHEMATYPES.ONEMANY:
            return "One-to-many";
        case VISSCHEMATYPES.MANYMANY:
            return "Many-to-many";
        case VISSCHEMATYPES.SUBSET:
            return "Subset";
    }
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

export type SuperSetRelationType = {
    table: Table, 
    fkIndex: number, 
    parentTableName: string
};

export type GroupedSuperSetRelationType = {
    [name: string]: SuperSetRelationType[]
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
    mismatchReason?: PatternMismatchReason,
    mandatoryAttributes: PatternMatchAttribute[][],
    optionalAttributes: PatternMatchAttribute[][],
    responsibleRelation?: RelationNode
}

export enum CONFIRMATION_STATUS {
    NO = 0,
    YES = 1,
    UNKNOWN = 2
}

export enum PATTERN_MISMATCH_REASON_TYPE {
    NO_PK,
    KEY_COUNT_MISMATCH,
    KEY_TYPE_MISMATCH,
    NO_SUITABLE_RELATION
}

export type PatternMismatchReason = {
    reason: PATTERN_MISMATCH_REASON_TYPE,
    position?: number
}

// Data Filters
// export const enum FilterType {
//     SCALAR_COMPARISON,
//     STD
// }

export class FilterType {
    static readonly SCALAR_COMPARISON = new FilterType(0, "Scalar comparison");
    static readonly STD = new FilterType(1, "Limit outliers");

    private constructor(
        private readonly key,
        public readonly value){

        }
    
    toString() {
        return this.value;
    }

    static getAllFilterTypes = () => [
        FilterType.SCALAR_COMPARISON,
        FilterType.STD
    ]
}

export type FilterCondition = {
    filterType: FilterType
    friendlyName: string,
    sqlCommand?: string
}

export type Filter = {
    tableIndex: number,
    attNum: number,
    condition: FilterCondition,
    fk?: ForeignKey,
    value: any
}

export type Query = {
    attrs: QueryAttribute[],
    foreignKeys?: QueryForeignKeys[],
    parentTableName: string,
    primaryKeys: QueryAttribute[] | QueryAttribute[][],
    params?: object
}

// Database connection types
export type QueryAttribute = {
    tableName: string,
    columnName: string
}

export type QueryForeignKeys = {
    fkTableName: string,
    pkTableName: string,
    linkedColumns: {
        fkColName: string,
        pkColName: string
    }[]
}

export type QueryAttributeGroup = {
    [tableName: string]: QueryAttribute
}
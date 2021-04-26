export interface Table {
    oid: number,
    relname: string,
    pk?: PrimaryKey,
    fk?: ForeignKey[],
    isJunction: boolean,
    attr: Attribute[]
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
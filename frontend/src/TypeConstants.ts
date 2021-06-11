import { Attribute } from "./ts/types";

const preciseNumDataTypes = [
    "bit", "tinyint", "smallint", "int", "bigint", "decimal",
    "money", "smallmoney", "integer", "numeric", "dec", "fixed"
];

const approxNumDataTypes = ["float", "real", "double precision", "double"];

const dateAndTimeDataTypes = ["date", "time", "datetime2", "datetimeoffset", "smalldatetime", "datetime", "year", "timestamp"];

const charDataTypes = [
    "char", "varchar", "character varying", "text", "varchar(max)", "nchar", "nvchar", "ntext"
];

const binaryDataTypes = ["binary", "varbinary", "varbinary(max)", "image"];

const otherScalarDataTypes = ["rowversion", "uniqueidentifier", "cursor", "table", "sql_variant"];

const scalarDataTypes = [preciseNumDataTypes, approxNumDataTypes, otherScalarDataTypes];

export const isAttributeScalar = (att: Attribute) => {
    const attTypName = att.typname;
    for (let dts of scalarDataTypes) {
        for (let dt of dts) {
            if (dt.toLowerCase() === attTypName.toLowerCase()) {
                return true;
            }
        }
    }

    return false;
}

export const isAttributeTemporal = (att: Attribute) => {
    for (let dt of dateAndTimeDataTypes) {
        if (dt.toLowerCase() === att.typname.toLowerCase()) {
            return true;
        }
    }

    return false;
}

export const isAttributeLexical = (att: Attribute) => {
    // TODO
    return false;
}

export const isAttributeColor = (att: Attribute) => {
    // TODO
    return false;
}

export const isAttributeGeographical = (att: Attribute) => {
    // TODO
    return false;
}
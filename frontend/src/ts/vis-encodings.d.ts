enum VISPARAMTYPES {
    TEMPORAL = "TEMPORAL",
    GEOGRAPHICAL = "GEOGRAPHICAL",
    LEXICAL = "LEXICAL",
    COLOR = "COLOR"
};


enum VISSCHEMATYPES {
    BASIC,
    WEAKENTITY,
    ONEMANY,
    MANYMANY
};

type VisSchema = {
    name: string,
    type: VISSCHEMATYPES.BASIC,
    keys: Key
    mandatoryParameters: VisParam[],
    optionalParameters?: VisParam[],
} | {
    name: string,
    type: VISSCHEMATYPES.WEAKENTITY,
    keys: Key[]
    complete: boolean,
    mandatoryParameters: VisParam[],
    optionalParameters?: VisParam[],
} | {
    name: string,
    type: VISSCHEMATYPES.ONEMANY,
    keys: Key[],
    mandatoryParameters?: VisParam[],
    optionalParameters?: []
} | {
    name: string,
    type: VISSCHEMATYPES.ONEMANY,
    keys: Key[],
    reflexive: boolean,
    mandatoryParameters?: VisParam[],
    optionalParameters?: []
};

interface VisParam {
    scalar: boolean,
    type?: VisParamType
};

interface Key implements VisParam { 
    minCount: number,
    maxCount?: number
}

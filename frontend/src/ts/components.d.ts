import {PrimaryKey, ForeignKey, Key, Table, Attribute} from './types'

/** UIElements.tsx **/
export type SearchDropdownListProps = {
    placeholder: string,
    dropdownList: any[],
    prependText: string,
    selectedIndex: number,
    onListSelectionChange: Function,
    arrayRenderer?: Function,
    objectRenderer?: Function,
    updateListHandler?: Function
    
}

/** app.tsx **/
export type JunctionTableLinksProps = {
    selectedEntity: Table
}

export type FixedAttributeSelectorProps = {
    entity: Table,
    fk: ForeignKey
}

export type EntitySelectorProps = {
    state: ApplicationStates, // TODO
    onTableSelectChange: Function,
    onAttributeSelectChange: Function,
    onFKAttributeSelectChange: Function,
    onForeignKeySelectChange: Function,
    updateOnTableListFocus: Function
}

export type AttributeListSelectorProps = {
    dropdownList: Attribute[], // TODO: attribute type
    selectedIndex: number,
    prependText: string,
    onListSelectionChange: Function,
    // arrayRenderer?: Function,
    tablePrimaryKey: PrimaryKey,
    tableForeignKeys: ForeignKey[]
}

export type ApplicationStates = {
    allEntitiesList?: Table[],
    selectedTableIndex?: number,
    selectedTableOID?: number,
    selectedAttributeIndex?: number,
    selectedForeignKeyIndex?: number,
    selectedFKAttributeIndex?: number,
    load: boolean,
    // TODO: TO BE REPLACED
    // tableAttributes?: any[],// TODO: attribute type
    // tableForeignKeys?: ForeignKey[],
    // frelAtts?: any[] // TODO: attribute type
}
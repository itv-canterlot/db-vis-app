import {PrimaryKey, ForeignKey, Table, Attribute, RelationNode} from './types'

/** UIElements.tsx **/
export type SearchDropdownListProps = {
    placeholder: string,
    dropdownList: any[],
    prependText: string,
    selectedIndex: number,
    onListSelectionChange: Function,
    arrayRenderer?: Function,
    objectRenderer?: Function,
    updateListHandler?: Function,
    innerVal?: string,
    listFilter?: Function,
    id?: string
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
    onTableSelectChange: Function,
    onAttributeSelectChange?: Function,
    onFKAttributeSelectChange?: Function,
    onForeignKeySelectChange?: Function,
    selectedTableIndex: number,
    selectedAttributeIndex?: number,
    selectedForeignKeyIndex?: number,
    selectedFKAttributeIndex?: number,
    listLoaded?: boolean,
    id?: string
}

export type AttributeListSelectorProps = {
    dropdownList: Attribute[],
    selectedIndex: number,
    prependText: string,
    onListSelectionChange: Function,
    tablePrimaryKey: PrimaryKey,
    tableForeignKeys: ForeignKey[]
}

export type ApplicationStates = {
    allEntitiesList?: Table[],
    relationsList?: RelationNode[],
    selectedTableIndex?: number,
    selectedAttributeIndex?: number,
    selectedForeignKeyIndex?: number,
    selectedFKAttributeIndex?: number,
    load?: boolean,
    listLoaded?: boolean,
    databaseLocation?: string,
    showStartingTableSelectModal?: boolean,
    showMatchedSchemasModal?: boolean,
    visSchemaMatchStatus?: any[] // TODO: figure this out...
}

export type AppSidebarProps = {
    databaseLocation: string,
    onClickShowStartingTableSelectModal: React.MouseEventHandler,
    onClickShowMatchedSchemasModal: React.MouseEventHandler,
    selectedTableIndex: number
}

export type SidebarBubbleBlockProps = {
    headerElement: JSX.Element,
    bodyElement: JSX.Element,
    isLoaded: boolean,
    onClick?: React.MouseEventHandler
}
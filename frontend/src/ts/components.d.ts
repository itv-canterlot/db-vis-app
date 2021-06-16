import React = require('react')
import {PrimaryKey, ForeignKey, Table, Attribute, RelationNode, PatternMatchResult, PatternMatchAttribute} from './types'

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
    selectedPatternIndex?: number,
    rendererSelectedAttributes?: PatternMatchAttribute[][], // TODO: expand if needed
    rerender?: boolean,
    load?: boolean,
    listLoaded?: boolean,
    databaseLocation?: string,
    showStartingTableSelectModal?: boolean,
    showMatchedSchemasModal?: boolean,
    visSchemaMatchStatus?: PatternMatchResult[]
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

/* AppMainCont.tsx */
export type SchemaExplorerProps = {
    expanded: boolean, 
    selectedTableIndex: number,
    selectedAttributesIndices: PatternMatchAttribute[][]
    onVisPatternIndexChange: Function,
    onSelectedAttributeIndicesChange: React.MouseEventHandler
}

export type AppMainContProps = {
    selectedTableIndex: number,
    selectedAttributesIndices: PatternMatchAttribute[][],
    load: boolean,
    rerender: boolean,
    onVisPatternIndexChange: Function,
    onSelectedAttributeIndicesChange: React.MouseEventHandler
}

export type AppMainContStates = {
    stateChanged?: boolean
}

/* Visualiser.tsx */
export type VisualiserProps = {
    selectedTableIndex: number,
    selectedAttributesIndices: PatternMatchAttribute[][],
    rerender: boolean
}

export type VisualiserStates = {
    load?: boolean,
    renderedTableIndex?: number,
    renderedAttributesIndices?: PatternMatchAttribute[][]
}
import React = require('react')
import {PrimaryKey, ForeignKey, Table, Attribute, RelationNode, PatternMatchResult, PatternMatchAttribute, Filter, VisSchema, FilterType} from './types'

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
    id?: string,
    updateInnerText?: Function
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
    selectedAttributeIndex?: number,
    selectedForeignKeyIndex?: number,
    selectedFKAttributeIndex?: number,
    selectedEntityIndex?: number,
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
    data?: object[],
    dataLoaded?: boolean,
    relationsList?: RelationNode[],
    selectedFirstTableIndex?: number,
    selectedPatternIndex?: number,
    rendererSelectedAttributes?: PatternMatchAttribute[][], // TODO: expand if needed
    rerender?: boolean,
    load?: boolean,
    listLoaded?: boolean,
    databaseLocation?: string,
    showStartingTableSelectModal?: boolean,
    showMatchedSchemasModal?: boolean,
    showFilterSelectModal?: boolean,
    visSchemaMatchStatus?: PatternMatchResult[]
}

export type AppSidebarProps = {
    databaseLocation: string,
    onClickShowStartingTableSelectModal: React.MouseEventHandler,
    onClickShowFilterSelectModal: React.MouseEventHandler
}

export type SidebarBubbleBlockProps = {
    headerElement: JSX.Element,
    bodyElement: JSX.Element,
    isLoaded: boolean,
    onClick?: React.MouseEventHandler
}

/* SidebarModals.tsx */
export type StartingTableSelectModalProps = {
    onClose: Function, 
    onTableSelectChange: Function, 
}

export type StartingTableSelectModalStates = {
    cachedSelectedIndex?: number,
    selectedForeignKeyIdx?: number
}

export type FilterSelectModalProps = {
    onClose: Function
}

export type FilterSelectModalStates = {
    cachedFilterSelection?: Filter,
    cachedFilterType?: FilterType,
    filters?: Filter[],
    cachedForeignTableSelected?: number,
    cachedForeignTableFKIndex?: number,
    filterRange?: number
}

/* AppMainCont.tsx */
export type SchemaExplorerProps = {
    expanded: boolean, 
    onVisPatternIndexChange: Function,
    onSelectedAttributeIndicesChange: React.MouseEventHandler,
    onClickShowFilterSelectModal: React.MouseEventHandler,
    onExpansionClick?: Function
}

export type SchemaExplorerStates = {
}

export type AppMainContProps = {
    load: boolean,
    rerender: boolean,
    onVisPatternIndexChange: Function,
    onSelectedAttributeIndicesChange: React.MouseEventHandler,
    onClickShowFilterSelectModal: React.MouseEventHandler,
    onDataChange?: Function
}

export type AppMainContStates = {
    stateChanged?: boolean,
    explorerExpanded: boolean,
}

/* Visualiser.tsx */
export type VisualiserProps = {
    rerender: boolean
    onDataChange?: Function
}

export type VisualiserStates = {
    load?: boolean,
    renderedTableIndex?: number,
    renderedAttributesIndices?: PatternMatchAttribute[][],
    renderedVisSchemaIndex?: number,
    renderFailed: boolean,
}

/* FilterSelector.tsx */
export type FilterSelectorProps = {
    filter: Filter,
    cachedFilterValueRef: React.RefObject<HTMLInputElement>,
    cachedFilterType: FilterType,
    changedCondition: Function,
    onConfirmCachedFilter: React.MouseEventHandler,
    onChangeFilterType: React.MouseEventHandler
}
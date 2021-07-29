import React = require('react')
import {PrimaryKey, ForeignKey, Table, Attribute, RelationNode, PatternMatchResult, PatternMatchAttribute, Filter, VisSchema, FilterType, TableAttributeComb} from './types'

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
    selectedEntityIndex?: number,
    cachedSelectedEntitiesList?: number[],
    cachedSelectedRelationsList?: number[],
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
    filters?: Filter[],
    relationsList?: RelationNode[],
    selectedEntitesIndices?: number[],
    selectedRelationsIndices?: number[],
    relHierachyIndices?: number[][],
    selectedPatternIndex?: number,
    selectedMatchResultIndexInPattern?: number,
    rendererSelectedAttributes?: PatternMatchAttribute[][],
    rerender?: boolean,
    load?: boolean,
    listLoaded?: boolean,
    databaseLocation?: string,
    showStartingTableSelectModal?: boolean,
    showMatchedSchemasModal?: boolean,
    showFilterSelectModal?: boolean,
    visSchemaMatchStatus?: PatternMatchResult[][]
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
    onDatasetSchemaSelectChange: Function, 
}

export type StartingTableSelectModalStates = {
    dataSelectByTable?: boolean
    cachedSelectEntitiesIndices?: number[],
    cachedSelectedRelationsIndices?: number[],
    cachedDropdownSelectedIndex?: number,
    cachedForeignRelationCardSelectedIndex?: number
}

export type FilterSelectModalProps = {
    filters: Filter[]
    onClose: Function,
    onFilterChange: Function,
}

export type FilterSelectModalStates = {
    cachedFilterSelection?: Filter,
    cachedFiltersList?: Filter[],
    cachedFilterType?: FilterType,
    cachedForeignTableSelected?: number,
    cachedForeignTableFKIndex?: number,
    tableAttributeList?: TableAttributeComb[],
    filterRange?: number
}

export type TableBasedFilterModalContentProps = {
    handleOnClose: React.MouseEventHandler, 
    onFilterSelectionConfirm: React.MouseEventHandler,
    onConfirmCachedFilter: React.MouseEventHandler,
    onChangeFilterType: React.MouseEventHandler,
    onTableAttributeClick: React.MouseEventHandler,
    onFilterConditionChanged: Function,
    filterList: Filter[],
    onFilterRangeChange: Function,
    getTableRelationVis: Function,
    cachedFilterValueRef: React.RefObject<HTMLInputElement>
    parentStates: FilterSelectModalStates,
}

export type DatasetFilteringElementProps = {
    cachedFilterSelection: Filter, 
    cachedFilterType: FilterType,
    cachedFilterValueRef: React.RefObject<HTMLInputElement>,
    onFilterConditionChanged: Function,
    onConfirmCachedFilter: React.MouseEventHandler,
    onChangeFilterType: React.MouseEventHandler,
    filterList: Filter[]
}

/* AppMainCont.tsx */
export type SchemaExplorerProps = {
    expanded: boolean, 
    onVisPatternIndexChange: Function,
    onMatchResultIndexChange: Function,
    onSelectedAttributeIndicesChange: React.MouseEventHandler,
    onRelHierachyChange: Function,
    onClickShowFilterSelectModal: React.MouseEventHandler,
    onExpansionClick?: Function
}

export type SchemaExplorerStates = {
}

export type AppMainContProps = {
    load: boolean,
    rerender: boolean,
    onVisPatternIndexChange: Function,
    onMatchResultIndexChange: Function,
    onRelHierachyChange: Function,
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
    renderedMatchResultIndex?: number
    renderedAttributesIndices?: PatternMatchAttribute[][],
    renderedVisSchemaIndex?: number,
    renderedFilters?: Filter[],
    renderFailed: boolean,
    axisScales?: object
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
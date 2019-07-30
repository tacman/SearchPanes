/*! SearchPanes 0.0.2
 * 2018 SpryMedia Ltd - datatables.net/license
 */
// DataTables extensions common UMD. Note that this allows for AMD, CommonJS
// (with window and jQuery being allowed as parameters to the returned
// function) or just default browser loading.
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery', 'datatables.net'], function ($) {
            return factory($, window, document);
        });
    }
    else if (typeof exports === 'object') {
        // CommonJS
        module.exports = function (root, $) {
            if (!root) {
                root = window;
            }
            if (!$ || !$.fn.dataTable) {
                $ = require('datatables.net')(root, $).$;
            }
            return factory($, root, root.document);
        };
    }
    else {
        // Browser - assume jQuery has already been loaded
        factory(window.jQuery, window, document);
    }
}(function ($, window, document) {
    var DataTable = $.fn.dataTable;
    var SearchPanes = /** @class */ (function () {
        function SearchPanes(paneSettings, opts) {
            var _this = this;
            var table = new DataTable.Api(paneSettings);
            this.panes = [];
            this.arrayCols = [];
            this.classes = $.extend(true, {}, SearchPanes["class"]);
            this.dom = {
                clearAll: $('<button type="button">Clear All</button>').addClass(this.classes.clearAll),
                container: $('<div/>').addClass(this.classes.container),
                hide: $('<button type="button">Hide Panes</button>').addClass(this.classes.hide),
                title: $('<div/>').addClass(this.classes.title)
            };
            this.c = $.extend(true, {}, SearchPanes.defaults, opts);
            this.s = {
                colOpts: [],
                columns: [],
                dt: table,
                filteringActive: false,
                redraw: false,
                updating: false
            };
            table.settings()[0]._searchPanes = this;
            var loadedFilter;
            if (table.state.loaded()) {
                loadedFilter = table.state.loaded();
            }
            table
                .columns(this.c.columns)
                .eq(0)
                .each(function (idx) {
                console.log(idx);
                _this.panes.push(_this._pane(idx));
            });
            if (table.data().toArray().length === 0) {
                return;
            }
            var rowLength = table.columns().eq(0).toArray().length;
            if (this.c.panes !== undefined) {
                var paneLength = this.c.panes.length;
                for (var i = 0; i < paneLength; i++) {
                    var id = rowLength + i;
                    //console.log(rowLength, i, id, table.columns().eq(0).toArray())
                    this.panes.push(this._pane(id));
                }
            }
            // PreSelect any selections which have been defined using the preSelect option
            table
                .columns(this.c.columns)
                .eq(0)
                .each(function (idx) {
                if (_this.s.colOpts[idx].preSelect !== undefined) {
                    for (var i = 0; i < _this.panes[idx].table.rows().data().toArray().length; i++) {
                        if (_this.s.colOpts[idx].preSelect.indexOf(_this.panes[idx].table.cell(i, 0).data()) !== -1) {
                            _this.panes[idx].table.row(i).select();
                            if (!_this.s.updating) {
                                _this._updateTable(_this.panes[idx], _this.s.columns, idx, true);
                            }
                        }
                    }
                }
            });
            this._reloadSelect(loadedFilter, this);
            this._attach();
            $.fn.dataTable.tables({ visible: true, api: true }).columns.adjust();
            this._updateFilterCount();
            table.on('stateSaveParams.dt', function (e, settings, data) {
                var paneColumns = [];
                for (var i = 0; i < _this.panes.length; i++) {
                    if (_this.panes[i]) {
                        paneColumns[i] = _this.panes[i].table.rows({ selected: true }).data().pluck('filter').toArray();
                    }
                }
                data.searchPanes = paneColumns;
            });
            table.on('draw.dt', function (e, settings, data) {
                if (!_this.s.updating) {
                    var filterActive = true;
                    if (table.rows({ search: 'applied' }).data().toArray().length === table.rows().data().toArray().length) {
                        filterActive = false;
                    }
                    _this._updatePane(false, filterActive, true);
                    // this.s.redraw = true;
                    // this.s.dt.draw();
                    // this.s.redraw = false;
                }
            });
            if (this.c.clear) {
                this.dom.clearAll[0].addEventListener('click', function () {
                    _this._clearSelections();
                });
            }
            if (this.c.hide) {
                this.dom.hide[0].addEventListener('click', function () {
                    var elements = document.getElementsByClassName('dt-searchPanes');
                    if (_this.dom.hide[0].innerHTML === 'Hide Panes') {
                        $(elements[0]).hide();
                        _this.dom.hide[0].innerHTML = 'Show Panes';
                    }
                    else {
                        $(elements[0]).show();
                        _this.dom.hide[0].innerHTML = 'Hide Panes';
                    }
                });
            }
            table.state.save();
        }
        SearchPanes.prototype._attach = function () {
            var container = this.c.container;
            var host = typeof container === 'function' ? container(this.s.dt) : container;
            if (this.c.insert === 'append') {
                if (this.c.hide) {
                    $(this.dom.hide).appendTo(host);
                }
                $(this.dom.title).appendTo(host);
                if (this.c.clear) {
                    $(this.dom.clearAll).appendTo(host);
                }
                $(this.dom.container).appendTo(host);
            }
            else {
                $(this.dom.container).prependTo(host);
                $(this.dom.title).prependTo(host);
                if (this.c.clear) {
                    $(this.dom.clearAll).prependTo(host);
                }
                if (this.c.hide) {
                    $(this.dom.hide).prependTo(host);
                }
            }
        };
        SearchPanes.prototype._binData = function (data) {
            var out = {};
            data = this._flatten(data);
            for (var i = 0, ien = data.length; i < ien; i++) {
                var d = data[i].filter;
                if (d === null || d === undefined) {
                    continue;
                }
                if (!out[d]) {
                    out[d] = 1;
                }
                else {
                    out[d]++;
                }
            }
            return out;
        };
        SearchPanes.prototype._clearPane = function (pane) {
            pane.table.rows({ selected: true }).deselect();
            this._updateTable(pane, this.s.columns, pane.index, false);
            this._updateFilterCount();
        };
        SearchPanes.prototype._clearSelections = function () {
            for (var _i = 0, _a = this.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                this._clearPane(pane);
            }
        };
        SearchPanes.prototype._comparisonStatUpdate = function (val, comparisonObj, bins, binsTotal) {
            if (typeof comparisonObj.filter !== 'function') {
                comparisonObj.filter.push(val.filter);
            }
            bins !== undefined ? comparisonObj.shown += bins : comparisonObj.shown += 0;
            binsTotal !== undefined ? comparisonObj.total += binsTotal : comparisonObj.total += 0;
            return comparisonObj;
        };
        SearchPanes.prototype._detailsPane = function (table, colOpts, classes, idx, arrayTotals) {
            var _this = this;
            table.rows().every(function (rowIdx, tableLoop, rowLoop) {
                _this._populatePaneArray(colOpts, table, rowIdx, idx, classes, arrayTotals);
            });
        };
        SearchPanes.prototype._findUnique = function (prev, data, arrayFilter) {
            for (var _i = 0, arrayFilter_1 = arrayFilter; _i < arrayFilter_1.length; _i++) {
                var filterEl = arrayFilter_1[_i];
                if (prev.indexOf(filterEl.filter) === -1) {
                    data.push({
                        display: filterEl.display,
                        filter: filterEl.filter
                    });
                    prev.push(filterEl.filter);
                }
            }
        };
        SearchPanes.prototype._getComparisonRows = function (dtPane, colOpts, bins, binsTotal) {
            var vals = dtPane.table.rows().data();
            var options = colOpts.options !== undefined ? colOpts.options :
                colOpts.searchPanes !== undefined && colOpts.searchPanes.options !== undefined ?
                    colOpts.searchPanes.options :
                    undefined;
            console.log(options);
            if (options === undefined) {
                return;
            }
            var tableVals = this.s.dt.rows({ search: 'applied' }).data().toArray();
            var appRows = this.s.dt.rows({ search: 'applied' });
            var tableValsTotal = this.s.dt.rows().data().toArray();
            var allRows = this.s.dt.rows();
            dtPane.table.clear();
            var rows = [];
            for (var _i = 0, options_1 = options; _i < options_1.length; _i++) {
                var comp = options_1[_i];
                var comparisonObj = {
                    display: comp.label !== '' ? comp.label : this.c.emptyMessage,
                    filter: typeof comp.value === 'function' ? comp.value : [],
                    shown: 0,
                    total: 0
                };
                if (typeof comp.value === 'function') {
                    var count = 0;
                    var total = 0;
                    for (var tVal = 0; tVal < tableVals.length; tVal++) {
                        if (comp.value.call(this.s.dt, tableVals[tVal], appRows[0][tVal])) {
                            count++;
                        }
                    }
                    for (var i = 0; i < tableValsTotal.length; i++) {
                        if (comp.value.call(this.s.dt, tableValsTotal[i], allRows[0][i])) {
                            total++;
                        }
                    }
                    comparisonObj = this._comparisonStatUpdate(comp, comparisonObj, count, total);
                }
                else {
                    for (var _a = 0, vals_1 = vals; _a < vals_1.length; _a++) {
                        var val = vals_1[_a];
                        var condition = comp.condition;
                        if ((condition === '==' && val.filter === comp.value) ||
                            (condition === '!=' && val.filter !== comp.value) ||
                            (condition === '<' && val.filter < comp.value) ||
                            (condition === '>' && val.filter > comp.value) ||
                            (condition === '<=' && val.filter <= comp.value) ||
                            (condition === '>=' && val.filter >= comp.value) ||
                            (condition === 'includes' && val.filter.indexOf(comp.value) !== -1)) {
                            comparisonObj = this._comparisonStatUpdate(val, comparisonObj, bins[val.filter], binsTotal[val.filter]);
                        }
                    }
                }
                if (!this.c.cascadePanes || (this.c.cascadePanes && comparisonObj.shown !== 0)) {
                    rows.push(dtPane.table.row.add(comparisonObj));
                }
            }
            return rows;
        };
        SearchPanes.prototype._getBonusOptions = function (Idx) {
            var defaults = {
                grouping: undefined,
                orthogonal: {
                    comparison: undefined,
                    display: 'display',
                    hideCount: false,
                    search: 'filter',
                    show: undefined,
                    threshold: undefined
                },
                preSelect: undefined
            };
            return $.extend(true, {}, defaults, this.c.panes[Idx] !== undefined ? this.c.panes[Idx] : {});
        };
        SearchPanes.prototype._getOptions = function (colIdx) {
            var table = this.s.dt;
            var rowLength = table.columns().eq(0).toArray().length;
            var defaults = {
                grouping: undefined,
                orthogonal: {
                    comparison: undefined,
                    display: 'display',
                    hideCount: false,
                    search: 'filter',
                    show: undefined,
                    threshold: undefined
                },
                preSelect: undefined
            };
            return $.extend(true, {}, defaults, table.settings()[0].aoColumns[colIdx].searchPanes);
        };
        SearchPanes.prototype._getSelected = function (pane, selectArray, filterCount) {
            if (pane !== undefined) {
                var selected = pane.table.rows({ selected: true }).data().toArray().length;
                if (selected > 0) {
                    this.s.filteringActive = true;
                }
                selectArray.push(selected);
                filterCount += selected;
            }
            else {
                selectArray.push(0);
            }
            return filterCount;
        };
        SearchPanes.prototype._pane = function (idx) {
            var _this = this;
            var table = this.s.dt;
            var classes = this.classes;
            var rowLength = table.columns().eq(0).toArray().length;
            var tableCols = this.s.columns;
            var container = this.dom.container;
            var colExists = idx < rowLength;
            var column = table.column(colExists ? idx : 0);
            this.s.colOpts.push(colExists ? this._getOptions(idx) : this._getBonusOptions(idx - rowLength));
            var colOpts = this.s.colOpts[idx];
            var colType = this._getColType(table, colExists ? idx : 0);
            var clear = $('<button class="clear" type="button">Clear Pane</button>');
            console.log(this.c.panes, idx, rowLength);
            var dt = $('<table><thead><tr><th>' + (colExists ?
                $(column.header()).text() :
                this.c.panes[idx - rowLength].header) + '</th><th/></tr></thead></table>');
            var arrayFilter = [];
            var arrayTotals = [];
            var binsTotal;
            var countMessage = table.i18n('searchPanes.count', '{total}');
            var filteredMessage = table.i18n('searchPanes.countFiltered', '{shown} ({total})');
            // Add an empty array for each column for holding the selected values
            tableCols.push([]);
            // Custom search function for table
            $.fn.dataTable.ext.search.push(function (settings, searchData, dataIndex, origData) {
                if (settings.nTable !== table.table().node()) {
                    return true;
                }
                // If no data has been selected then show all
                if (tableCols[idx].length === 0) {
                    return true;
                }
                var filter = '';
                if (colExists) {
                    // Get the current filtered data
                    filter = searchData[idx];
                    if (colOpts.orthogonal.filter !== 'filter') {
                        filter = typeof (colOpts.orthogonal) === 'string'
                            ? table.cell(dataIndex, idx).render(colOpts.orthogonal)
                            : table.cell(dataIndex, idx).render(colOpts.orthogonal.search);
                    }
                }
                // For each item selected in the pane, check if it is available in the cell
                for (var _i = 0, _a = tableCols[idx]; _i < _a.length; _i++) {
                    var colSelect = _a[_i];
                    if (Array.isArray(colSelect.filter)) {
                        for (var _b = 0, _c = colSelect.filter; _b < _c.length; _b++) {
                            var filterP = _c[_b];
                            if (filter.indexOf(filterP) !== -1) {
                                return true;
                            }
                        }
                    }
                    else if (typeof colSelect.filter === 'function') {
                        if (colSelect.filter.call(table, table.row(dataIndex).data(), dataIndex)) {
                            if (!_this.s.redraw) {
                                _this.rebuildPane(rowLength + idx);
                            }
                            return true;
                        }
                        return false;
                    }
                    else {
                        if (filter === colSelect.filter) {
                            return true;
                        }
                    }
                }
                return false;
            });
            var bins = {};
            if (colExists) {
                this._populatePane(table, colOpts, classes, idx, arrayFilter);
                bins = this._binData(this._flatten(arrayFilter));
                // If the option viewTotal is true then find
                // the total count for the whole table to display alongside the displayed count
                if (this.c.viewTotal) {
                    this._detailsPane(table, colOpts, classes, idx, arrayTotals);
                    binsTotal = this._binData(this._flatten(arrayTotals));
                }
                else {
                    binsTotal = bins;
                }
                // Don't show the pane if there isn't enough variance in the data
                // colOpts.options is checked incase the options to restrict the choices are selected
                if ((colOpts.show === undefined && (colOpts.threshold === undefined ?
                    this._uniqueRatio(Object.keys(bins).length, table.rows()[0].length) > this.c.threshold :
                    this._uniqueRatio(Object.keys(bins).length, table.rows()[0].length) > colOpts.threshold))
                    || colOpts.show === false
                    || (colOpts.show !== undefined && colOpts.show !== true)
                    || (colOpts.show !== true && Object.keys(bins).length <= 1)) {
                    return;
                }
                if (Object.keys(bins).length < this.c.minRows && (colOpts.options === undefined
                    && (colOpts.searchPanes === undefined || colOpts.searchPanes.options === undefined))) {
                    return;
                }
            }
            // If the varaince is accceptable then display the search pane
            if (this.c.clear) {
                $(container).append(clear);
            }
            $(container).append(dt);
            var dtPane = {
                index: this.panes.length,
                table: $(dt).DataTable($.extend(true, {
                    columnDefs: [
                        {
                            data: 'display',
                            render: function (data, type, row) {
                                return !_this.c.dataLength ?
                                    data : data.length > _this.c.dataLength ?
                                    data.substr(0, _this.c.dataLength) + '...' :
                                    data;
                            },
                            targets: 0
                        },
                        {
                            className: 'dtsp-countColumn',
                            data: 'count',
                            render: function (data, type, row) {
                                var message;
                                _this.s.filteringActive
                                    ? message = filteredMessage.replace(/{total}/, row.total)
                                    : message = countMessage.replace(/{total}/, row.total);
                                message = message.replace(/{shown}/, row.shown);
                                return message;
                            },
                            targets: 1,
                            width: this.c.countWidth
                        }
                    ],
                    info: false,
                    paging: false,
                    scrollY: '200px',
                    searching: true,
                    select: true
                }, this.c.dtOpts, colOpts !== undefined ? colOpts.dtOpts : {}))
            };
            if (colExists) {
                // On initialisation, do we need to set a filtering value from a
                // saved state or init option?
                var search = column.search();
                search = search ? search.substr(1, search.length - 2).split('|') : [];
                var dataFilter = [];
                var prev = [];
                // Make sure that the values stored are unique
                this._findUnique(prev, dataFilter, arrayFilter);
                // Count the number of empty cells
                var count_1 = 0;
                arrayFilter.forEach(function (element) {
                    if (element.filter === '') {
                        count_1++;
                    }
                });
                // Add all of the search options to the pane
                for (var i = 0, ien = dataFilter.length; i < ien; i++) {
                    if (dataFilter[i]) {
                        for (var _i = 0, arrayFilter_2 = arrayFilter; _i < arrayFilter_2.length; _i++) {
                            var j = arrayFilter_2[_i];
                            if (dataFilter[i].filter === j.filter || dataFilter[i] === j.display) {
                                var row = dtPane.table.row.add({
                                    display: j.display !== '' ? j.display : this.c.emptyMessage,
                                    filter: j.filter,
                                    shown: bins[dataFilter[i].filter],
                                    total: bins[dataFilter[i].filter]
                                });
                                break;
                            }
                        }
                    }
                    else {
                        dtPane.table.row.add({ filter: this.c.emptyMessage, shown: count_1, total: count_1, display: this.c.emptyMessage });
                    }
                }
            }
            console.log(colOpts);
            if (colOpts.options !== undefined ||
                (colOpts.searchPanes !== undefined && colOpts.searchPanes.options !== undefined)) {
                this._getComparisonRows(dtPane, colOpts, bins, binsTotal);
            }
            $.fn.dataTable.select.init(dtPane.table);
            dtPane.table.draw();
            if (colOpts.hideCount || this.c.hideCount) {
                dtPane.table.column(1).visible(false);
            }
            var t0;
            // When an item is selected on the pane, add these to the array which holds selected items.
            // Custom search will perform.
            dtPane.table.on('select.dt', function () {
                clearTimeout(t0);
                if (!_this.s.updating) {
                    _this._updateTable(dtPane, tableCols, idx, true);
                    _this._updateFilterCount();
                }
            });
            // When an item is deselected on the pane, re add the currently selected items to the array
            // which holds selected items. Custom search will be performed.
            dtPane.table.on('deselect.dt', function () {
                t0 = setTimeout(function () {
                    _this._updateTable(dtPane, tableCols, idx, false);
                    _this._updateFilterCount();
                }, 50);
            });
            if (this.c.clear) {
                clear[0].addEventListener('click', function () {
                    _this._clearPane(_this.panes[idx]);
                });
            }
            return dtPane;
        };
        SearchPanes.prototype._populatePaneArray = function (colOpts, table, rowIdx, idx, classes, array) {
            // Retrieve the rendered data from the cell
            var filter = typeof (colOpts.orthogonal) === 'string'
                ? table.cell(rowIdx, idx).render(colOpts.orthogonal)
                : table.cell(rowIdx, idx).render(colOpts.orthogonal.search);
            var display = typeof (colOpts.orthogonal) === 'string'
                ? table.cell(rowIdx, idx).render(colOpts.orthogonal)
                : table.cell(rowIdx, idx).render(colOpts.orthogonal.display);
            // If the filter is an array then take a note of this, and add the elements to the arrayFilter array
            if (Array.isArray(filter) || filter instanceof DataTable.Api) {
                if (classes.arrayCols.indexOf(idx) === -1) {
                    classes.arrayCols.push(idx);
                }
                if (filter instanceof DataTable.Api) {
                    filter = filter.toArray();
                    display = display.toArray();
                }
                if (filter.length === display.length) {
                    for (var i = 0; i < filter.length; i++) {
                        array.push({
                            display: display[i],
                            filter: filter[i]
                        });
                    }
                }
                else {
                    throw new Error('display and filter not the same length');
                }
            }
            else {
                array.push({
                    display: display,
                    filter: filter
                });
            }
        };
        SearchPanes.prototype._populatePane = function (table, colOpts, classes, idx, arrayFilter) {
            var _this = this;
            table.rows({ search: 'applied' }).every(function (rowIdx, tableLoop, rowLoop) {
                _this._populatePaneArray(colOpts, table, rowIdx, idx, classes, arrayFilter);
            });
        };
        SearchPanes.prototype.rebuild = function () {
            var _this = this;
            this.dom.container.empty();
            this.s.dt
                .columns(this.c.columns)
                .eq(0)
                .each(function (idx) {
                _this._pane(idx);
            });
        };
        SearchPanes.prototype.rebuildPane = function (callerIndex) {
            this.s.updating = true;
            var selectArray = [];
            var filterCount = 0;
            var filterIdx;
            var pane = this.panes[callerIndex];
            // If the viewTotal option is active then it must be determined whether there is a filter in place already
            if (this.c.viewTotal) {
                // Check each pane to find how many filters are in place in each
                filterCount = this._getSelected(pane, selectArray, filterCount);
                // If there is only one in place then find the index of the corresponding pane
                if (filterCount === 1) {
                    filterIdx = selectArray.indexOf(1);
                }
            }
            this._updateCommon(pane, callerIndex, filterIdx);
            this.s.updating = false;
        };
        SearchPanes.prototype._reloadSelect = function (loadedFilter, that) {
            if (loadedFilter === undefined) {
                return;
            }
            // For each pane, check that the loadedFilter list exists and is not null,
            // find the id of each search item and set it to be selected.
            for (var i = 0; i < that.panes.length; i++) {
                if (loadedFilter.searchPanes[i] !== null && loadedFilter.searchPanes[i] !== undefined) {
                    var table = that.panes[i].table;
                    var rows = table.rows({ order: 'index' }).data().pluck('filter');
                    for (var _i = 0, _a = loadedFilter.searchPanes[i]; _i < _a.length; _i++) {
                        var filter = _a[_i];
                        var id = rows.indexOf(filter);
                        if (id > -1) {
                            table.row(id).select();
                        }
                    }
                }
            }
        };
        SearchPanes.prototype._searchExtras = function (paneIn) {
            var table = this.s.dt;
            this.s.updating = true;
            var filters = paneIn.table.rows({ selected: true }).data().pluck('filter').toArray();
            var nullIndex = filters.indexOf(this.c.emptyMessage);
            var container = $(paneIn.table.table().container());
            // If null index is found then search for empty cells as a filter.
            if (nullIndex > -1) {
                filters[nullIndex] = '';
            }
            // If a filter has been applied then outline the respective pane, remove it when it no longer is.
            if (filters.length > 0) {
                container.addClass('selected');
            }
            else if (filters.length === 0) {
                container.removeClass('selected');
            }
            table.draw();
            this.s.updating = false;
        };
        SearchPanes.prototype._uniqueRatio = function (bins, rowCount) {
            return bins / rowCount;
        };
        SearchPanes.prototype._updateCommon = function (pane, callerIndex, filterIdx, draw) {
            if (draw === void 0) { draw = false; }
            // Update the panes if doing a deselect. if doing a select then
            // update all of the panes except for the one causing the change
            if (pane !== undefined && (pane.index !== callerIndex || !this.s.filteringActive)) {
                var selected = pane.table.rows({ selected: true }).data().toArray();
                var colOpts = this.s.colOpts[pane.index];
                var arrayFilter = [];
                var arrayTotals = [];
                var table = this.s.dt;
                var rowLength = table.columns().eq(0).toArray().length;
                var colExists = pane.index < rowLength;
                var classes = this.classes;
                var data = [];
                var prev = [];
                var binsTotal = void 0;
                var scrollTop = $(pane.table.table().node()).parent()[0].scrollTop;
                // Clear the pane in preparation for adding the updated search options
                pane.table.clear();
                var bins = {};
                if (colExists) {
                    this._populatePane(table, colOpts, classes, pane.index, arrayFilter);
                    bins = this._binData(this._flatten(arrayFilter));
                    // If the viewTotal option is selected then find the totals for the table
                    if (this.c.viewTotal) {
                        this._detailsPane(table, colOpts, classes, pane.index, arrayTotals);
                        binsTotal = this._binData(this._flatten(arrayTotals));
                        this._findUnique(prev, data, arrayTotals);
                    }
                    else {
                        binsTotal = bins;
                    }
                    this._findUnique(prev, data, arrayFilter);
                    // If a filter has been removed so that only one remains then the remaining filter should have
                    // the non filtered formatting, therefore set filteringActive to be false.
                    if (filterIdx !== undefined && filterIdx === pane.index) {
                        this.s.filteringActive = false;
                    }
                    var _loop_1 = function (dataP) {
                        if (dataP) {
                            var row = void 0;
                            // If both view Total and cascadePanes have been selected and the count of the row is not 0 then add it to pane
                            // Do this also if the viewTotal option has been selected and cascadePanes has not
                            if (bins[dataP.filter] !== undefined || !this_1.c.cascadePanes) {
                                row = pane.table.row.add({
                                    display: dataP.display !== '' ? dataP.display : this_1.c.emptyMessage,
                                    filter: dataP.filter,
                                    shown: !this_1.c.viewTotal
                                        ? bins[dataP.filter]
                                        : bins[dataP.filter] !== undefined
                                            ? bins[dataP.filter]
                                            : '0',
                                    total: this_1.c.viewTotal
                                        ? String(binsTotal[dataP.filter])
                                        : bins[dataP.filter]
                                });
                            }
                            // Find out if the filter was selected in the previous search, if so select it and remove from array.
                            var selectIndex = selected.findIndex(function (element) {
                                return element.filter === dataP.filter;
                            });
                            if (selectIndex !== -1) {
                                row.select();
                                selected.splice(selectIndex, 1);
                            }
                        }
                    };
                    var this_1 = this;
                    for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                        var dataP = data_1[_i];
                        _loop_1(dataP);
                    }
                }
                if ((colOpts.searchPanes !== undefined && colOpts.searchPanes.options !== undefined) ||
                    colOpts.options !== undefined) {
                    var rows = this._getComparisonRows(pane, colOpts, bins, binsTotal);
                    var _loop_2 = function (row) {
                        var selectIndex = selected.findIndex(function (element) {
                            if (element.display === row.data().display) {
                                return true;
                            }
                        });
                        if (selectIndex !== -1) {
                            row.select();
                            selected.splice(selectIndex, 1);
                        }
                    };
                    for (var _a = 0, rows_1 = rows; _a < rows_1.length; _a++) {
                        var row = rows_1[_a];
                        _loop_2(row);
                    }
                }
                // Set filtering Active to be again if it was previously set to false,
                // so that succeeding panes have the correct formatting.
                if (filterIdx !== undefined && filterIdx === pane.index) {
                    this.s.filteringActive = true;
                }
                // Add search options which were previously selected but whos results are no
                // longer present in the resulting data set.
                for (var _b = 0, selected_1 = selected; _b < selected_1.length; _b++) {
                    var selectedEl = selected_1[_b];
                    if ((draw && bins[selectedEl.filter] !== undefined) || !draw) {
                        var row = pane.table.row.add({ filter: selectedEl.filter, shown: 0, total: 0, display: selectedEl.display });
                        row.select();
                    }
                    else {
                        var id = void 0;
                        for (var _c = 0, _d = this.s.columns[pane.index]; _c < _d.length; _c++) {
                            var selection = _d[_c];
                            if (selection.filter === selectedEl.filter) {
                                id = this.s.columns[pane.index].indexOf(selection);
                                break;
                            }
                        }
                        if (id !== undefined) {
                            this.s.columns[pane.index].splice(id, 1);
                        }
                    }
                }
                if (pane.table.rows().data().toArray().length === 0) {
                    this._detailsPane(table, colOpts, classes, pane.index, arrayTotals);
                    binsTotal = this._binData(this._flatten(arrayTotals));
                    this._findUnique(prev, data, arrayTotals);
                    for (var _e = 0, data_2 = data; _e < data_2.length; _e++) {
                        var element = data_2[_e];
                        pane.table.row.add({
                            display: element.filter,
                            filter: element.filter,
                            shown: binsTotal[element.filter],
                            total: binsTotal[element.filter]
                        });
                    }
                }
                pane.table.draw();
                pane.table.table().node().parentNode.scrollTop = scrollTop;
            }
        };
        SearchPanes.prototype._updateFilterCount = function () {
            var filterCount = 0;
            for (var _i = 0, _a = this.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane !== undefined) {
                    filterCount += pane.table.rows({ selected: true }).data().toArray().length;
                }
            }
            var message = this.s.dt.i18n('searchPanes.title', 'Filters Active - %d', filterCount);
            this.dom.title[0].innerHTML = (message);
        };
        SearchPanes.prototype._updatePane = function (callerIndex, select, draw) {
            if (draw === void 0) { draw = false; }
            this.s.updating = true;
            this.s.filteringActive = false;
            var selectArray = [];
            var filterCount = 0;
            var filterIdx;
            // If the viewTotal option is active then it must be determined whether there is a filter in place already
            if (this.c.viewTotal) {
                // There is if select is true
                if (select) {
                    this.s.filteringActive = true;
                }
                else {
                    // Check each pane to find how many filters are in place in each
                    for (var _i = 0, _a = this.panes; _i < _a.length; _i++) {
                        var pane = _a[_i];
                        this._getSelected(pane, selectArray, filterCount);
                    }
                }
                // If there is only one in place then find the index of the corresponding pane
                if (filterCount === 1) {
                    filterIdx = selectArray.indexOf(1);
                }
            }
            for (var _b = 0, _c = this.panes; _b < _c.length; _b++) {
                var pane = _c[_b];
                this._updateCommon(pane, callerIndex, filterIdx, draw);
            }
            this.s.updating = false;
        };
        SearchPanes.prototype._updateTable = function (dtPane, tableCols, idx, select) {
            var selectedRows = dtPane.table.rows({ selected: true }).data().toArray();
            tableCols[idx] = selectedRows;
            this._searchExtras(dtPane);
            // If either of the options that effect how the panes are displayed are selected then update the Panes
            if (this.c.cascadePanes || this.c.viewTotal) {
                this._updatePane(dtPane.index, select);
            }
        };
        SearchPanes.prototype._getColType = function (table, idx) {
            return table.settings()[0].aoColumns[idx] !== undefined ?
                table.settings()[0].aoColumns[idx].sType :
                table.settings()[0].aoColumns[0].sType;
        };
        SearchPanes.prototype._flatten = function (arr) {
            return arr.reduce(function flatten(res, a) {
                Array.isArray(a) ? a.reduce(flatten, res) : res.push(a);
                return res;
            }, []);
        };
        SearchPanes.version = '0.0.2';
        SearchPanes["class"] = {
            arrayCols: [],
            clear: 'clear',
            clearAll: 'clearAll',
            container: 'dt-searchPanes',
            hide: 'hide',
            item: {
                count: 'count',
                label: 'label',
                selected: 'selected'
            },
            pane: {
                active: 'filtering',
                container: 'pane',
                scroller: 'scroller',
                title: 'title'
            },
            title: 'dtsp-title'
        };
        SearchPanes.defaults = {
            cascadePanes: false,
            clear: true,
            container: function (dt) {
                return dt.table().container();
            },
            columns: undefined,
            countWidth: '50px',
            dataLength: 30,
            emptyMessage: '<i>No Data</i>',
            hide: true,
            insert: 'prepend',
            maxOptions: 5,
            minRows: 1,
            searchBox: true,
            threshold: 0.6,
            viewTotal: false
        };
        return SearchPanes;
    }());
    $.fn.dataTable.SearchPanes = SearchPanes;
    $.fn.DataTable.SearchPanes = SearchPanes;
    DataTable.Api.register('searchPanes.rebuild()', function () {
        return this.iterator('table', function () {
            if (this.searchPanes) {
                this.searchPanes.rebuild();
            }
        });
    });
    DataTable.Api.register('column().paneOptions()', function (options) {
        return this.iterator('column', function (idx) {
            var col = this.aoColumns[idx];
            if (!col.searchPanes) {
                col.searchPanes = {};
            }
            col.searchPanes.values = options;
            if (this.searchPanes) {
                this.searchPanes.rebuild();
            }
        });
    });
    $(document).on('init.dt', function (e, settings, json) {
        if (e.namespace !== 'dt') {
            return;
        }
        var init = settings.oInit.searchPanes;
        var defaults = DataTable.defaults.searchPanes;
        if (init || defaults) {
            var opts = $.extend({}, init, defaults);
            if (init !== false) {
                var sep = new SearchPanes(settings, opts);
            }
        }
    });
    return SearchPanes;
}));
var apiRegister = $.fn.dataTable.Api.register;
apiRegister('searchPanes()', function () {
    return this;
});
apiRegister('searchPanes.rebuildPane()', function (callerIndex) {
    var ctx = this.context[0];
    ctx._searchPanes.rebuildPane(callerIndex);
});
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var DataTable = $.fn.dataTable;
import SearchPane from './searchPane';
var SearchPanes = /** @class */ (function () {
    function SearchPanes(paneSettings, opts) {
        var _this = this;
        // Check that the required version of DataTables is included
        if (!DataTable || !DataTable.versionCheck || !DataTable.versionCheck('1.10.0')) {
            throw new Error('SearchPane requires DataTables 1.10 or newer');
        }
        // Check that Select is included
        if (!DataTable.select) {
            throw new Error('SearchPane requires Select');
        }
        var table = new DataTable.Api(paneSettings);
        this.panes = [];
        this.classes = $.extend(true, {}, SearchPanes.classes);
        // Get options from user
        this.c = $.extend(true, {}, SearchPanes.defaults, opts);
        // Add extra elements to DOM object including clear
        this.dom = {
            clearAll: $('<button type="button">Clear All</button>').addClass(this.classes.clearAll),
            container: $('<div/>').addClass(this.classes.panes),
            options: $('<div/>').addClass(this.classes.container),
            panes: $('<div/>').addClass(this.classes.container),
            title: $('<div/>').addClass(this.classes.title),
            wrapper: $('<div/>')
        };
        this.s = {
            colOpts: [],
            dt: table
        };
        table.settings()[0]._searchPanes = this;
        this.dom.clearAll[0].innerHTML = table.i18n('searchPanes.clearMessage', 'Clear All');
        if (this.s.dt.settings()[0]._bInitComplete) {
            console.log("92");
            console.log(this.s.dt.data().toArray());
            this._startup(table, paneSettings, opts);
        }
        else {
            this.s.dt.one('init', function () {
                console.log("97");
                _this._startup(table, paneSettings, opts);
            });
        }
    }
    /**
     * Call the adjust function for all of the panes
     */
    SearchPanes.prototype.adjust = function () {
        // Adjust the width of the columns for all of the panes where the table is defined
        for (var _i = 0, _a = this.panes; _i < _a.length; _i++) {
            var pane = _a[_i];
            if (pane.s.dtPane !== undefined) {
                pane.adjust();
            }
        }
    };
    /**
     * Clear the selections of all of the panes
     */
    SearchPanes.prototype.clearSelections = function () {
        // Load in all of the searchBoxes in the documents
        var searches = document.getElementsByClassName(this.classes.search);
        // For each searchBox set the input text to be empty and then trigger
        //  an input on them so that they no longer filter the panes
        for (var i = 0; i < searches.length; i++) {
            $(searches[i]).val('');
            $(searches[i]).trigger('input');
        }
        var returnArray = [];
        // For every pane, clear the selections in the pane
        for (var _i = 0, _a = this.panes; _i < _a.length; _i++) {
            var pane = _a[_i];
            if (pane.s.dtPane !== undefined) {
                returnArray.push(pane._clearPane());
            }
        }
        return returnArray;
    };
    /**
     * returns the container node for the searchPanes
     */
    SearchPanes.prototype.getNode = function () {
        var _this = this;
        if (this.s.dt.settings()[0]._bInitComplete) {
            console.log("142", this._attachPaneContainer());
            return this._attachPaneContainer();
        }
        else {
            this.s.dt.one('init', function () {
                console.log("147", _this._attachPaneContainer());
                return _this._attachPaneContainer();
            });
        }
    };
    /**
     * rebuilds all of the panes
     */
    SearchPanes.prototype.rebuild = function (targetIdx) {
        if (targetIdx === void 0) { targetIdx = false; }
        return __awaiter(this, void 0, void 0, function () {
            var returnArray, _i, _a, pane, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        // As a rebuild from scratch is required, empty the searchpanes container.
                        this.dom.container.empty();
                        returnArray = [];
                        _i = 0, _a = this.panes;
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        pane = _a[_i];
                        if (targetIdx !== false && pane.s.index !== targetIdx) {
                            return [3 /*break*/, 3];
                        }
                        _c = (_b = returnArray).push;
                        return [4 /*yield*/, pane.rebuildPane()];
                    case 2:
                        _c.apply(_b, [_d.sent()]);
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        // Attach panes, clear buttons, and title bar to the document
                        this._updateFilterCount();
                        console.log("235");
                        this._attachPaneContainer();
                        DataTable.tables({ visible: true, api: true }).columns.adjust();
                        // Update the title bar to show how many filters have been selected
                        this.panes[0]._updateFilterCount();
                        // If a single pane has been rebuilt then return only that pane
                        if (returnArray.length === 1) {
                            return [2 /*return*/, returnArray[0]];
                        }
                        // Otherwise return all of the panes that have been rebuilt
                        else {
                            return [2 /*return*/, returnArray];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Redraws all of the panes
     */
    SearchPanes.prototype.redrawPanes = function () {
        var table = this.s.dt;
        // Only do this if the redraw isn't being triggered by the panes updating themselves
        if (!this.s.updating) {
            var filterActive = true;
            // If the number of rows currently visible is equal to the number of rows in the table
            //  then there can't be any filtering taking place
            if (table.rows({ search: 'applied' }).data().toArray().length === table.rows().data().toArray().length) {
                filterActive = false;
            }
            // Update every pane with a table defined
            for (var _i = 0, _a = this.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.s.dtPane !== undefined) {
                    pane._updatePane(false, filterActive, true);
                }
            }
            // Update the label that shows how many filters are in place
            this._updateFilterCount();
        }
    };
    /**
     * repopulates the desired pane by extracting new data from the table. faster than doing a rebuild
     * @param callerIndex the index of the pane to be rebuilt
     */
    SearchPanes.prototype.repopulatePane = function (callerIndex) {
        if (callerIndex === void 0) { callerIndex = false; }
        var returnArray = [];
        // Rebuild each pane individually, if a specific pane has been selected then only rebuild that one
        for (var _i = 0, _a = this.panes; _i < _a.length; _i++) {
            var pane = _a[_i];
            if (callerIndex !== false && pane.s.index !== callerIndex) {
                continue;
            }
            returnArray.push(pane.repopulatePane());
        }
        // If a single pane has been rebuilt then return only that pane
        if (returnArray.length === 1) {
            return returnArray[0];
        }
        // Otherwise return all of the panes that have been rebuilt
        else {
            return returnArray;
        }
    };
    /**
     * Attach the panes, buttons and title to the document
     */
    SearchPanes.prototype._attach = function () {
        var titleRow = $('<div/>').addClass(this.classes.titleRow);
        $(this.dom.title).appendTo(titleRow);
        // If the clear button is permitted attach it
        if (this.c.clear) {
            $(this.dom.clearAll).appendTo(titleRow);
        }
        $(titleRow).appendTo(this.dom.container);
        // Attach the container for each individual pane to the overall container
        for (var _i = 0, _a = this.panes; _i < _a.length; _i++) {
            var pane = _a[_i];
            $(pane.dom.container).appendTo(this.dom.panes);
        }
        // Attach everything to the document
        $(this.dom.panes).appendTo(this.dom.container);
        return this.dom.container;
    };
    /**
     * If there are no panes to display then this method is called to either
     *   display a message in their place or hide them completely.
     */
    SearchPanes.prototype._attachMessage = function () {
        // Create a message to display on the screen
        var emptyMessage = $('<div/>');
        var message = this.s.dt.i18n('searchPanes.emptyPanes', '');
        // If the message is an empty string then searchPanes.emptyPanes is undefined,
        //  therefore the pane container should be removed from the display
        if (message === '') {
            $(this.dom.container).empty();
            return;
        }
        // Otherwise display the message
        emptyMessage[0].innerHTML = message;
        $(this.dom.container).empty();
        emptyMessage.appendTo(this.dom.container);
        return this.dom.container;
    };
    /**
     * Attaches the panes to the document and displays a message or hides if there are none
     */
    SearchPanes.prototype._attachPaneContainer = function () {
        // If a pane is to be displayed then attach the normal pane output
        if (this.panes !== undefined) {
            for (var _i = 0, _a = this.panes; _i < _a.length; _i++) {
                var pane = _a[_i];
                if (pane.displayed === true) {
                    console.log("attach");
                    return this._attach();
                    break;
                }
            }
        }
        console.log("attach Message");
        // Otherwise attach the custom message or remove the container from the display
        return this._attachMessage();
    };
    SearchPanes.prototype._startup = function (table, paneSettings, opts) {
        var _this = this;
        // Create Panes
        table
            .columns(this.c.columns)
            .eq(0)
            .each(function (idx) {
            _this.panes.push(new SearchPane(paneSettings, opts, idx, _this.c.layout));
        });
        // If there is any extra custom panes defined then create panes for them too
        var rowLength = table.columns().eq(0).toArray().length;
        if (this.c.panes !== undefined) {
            var paneLength = this.c.panes.length;
            for (var i = 0; i < paneLength; i++) {
                var id = rowLength + i;
                this.panes.push(new SearchPane(paneSettings, opts, id, this.c.layout, this.c.panes[i]));
            }
        }
        // PreSelect any selections which have been defined using the preSelect option
        table
            .columns(this.c.columns)
            .eq(0)
            .each(function (idx) {
            if (_this.panes[idx] !== undefined &&
                _this.panes[idx].s.dtPane !== undefined &&
                _this.panes[idx].s.colOpts.preSelect !== undefined) {
                var tableLength = _this.panes[idx].s.dtPane.rows().data().toArray().length;
                for (var i = 0; i < tableLength; i++) {
                    if (_this.panes[idx].s.colOpts.preSelect.indexOf(_this.panes[idx].s.dtPane.cell(i, 0).data()) !== -1) {
                        _this.panes[idx].s.dtPane.row(i).select();
                        _this.panes[idx]._updateTable(true);
                    }
                }
            }
        });
        // Attach panes, clear buttons, and title bar to the document
        this._updateFilterCount();
        console.log("198");
        this._attachPaneContainer();
        // (DataTable as any).tables({visible: true, api: true}).columns.adjust();
        table.columns(this.c.columns).eq(0).each(function (idx) {
            if (_this.panes[idx] !== undefined && _this.panes[idx].s.dtPane !== undefined) {
                _this.panes[idx].s.dtPane.columns.adjust();
            }
        });
        // Update the title bar to show how many filters have been selected
        this.panes[0]._updateFilterCount();
        // When a draw is called on the DataTable, update all of the panes incase the data in the DataTable has changed
        var initDraw = true;
        table.on('draw.dt', function () {
            _this._updateFilterCount();
            if (initDraw) {
                initDraw = false;
            }
            else {
                if (_this.c.cascadePanes || _this.c.viewTotal) {
                    _this.redrawPanes();
                }
            }
        });
        // When the clear All button has been pressed clear all of the selections in the panes
        if (this.c.clear) {
            this.dom.clearAll[0].addEventListener('click', function () {
                _this.clearSelections();
            });
        }
        table.settings()[0]._searchPanes = this;
    };
    /**
     * Updates the number of filters that have been applied in the title
     */
    SearchPanes.prototype._updateFilterCount = function () {
        var filterCount = 0;
        // Add the number of all of the filters throughout the panes
        for (var _i = 0, _a = this.panes; _i < _a.length; _i++) {
            var pane = _a[_i];
            if (pane.s.dtPane !== undefined) {
                filterCount += pane._updateFilterCount();
            }
        }
        // Run the message through the internationalisation method to improve readability
        var message = this.s.dt.i18n('searchPanes.title', 'Filters Active - %d', filterCount);
        this.dom.title[0].innerHTML = (message);
        this.c.filterChanged(filterCount);
    };
    SearchPanes.version = '0.0.2';
    SearchPanes.classes = {
        arrayCols: [],
        clear: 'dtsp-clear',
        clearAll: 'dtsp-clearAll',
        container: 'dtsp-searchPanes',
        hide: 'dtsp-hide',
        item: {
            count: 'dtsp-count',
            label: 'dtsp-label',
            selected: 'dtsp-selected'
        },
        pane: {
            active: 'dtsp-filtering',
            container: 'dtsp-pane',
            scroller: 'dtsp-scroller',
            title: 'dtsp-title'
        },
        panes: 'dtsp-panesContainer',
        search: 'dtsp-search',
        title: 'dtsp-title',
        titleRow: 'dtsp-titleRow'
    };
    // Define SearchPanes default options
    SearchPanes.defaults = {
        clear: true,
        container: function (dt) {
            return dt.table().container();
        },
        columns: undefined,
        filterChanged: function () {
            return;
        },
        layout: 'columns-3'
    };
    return SearchPanes;
}());
export default SearchPanes;

/*! Bootstrap integration for DataTables' SearchPanes
 * ©2016 SpryMedia Ltd - datatables.net/license
 */
// Hack to allow TypeScript to compile our UMD
declare var define: {
	(string, Function): any;
	amd: string;
};
(function(factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery', 'datatables.net-bs4', 'datatables.net-searchPanes'], function($) {
			return factory($, window, document);
		});
	}
	else if (typeof exports === 'object') {
		// CommonJS
		module.exports = function(root, $) {
			if (! root) {
				root = window;
			}

			if (! $ || ! $.fn.dataTable) {
				$ = require('datatables.net-bs4')(root, $).$;
			}

			if (! $.fn.dataTable.searchPanes) {
				require('datatables.net-searchPanes')(root, $);
			}

			return factory($, root, root.document);
		};
	}
	else {
		// Browser
		factory(jQuery, window, document);
	}
}(function($, window, document) {
'use strict';
let DataTable = $.fn.dataTable;

$.extend(true, DataTable.SearchPane.classes, {
	buttonGroup: 'btn-group col justify-content-end',
	disabledButton: 'disabled',
	dull: '',
	narrow: 'col',
	pane: {
		container: 'table',
	},
	paneButton: 'btn btn-light',
	pill: 'pill badge badge-pill badge-secondary',
	search: 'col-sm form-control search',
	searchCont: 'input-group col-sm',
	searchLabelCont: 'input-group-append',
	subRow1: 'dtsp-subRow1',
	subRow2: 'dtsp-subRow2',
	table: 'table table-sm table-borderless',
	topRow: 'dtsp-topRow row',
});

$.extend(true, DataTable.SearchPanes.classes, {
	clearAll: 'dtsp-clearAll col-auto btn btn-light',
	container: 'dtsp-searchPanes',
	panes: 'dtsp-panes dtsp-container',
	title: 'dtsp-title col',
	titleRow: 'dtsp-titleRow row',
});

return DataTable.searchPanes;
}));

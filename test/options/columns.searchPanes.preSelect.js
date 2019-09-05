describe('searchPanes - options - columns.searchPanes.preSelect', function() {
	let table;

	dt.libs({
		js: ['jquery', 'datatables', 'select', 'searchpanes'],
		css: ['datatables', 'select', 'searchpanes']
	});

	describe('Functional tests', function() {
		dt.html('basic');
		it('Check defaults (undefined)', function() {
			table = $('#example').DataTable({
				dom: 'Sfrtip'
			});

			expect($('tr.selected').length).toBe(0);
		});

		dt.html('basic');
		it('Setup some preSelects', function() {
			table = $('#example').DataTable({
				dom: 'Sfrtip',
				columnDefs: [
					{
						searchPanes: {
							preSelect: ['Not there']
						},
						targets: [1]
					},
					{
						searchPanes: {
							preSelect: ['New York', 'San Francisco']
						},
						targets: [2]
					},
					{
						searchPanes: {
							preSelect: ['66', 'Not there']
						},
						targets: [3]
					}
				]
			});

			expect($('tr.selected').length).toBe(3);
		});
		it('When just an absent value', function() {
			expect($('div.dtsp-searchPane:eq(1) tr.selected').length).toBe(0);
		});
		it('When all present values', function() {
			expect($('div.dtsp-searchPane:eq(2) tr.selected').length).toBe(2);
			expect($('div.dtsp-searchPane:eq(2) tr.selected:eq(0) td:eq(0)').text()).toBe('New York');
			expect($('div.dtsp-searchPane:eq(2) tr.selected:eq(1) td:eq(0)').text()).toBe('San Francisco');
		});
		it('When absent and present values', function() {
			expect($('div.dtsp-searchPane:eq(3) tr.selected').length).toBe(1);
			expect($('div.dtsp-searchPane:eq(3) tr.selected:eq(0) td:eq(0)').text()).toBe('66');
		});
		it('Ensure search performed', function() {
			expect($('#example tbody tr:eq(0) td:eq(0)').text()).toBe('Ashton Cox');
		});
		it('Ensure selections not fixed', function() {
			$('div.dtsp-searchPane:eq(2) tbody tr:eq(0) td:eq(0)').click();
			expect($('div.dtsp-searchPane:eq(2) tr.selected').length).toBe(1);
			expect($('div.dtsp-searchPane:eq(2) tr.selected:eq(0) td:eq(0)').text()).toBe('Edinburgh');
		});
		it('Ensure search performed', function() {
			expect($('#example tbody tr:eq(0) td:eq(0)').text()).toBe('No matching records found');
		});
	});
});

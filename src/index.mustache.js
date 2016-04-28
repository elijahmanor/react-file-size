var versions = [
	{{#versions}}
	{
		version: "{{version}}",
		size: "{{size}}",
		sizeGzipped: "{{sizeGzipped}}",
		minified: "{{minified}}",
		minifiedGzipped: "{{minifiedGzipped}}",
	},
	{{/versions}}
];

google.charts.load( 'current', { 'packages': [ 'line' ] } );
google.charts.setOnLoadCallback( drawChart );

function drawChart() {
	var data = new google.visualization.DataTable();

	data.addColumn('string', 'Version');
	data.addColumn('number', 'react.js');
	data.addColumn('number', 'react.js.gz');
	data.addColumn('number', 'react.min.js');
	data.addColumn('number', 'react.min.js.gz');

	data.addRows(
		_.map( versions, function( version ) {
			return [
				version.version,
				parseFloat( version.size ),
				parseFloat( version.sizeGzipped ),
				parseFloat( version.minified ),
				parseFloat( version.minifiedGzipped )
			];
		} )
	);

	var options = {
		chart: {
			title: "React File Size",
			subtitle: 'in Kilobytes (kB)'
		},
		height: 600
	};

	var chart = new google.charts.Line( document.getElementById( 'linechart_material' ) );

	chart.draw( data, options );
}

window.addEventListener( "resize", _.throttle( function() {
	drawChart();
}, 250 ) );

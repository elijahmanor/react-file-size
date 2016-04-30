var versions = [
	{{#combined}}
	{
		version: "{{version}}",
		"react.js": "{{react}}",
		"react.js.gz": "{{reactGz}}",
		"react.min.js": "{{reactMin}}",
		"react.min.js.gz": "{{reactMinGz}}",
		"react-dom.js": "{{reactDom}}",
		"react-dom.min.js": "{{reactDomMin}}",
	},
	{{/combined}}
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
	data.addColumn('number', 'react-dom.js');
	data.addColumn('number', 'react-dom.min.js');

	data.addRows(
		_.map( versions, function( version ) {
			return [
				version.version,
				parseFloat( version[ "react.js" ] ),
				parseFloat( version[ "react.js.gz" ] ),
				parseFloat( version[ "react.min.js" ] ),
				parseFloat( version[ "react.min.js.gz" ] ),
				parseFloat( version[ "react-dom.js" ] ),
				parseFloat( version[ "react-dom.min.js" ] )
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

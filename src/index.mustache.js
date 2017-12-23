var versions = [
	{{#combined}}
	{
		version: "{{version}}",
		"react.js": "{{react}}",
		"react.js.gz": "{{reactGz}}",
		"react.min.js": "{{reactMin}}",
		"react.min.js.gz": "{{reactMinGz}}",
		"react-dom.js": "{{reactDom}}",
		"react-dom.js.gz": "{{reactDomGz}}",
		"react-dom.min.js": "{{reactDomMin}}",
		"react-dom.min.js.gz": "{{reactDomMinGz}}",
	},
	{{/combined}}
];

google.charts.load( 'current', { 'packages': [ 'line' ] } );
google.charts.setOnLoadCallback( drawChart );

function drawChart( mode ) {
	var data = new google.visualization.DataTable();

	mode = mode || "Production";

	data.addColumn('string', 'Version');

	if ( mode === "Production" ) {
		data.addColumn('number', 'react.min.js');
		data.addColumn('number', 'react.min.js.gz');
		data.addColumn('number', 'react-dom.min.js');
		data.addColumn('number', 'react-dom.min.js.gz');

		data.addRows(
			_.map( versions, function( version ) {
				return [
					version.version,
					parseFloat( version[ "react.min.js" ] ),
					parseFloat( version[ "react.min.js.gz" ] ),
					parseFloat( version[ "react-dom.min.js" ] ),
					parseFloat( version[ "react-dom.min.js.gz" ] )
				];
			} )
		);
	
	} else {
		data.addColumn('number', 'react.js');
		data.addColumn('number', 'react-dom.js');

		data.addRows(
			_.map( versions, function( version ) {
				return [
					version.version,
					parseFloat( version[ "react.js" ] ),
					parseFloat( version[ "react-dom.js" ] ),
				];
			} )
		);
	}

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

document.querySelector( "tbody tr:last-child").addEventListener( "mouseenter", function() {
	var tbody = document.querySelector( "tbody" );
	tbody.scrollTop = tbody.scrollHeight;
} );
	
document.querySelector( ".toggle" ).addEventListener( "click", function( e ) {
	if ( e.target.nodeName === "INPUT" ) {
		var type = "Development";
		if ( e.target.checked ) {
			type = "Production";
		}
		drawChart( type );
	}
} );

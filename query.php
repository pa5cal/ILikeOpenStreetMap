<?php 
//Set Header
header("Content-Type: application/json");

//Connect to Database
pg_connect('host=localhost port=5432 dbname=ilikeosm');

//Get GET parameter
//http://ilike.openstreetmap.de/query.php?uuid=7227452E-8AF8-4896-A764-8FF914B457A0&status=watch&map=Mapnik&zoom=10&extent=6.843245,49.423415,8.443129,49.710207&jsonp=OpenLayers.ILikeOSM.callback
	$uuid = $_GET['uuid'];
	$status = $_GET['status'];
	$map = $_GET['map'];
	$zoom = $_GET['zoom'];
	$extent = $_GET['extent'];
	$jsonp = $_GET['jsonp'];

	// Escape string for query
	$uuid = pg_escape_string($uuid);
	$status = pg_escape_string($status);
	$map = pg_escape_string($map);
	$zoom = pg_escape_string($zoom);
	$extent = pg_escape_string($extent);
	$jsonp = pg_escape_string($jsonp);
	
	//Set counter of the map section
	$views = -1;

	//Check if all needed objects has a value
	if($uuid != "" && $status != "" && $map != "" && $zoom != "" && $extent != ""){
		//echo $uuid." ".$status." ".$map." ".$zoom." ".$extent."<br>";
		$bbox = explode(",", $extent);
		//Check array length of bbox
		if(count($bbox) == 4){
			if(is_numeric($zoom) && is_numeric($bbox[0]) && is_numeric($bbox[1]) && is_numeric($bbox[2]) && is_numeric($bbox[3])){
				//Create bbox aka map view
				$bottom_lon = round($bbox[0], 5); $bottom_lat = round($bbox[1], 5);
				$top_lon = round($bbox[2], 5); $top_lat = round($bbox[3], 5);

				//Create postgres polygon geomtry
				$geom = "ST_SETSRID('BOX($bottom_lon $bottom_lat,$top_lon $top_lat)'::BOX2D,4326)";

				//Insert latest and history view
				pg_query("SELECT update_latest('$uuid', '$status', '$map', $zoom, $geom); INSERT INTO history (tstamp, uuid, status, map, zoom, the_geom) VALUES (now(), '$uuid', '$status', '$map', $zoom, $geom);");

				//Get number of viewers of this map section
				$pg_result = pg_query("SELECT count(uuid) FROM latest WHERE \"tstamp\"::timestamp > (now() - INTERVAL '2 minutes') AND ($geom && the_geom) AND uuid != '$uuid' AND zoom>=".($zoom-3)." AND zoom<=".($zoom+3).";"); 
				while($pg_row = pg_fetch_assoc($pg_result)) {
					$views = $pg_row["count"];
				}

				//It is at least always one Viewer ?! :)
				//$views++;
			}
		}
		//Output result json
		echo $jsonp.'({u:'.$views.'});';
	}else{
		//Output result json
		echo $jsonp.'({u:-1});';
	}
?>

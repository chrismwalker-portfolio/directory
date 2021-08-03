<?php

	$executionStartTime = microtime(true);

	include("../../../../includes/config.php");

	header('Content-Type: application/json; charset=UTF-8');

	$conn = new mysqli($cd_host, $cd_user, $cd_password, $cd_dbname, $cd_port, $cd_socket);

	if (mysqli_connect_errno()) {

		$output['status']['code'] = "300";
		$output['status']['name'] = "failure";
		$output['status']['description'] = "Unable to connect to the database";
		$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
		$output['data'] = [];

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

	// First query - get single department record by ID

	$query = 'SELECT * from department WHERE id = ' . $_POST['id'];

	$result = $conn->query($query);

	if (!$result) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to read department record from the database";
		$output['data'] = [];

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

   	$department = [];

	while ($row = mysqli_fetch_assoc($result)) {
		array_push($department, $row);
	}

	// Second query - get all locations

	$query = 'SELECT * FROM location l ORDER BY l.name';

	$result = $conn->query($query);

	if (!$result) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to read locations from the database";
		$output['data'] = [];

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

   	$locations = [];

	while ($row = mysqli_fetch_assoc($result)) {
		array_push($locations, $row);
	}

	$output['status']['code'] = "200";
	$output['status']['name'] = "OK";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	$output['data']['department'] = $department;
	$output['data']['locations'] = $locations;

	mysqli_close($conn);

	echo json_encode($output);

?>
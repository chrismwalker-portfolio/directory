<?php

	$executionStartTime = microtime(true);

	include("../../../../includes/config.php");

	header('Content-Type: application/json; charset=UTF-8');

	/* Check for valid POST variable */

	if (isset($_POST['orderBy']) && !empty($_POST['orderBy'])) {

		$orderBy = $_POST['orderBy'];

	} else {
		$orderBy = NULL;
	}

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

	$query = 'SELECT l.id as id, l.name as name FROM location l ORDER BY ';

	// Set ordering for query

	if (isset($orderBy)) {
		$query .= $orderBy;
	} else {
		$query .= 'name';
	}

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

   	$data = [];

	while ($row = mysqli_fetch_assoc($result)) {
		array_push($data, $row);
	}

	$output['status']['code'] = "200";
	$output['status']['name'] = "OK";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	$output['data']['locations'] = $data;
	$output['data']['count'] = count($data);

	mysqli_close($conn);

	echo json_encode($output);

?>
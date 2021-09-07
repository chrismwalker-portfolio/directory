<?php

	$executionStartTime = microtime(true);

	include("../../../../includes/config.php");

	header('Content-Type: application/json; charset=UTF-8');

	/* Create database connection */

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

	/* No referential integrity exists on the database, and the database structure may not be altered.
	Therefore need to manually check for foreign key constraints */

	/* Prevent location deletion if there are departments still attached to this location */

	$query = 'SELECT COUNT(*) AS total FROM department d WHERE d.locationID = ' . $_POST['id'];

	$result = $conn->query($query);

	if (!$result) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to check for departments at this location";
		$output['data'] = [];

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

	/* Get the total number of department records attached */

	$total = intval(mysqli_fetch_assoc($result)["total"]);

	/* If only checking for foreign key relationships, and no department records are attached, return here */

	if (isset($_POST['checkFK']) && $_POST['checkFK'] && $total < 1) {

		$output['status']['code'] = "200";
		$output['status']['name'] = "OK";
		$output['status']['description'] = "No departments at this location";
		$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
		$output['data'] = [];

		mysqli_close($conn);	
		echo json_encode($output);
		exit;

	}

	/* If at least one department record is attached to this location, return an error */

	if ($total > 0) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to delete location as it still has department attached";
		$output['data']['id'] = $_POST['id'];
		$output['data']['table'] = 'department';
		$output['data']['text'] = $total > 1 ? "departments" : "department";
		$output['data']['count'] = $total;

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

	/* Build and run the 'location' DELETE statement */

	$query = 'DELETE FROM location WHERE id = ' . $_POST['id'];

	$result = $conn->query($query);

	if (!$result) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to delete location from the database";
		$output['data'] = [];

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

	$output['status']['code'] = "200";
	$output['status']['name'] = "OK";
	$output['status']['description'] = "Location successfully deleted";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	$output['data'] = [];

	mysqli_close($conn);

	echo json_encode($output);

?>
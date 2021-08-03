<?php

	$executionStartTime = microtime(true);

	include("../../../../includes/config.php");

	header('Content-Type: application/json; charset=UTF-8');

	/* Check all POST variables submitted and conform to database schema */

	if (!isset($_POST['name']) || empty($_POST['name']) || strlen($_POST['name']) > 50) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "failure";
		$output['status']['description'] = "Missing or invalid data submitted";
		$output['data'] = [];

		echo json_encode($output);
		exit;

	}

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

	/* Sanitise input */

	if (isset($_POST['id'])) {
		$id = $_POST['id'];
	} else {
		$id = NULL;
	}

	$name = $conn->real_escape_string(filter_var(trim($_POST['name']), FILTER_SANITIZE_STRING));

	if ($id) {

		/* Build the 'location' UPDATE statement */

		$query = 'UPDATE location SET name = "' . $name . '" WHERE id = ' . $id;

		$success = 'Location successfully updated';

	} else {

		/* Build the 'location' INSERT statement */

		$query = 'INSERT INTO location (name) VALUES("' . $name . '")';

		$success = 'Location successfully added';
	}

	/* Run the 'location' INSERT/UPDATE statement */

	$result = $conn->query($query);

	if (!$result) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to update the database";
		$output['data'] = [];

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

	$output['status']['code'] = "200";
	$output['status']['name'] = "OK";
	$output['status']['description'] = $success;
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	$output['data'] = [];

	mysqli_close($conn);

	echo json_encode($output);

?>
<?php

	$executionStartTime = microtime(true);

	include("../../../../includes/config.php");

	header('Content-Type: application/json; charset=UTF-8');

	/* Check all POST variables submitted and conform to database schema */

	if (!isset($_POST['firstName']) || empty($_POST['firstName']) || strlen($_POST['firstName']) > 50 ||
		!isset($_POST['lastName']) || empty($_POST['lastName']) || strlen($_POST['lastName']) > 50 ||
		!isset($_POST['jobTitle']) || empty($_POST['jobTitle']) || strlen($_POST['jobTitle']) > 50 ||
		!isset($_POST['email']) || empty($_POST['email']) || strlen($_POST['email']) > 50 || 
		!isset($_POST['departmentID']) || empty($_POST['departmentID'])) {

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

	$firstName = $conn->real_escape_string(filter_var(trim($_POST['firstName']), FILTER_SANITIZE_STRING));
	$lastName = $conn->real_escape_string(filter_var(trim($_POST['lastName']), FILTER_SANITIZE_STRING));
	$jobTitle = $conn->real_escape_string(filter_var(trim($_POST['jobTitle']), FILTER_SANITIZE_STRING));
	$email = $conn->real_escape_string(filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL));
	$departmentID = $_POST['departmentID'];

	if ($id) {

		/* Build the 'personnel' UPDATE statement */

		$query = 'UPDATE personnel SET firstName = "' . $firstName . '", lastName = "' . $lastName . '", jobTitle = "' . $jobTitle . '", email = "' . $email . '", departmentID = ' . $departmentID . ' WHERE id = ' . $id;

		$success = 'Personnel record successfully updated';

	} else {

		/* Build the 'personnel' INSERT statement */

		$query = 'INSERT INTO personnel (firstName, lastName, jobTitle, email, departmentID) VALUES("' . $firstName . '", "' . $lastName . '", "' . $jobTitle . '", "' . $email . '", ' . $departmentID . ')';

		$success = 'Personnel record successfully added';
	}

	/* Run the 'personnel' INSERT/UPDATE statement */

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
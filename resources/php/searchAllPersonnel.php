<?php

	$executionStartTime = microtime(true);

	include("../../../../includes/config.php");

	header('Content-Type: application/json; charset=UTF-8');

	/* Check for valid POST variables */

	if (isset($_POST['search']) && !empty($_POST['search'])) {

		/* Sanitise input */
		$search = filter_var(trim($_POST['search']), FILTER_SANITIZE_STRING);

	} else {
		$search = NULL;
	}

	if (isset($_POST['orderBy']) && !empty($_POST['orderBy'])) {

		$orderBy = $_POST['orderBy'];

	} else {
		$orderBy = NULL;
	}

	if (!isset($search) || strlen($search) < 2) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "failure";
		$output['status']['description'] = "Invalid search term. Enter at least two characters";
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

	/* First query - get all personnel where any field contains the search term */

	$query = 'SELECT p.id as id, p.firstName as firstName, p.lastName as lastName, p.jobTitle as jobTitle, p.email as email, d.name as department, l.name as location FROM personnel p LEFT JOIN department d ON (d.id = p.departmentID) LEFT JOIN location l ON (l.id = d.locationID) WHERE p.firstName LIKE "%' . $search . '%" OR p.lastName LIKE "%' . $search . '%" OR p.jobTitle LIKE "%' . $search . '%" OR p.email LIKE "%' . $search . '%" OR d.name LIKE "%' . $search . '%" OR l.name LIKE "%' . $search . '%" ORDER BY ';

	// Set ordering for first query

	if (isset($orderBy)) {
		$query .= $orderBy;
	} else {
		$query .= 'lastName, firstName, department, location';
	}

	$result = $conn->query($query);

	if (!$result) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to read personnel from the database";
		$output['data'] = [];

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

   	$data = [];

	while ($row = mysqli_fetch_assoc($result)) {
		array_push($data, $row);
	}

	/* Second query - get count of all personnel */

	$query = 'SELECT COUNT(*) AS total FROM personnel';

	$result = $conn->query($query);

	if (!$result) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to retrieve count of all personnel from the database";
		$output['data'] = [];

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

	$count = intval(mysqli_fetch_assoc($result)["total"]);

	$output['status']['code'] = "200";
	$output['status']['name'] = "OK";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	$output['data']['personnel'] = $data;
	$output['data']['count'] = $count;

	mysqli_close($conn);

	echo json_encode($output);

?>
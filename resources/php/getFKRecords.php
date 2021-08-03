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

	/* Set the foreign key */

	if ($_POST['table'] === 'personnel') {
		$fk = 'departmentID';
		$orderBy = 'lastName';
	} else if ($_POST['table'] === 'department') {
		$fk = 'locationID';
		$orderBy = 'name';
	}

	/* First query - get count of all records related by foreign key */

	$query = 'SELECT COUNT(*) AS total FROM ' . $_POST['table'] . ' WHERE ' . $fk . ' = ' . $_POST['id'];

	$result = $conn->query($query);

	if (!$result) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to retrieve list of attached records from the database";
		$output['data'] = [];

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

	$count = intval(mysqli_fetch_assoc($result)["total"]);

	/* Second query - get up to the first five records related by foreign key */

	$query = 'SELECT * FROM ' . $_POST['table'] . ' WHERE ' . $fk . ' = ' . $_POST['id'] . ' ORDER BY ' . $orderBy . ' LIMIT 5';

	$result = $conn->query($query);

	if (!$result) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to retrieve list of attached records from the database";
		$output['data'] = [];

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

   	$data = [];

	/* Get name field from up to the first five rows */

	while ($row = mysqli_fetch_assoc($result)) {

		if ($_POST['table'] === 'personnel') {
			array_push($data, $row["lastName"] . ', ' . $row["firstName"]);

		} else if ($_POST['table'] === 'department') {
			array_push($data, $row["name"]);
		}
	}

	/* If the total is more than five, add an item to the array indicating how many more */

	if ($count > 5) {
		array_push($data, '<strong><em>+ ' . $count - 5 . ' more</em></strong>');
	}

	$output['status']['code'] = "200";
	$output['status']['name'] = "OK";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	$output['data']['attached'] = $data;

	mysqli_close($conn);

	echo json_encode($output);

?>
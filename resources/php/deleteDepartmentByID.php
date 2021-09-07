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

	/* Prevent department deletion if there are personnel still attached to this department */

	$query = 'SELECT COUNT(*) AS total FROM personnel p WHERE p.departmentID = ' . $_POST['id'];

	$result = $conn->query($query);

	if (!$result) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to check for personnel in this department";
		$output['data'] = [];

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

	/* Get the total number of personnel records attached */

	$total = intval(mysqli_fetch_assoc($result)["total"]);

	/* If only checking for foreign key relationships, and no personnel records are attached, return here */

	if (isset($_POST['checkFK']) && $_POST['checkFK'] && $total < 1) {

		$output['status']['code'] = "200";
		$output['status']['name'] = "OK";
		$output['status']['description'] = "No personnel in this department";
		$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
		$output['data'] = [];

		mysqli_close($conn);	
		echo json_encode($output);
		exit;

	}

	/* If at least one personnel record is attached to this department, return an error */

	if ($total > 0) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to delete department as it still has personnel attached";
		$output['data']['id'] = $_POST['id'];
		$output['data']['table'] = 'personnel';
		$output['data']['text'] = 'personnel';
		$output['data']['count'] = $total;

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

	/* Build and run the 'department' DELETE statement */

	$query = 'DELETE FROM department WHERE id = ' . $_POST['id'];

	$result = $conn->query($query);

	if (!$result) {

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to delete department from the database";
		$output['data'] = [];

		mysqli_close($conn);
		echo json_encode($output);
		exit;

	}

	$output['status']['code'] = "200";
	$output['status']['name'] = "OK";
	$output['status']['description'] = "Department successfully deleted";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	$output['data'] = [];

	mysqli_close($conn);

	echo json_encode($output);

?>
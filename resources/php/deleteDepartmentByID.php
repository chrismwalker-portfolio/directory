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

	/* Check if at least one personnel record attached to this department was found */

	$total = intval(mysqli_fetch_assoc($result)["total"]);

	if ($total > 0) {

		/* Build link for foreign key relationship list */
		$fk = '<a tabindex="0" class="fkPopover" data-table="personnel" data-id="' . $_POST['id'] . '" data-bs-toggle="popover" data-bs-placement="top" data-bs-trigger="focus" title="Still attached..." data-bs-content="">';

		$output['status']['code'] = "400";
		$output['status']['name'] = "executed";
		$output['status']['description'] = "Unable to delete department as it still has " . $fk . $total . " personnel</a> attached";
		$output['data'] = [];

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
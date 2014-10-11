<?php

include_once('includes/config.inc.php');
include_once('includes/session.inc.php');
include_once('includes/misc.inc.php');

if ('POST' != $_SERVER['REQUEST_METHOD']) {
    header('Status: 405 Method not allowed');
    exit(0);
}

if (!try_login()) {
    header('Status: 401 Unauthorized');
    exit(0);
}

header('Status: 201 Session created');
header('Content-Type: application/json');
echo json_encode(get_session());

<?php

include_once('includes/config.inc.php');
include_once('includes/session.inc.php');
include_once('includes/misc.inc.php');

if ('POST' != $_SERVER['REQUEST_METHOD']) {
    header('Status: 405 Method not allowed');
    exit(0);
}

if (!is_csrf_safe()) {
    header('Status: 403 Forbidden');
    exit(0);
}

logout();

header('Status: 200');

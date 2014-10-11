<?php

include_once('includes/config.inc.php');
include_once('includes/session.inc.php');
include_once('includes/misc.inc.php');

$config = array(
    support_autologin => (bool)(isset($secret) && $secret),
    logourl => $logourl,
);

$session = get_session();

?><html>
<head>
    <title>NSEdit!</title>
    <link href="jquery-ui/themes/base/jquery.ui.all.css" rel="stylesheet" type="text/css"/>
    <link href="jtable/lib/themes/metro/blue/jtable.min.css" rel="stylesheet" type="text/css"/>
    <link href="css/base.css" rel="stylesheet" type="text/css"/>
    <script src="jquery-ui/jquery-1.10.2.js" type="text/javascript"></script>
    <script src="jquery-ui/ui/jquery.ui.core.js" type="text/javascript"></script>
    <script src="jquery-ui/ui/jquery.ui.widget.js" type="text/javascript"></script>
    <script src="jquery-ui/ui/jquery.ui.mouse.js" type="text/javascript"></script>
    <script src="jquery-ui/ui/jquery.ui.draggable.js" type="text/javascript"></script>
    <script src="jquery-ui/ui/jquery.ui.position.js" type="text/javascript"></script>
    <script src="jquery-ui/ui/jquery.ui.button.js" type="text/javascript"></script>
    <script src="jquery-ui/ui/jquery.ui.resizable.js" type="text/javascript"></script>
    <script src="jquery-ui/ui/jquery.ui.dialog.js" type="text/javascript"></script>
    <script src="jtable/lib/jquery.jtable.min.js" type="text/javascript"></script>
    <script src="js/addclear/addclear.js" type="text/javascript"></script>
    <script src="js/ui.js" type="text/javascript"></script>
</head>

<body>
    <script type="text/javascript">
        window.$config = <?php echo json_encode($config); ?>;
        $(document).ready(function () {
            var session = <?php echo json_encode($session); ?>;
            StartUI(session);
        });
    </script>

    <noscript>This application requires javascript</noscript>
</body>
</html>

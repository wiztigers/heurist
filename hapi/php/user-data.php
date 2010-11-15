<?php

header("Content-Type: text/javascript");
define('SAVE_URI', 'disabled');

require_once(dirname(__FILE__)."/../../common/connect/cred.php");
require_once(dirname(__FILE__)."/../../common/connect/db.php");
require_once("auth.php");

if (! @$_REQUEST["key"]) {
	print 'alert("No Heurist API key specified");';
	return;
}

if (! ($loc = get_location($_REQUEST["key"]))) {
	print 'alert("Unknown Heurist API key");';
	return;
}
define_constants($loc["hl_instance"]);

mysql_connection_db_select(DATABASE);

if (! is_logged_in()) {
	print "var HAPI_userData = {};\n";
	return;
}

$tags = mysql__select_array("usrTags", "distinct tag_Text", "tag_UGrpID=" . get_user_id());

$workgroups = mysql__select_array(USERS_DATABASE.".UserGroups", "distinct ug_group_id", "ug_user_id=" . get_user_id());

$res = mysql_query("select tag_ID, tag_Text, tag_UGrpID from usrTags, ".USERS_DATABASE.".UserGroups where ug_group_id=tag_UGrpID and ug_user_id=" . get_user_id());
$workgroupTags = array();
while ($row = mysql_fetch_row($res)) { array_push($workgroupTags, $row); }

$res = mysql_query("select cgr_id, cgr_name from coll_groups where cgr_owner_id=" . get_user_id());
$colleagueGroups = array();
while ($row = mysql_fetch_row($res)) { array_push($colleagueGroups, $row); }

$currentUser = array(get_user_id(), is_admin(), $workgroups, @$_SESSION[HEURIST_INSTANCE_PREFIX."heurist"]["display-preferences"]);

$userData = array(
	"tags" => $tags,
	"workgroupTags" => $workgroupTags,
	"colleagueGroups" => $colleagueGroups,
	"currentUser" => $currentUser
);

print "var HAPI_userData = ";
print json_encode($userData);
print ";\n";

?>

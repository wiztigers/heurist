<?php

require_once(dirname(__FILE__).'/../../common/connect/cred.php');
require_once(dirname(__FILE__).'/../../common/t1000/t1000.php');

if (!is_logged_in()) {
	header('Location: '.HEURIST_URL_BASE.'common/connect/login.php');
	return;
}

mysql_connection_db_overwrite(DATABASE);
$template = file_get_contents('user.html');
$template = str_replace('[logged-in-user-id]', intval(get_user_id()), $template);

$lexer = new Lexer($template);
$body = new BodyScope($lexer);

$body->global_vars['sort'] = ($_REQUEST['sort'] == 'alpha' ? 'alpha' : 'freq');

$name = mysql__select_array(USERS_DATABASE.'.'.USERS_TABLE, "concat(".USERS_FIRSTNAME_FIELD.",' ',".USERS_LASTNAME_FIELD.")", USERS_ID_FIELD.'='.$_REQUEST['Id']);
$name = $name[0];

$body->global_vars['tags'] = '';

$res = mysql_query('select tag_Text,count(rtl_ID) as bkmks
                      from usrRecTagLinks
                 left join usrTags on rtl_TagID=tag_ID
                     where tag_UGrpID='.$_REQUEST['Id'].'
                  group by tag_Text
                  order by '. ($_REQUEST['sort'] == 'alpha' ? 'tag_Text, bkmks desc' : 'bkmks desc, tag_Text'));

$body->global_vars['tags'] .= '<span id="top10">'."\n";
$i = 0;
while ($row = mysql_fetch_assoc($res)) {
	if ($i == 10)
		$body->global_vars['tags'] .= "</span>\n".'<span id="top20" style="display: none;">'."\n";
	if ($i == 20)
		$body->global_vars['tags'] .= "</span>\n".'<span id="top50" style="display: none;">'."\n";
	if ($i == 50)
		$body->global_vars['tags'] .= "</span>\n".'<span id="top100" style="display: none;">'."\n";
	$i++;
	$body->global_vars['tags'] .= '<a target="_top" href="'.HEURIST_URL_BASE.'search/search.html?w=all&q=tag:%22'.urlencode($row['tag_Text']).'%22+user:'.$_REQUEST['Id'].'" title="Search for '.$name.'\'s references with the tag \''.$row['tag_Text'].'\'"><nobr>'.$row['tag_Text'].' ('.$row['bkmks'].")</nobr></a>&nbsp&nbsp\n";
}
$body->global_vars['tags'] .= "</span>\n";


$body->verify();
$body->render();

?>

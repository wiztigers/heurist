<?php

/*
* Copyright (C) 2005-2013 University of Sydney
*
* Licensed under the GNU License, Version 3.0 (the "License"); you may not use this file except
* in compliance with the License. You may obtain a copy of the License at
*
* http://www.gnu.org/licenses/gpl-3.0.txt
*
* Unless required by applicable law or agreed to in writing, software distributed under the License
* is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
* or implied. See the License for the specific language governing permissions and limitations under
* the License.
*/

/**
* listFieldTypeDefinitionErrorsCompact.php - list for editRecord
*
* @author      Tom Murtagh
* @author      Kim Jackson
* @author      Ian Johnson   <ian.johnson@sydney.edu.au>
* @author      Stephen White   <stephen.white@sydney.edu.au>
* @author      Artem Osmakov   <artem.osmakov@sydney.edu.au>
* @copyright   (C) 2005-2013 University of Sydney
* @link        http://Sydney.edu.au/Heurist
* @version     3.1.0
* @license     http://www.gnu.org/licenses/gpl-3.0.txt GNU License 3.0
* @package     Heurist academic knowledge management system
* @subpackage  !!!subpackagename for file such as Administration, Search, Edit, Application, Library
*/

    require_once('getFieldTypeDefinitionErrors.php');
    
    if(@$_REQUEST['data']){
        $lists = json_decode($_REQUEST['data'], true);
    }else{
        $lists = getInvalidFieldTypes(@$_REQUEST['rt']);
        if(!@$_REQUEST['show']){
            if(count($lists["terms"])==0 && count($lists["terms_nonselectable"])==0 && count($lists["rt_contraints"])==0){
                $lists = array();   
            }
            print json_encode($lists);
            exit();
        }
    }
    
    $dtysWithInvalidTerms = $lists["terms"];
    $dtysWithInvalidNonSelectableTerms = $lists["terms_nonselectable"];
    $dtysWithInvalidRectypeConstraint = $lists["rt_contraints"];
?>    
<html>

	<head>
        <title>Invalid Field Type Definition check</title>
		<link rel="stylesheet" type="text/css" href="../../common/css/global.css">
		<link rel="stylesheet" type="text/css" href="../../common/css/admin.css">
        <script src="../../common/js/utilsUI.js"></script>
		<style type="text/css">
			h3, h3 span {
				display: inline-block;
				padding:0 0 10px 0;
			}
			.msgline {
				line-height:2em;
			}
		</style>
	</head>

	<body class="popup" style="width:95%;">
    
		<div id="page-inner" style="top:5px;">
        
<script>
function repairFieldTypes(){
    
    function _callback(context){
        if(top.HEURIST.util.isnull(context) || top.HEURIST.util.isnull(context['result'])){
            top.HEURIST.util.showError(null);
        }else{
            alert(context['result']);
        }
    }
    
    var dt = [
<?php   
        $isfirst = true;
        foreach ($dtysWithInvalidTerms as $row) {
            print ($isfirst?"":",")."[".$row['dty_ID'].", 0, '".$row['validTermsString']."']";
            $isfirst = false;
        }
        foreach ($dtysWithInvalidNonSelectableTerms as $row) {
            print ($isfirst?"":",")."[".$row['dty_ID'].", 1, '".$row['validNonSelTermsString']."']";
            $isfirst = false;
        }
        foreach ($dtysWithInvalidRectypeConstraint as $row) {
            print ($isfirst?"":",")."[".$row['dty_ID'].", 2, '".$row['validRectypeConstraint']."']";
            $isfirst = false;
        }
?>];

    var str = JSON.stringify(dt);
    
    var baseurl = top.HEURIST.baseURL + "admin/verification/repairFieldTypes.php";
    var callback = _callback;
    var params = "db=<?= HEURIST_DBNAME?>&data=" + encodeURIComponent(str);
    top.HEURIST.util.getJsonData(baseurl, callback, params);
}
</script>
        
        
The following field definitions have inconsistent data. To fix the problem and remove this message please perform one of follwoing actions:<br /><br /> 
1. Close this popup, save your edits, then Navigate to Designer View > Structure > Manage Field Types, edit the fields indicated.
<br />or<br />
2. Close this popup, save your edits and click "Edit record type" link at top right of edit record form.
<br />or<br />
3. Click <button onclick="repairFieldTypes()">Auto Repair</button>
            <br />
			<hr/>
<?php
if (count($dtysWithInvalidTerms)>0){
?>
<!--
			<div>
				<h3>Enumeration, Relationship type or Relationship marker field types with invalid terms definitions</h3>
			</div>
-->            
<?php
						foreach ($dtysWithInvalidTerms as $row) {
?>
					<div class="msgline"><b><?= $row['dty_Name'] ?></b> field (code <?= $row['dty_ID'] ?>) has 
<?= count($row['invalidTermIDs'])?> invalid term ID<?=(count($row['invalidTermIDs'])>1?"s":"")?> 
(code: <?= join(",",$row['invalidTermIDs'])?>)
					</div>
<?php
						}//for
}
if (count($dtysWithInvalidNonSelectableTerms)>0){
?>
<!--			<div>
				<h3>Enumeration, Relationship type or Relationship marker field types with invalid non-selectable terms definitions</h3>
			</div> -->
					<?php
						foreach ($dtysWithInvalidNonSelectableTerms as $row) {
						?>
                    <div class="msgline"><b><?= $row['dty_Name'] ?></b> field (code <?= $row['dty_ID'] ?>) has 
<?= count($row['invalidNonSelectableTermIDs'])?> invalid non selectable term ID<?=(count($row['invalidNonSelectableTermIDs'])>1?"s":"")?> 
(code: <?= join(",",$row['invalidNonSelectableTermIDs'])?>)
                    </div>
<?php
						}
}
if (count($dtysWithInvalidRectypeConstraint)>0){
?>
<!--
			<div>
				<h3>Record Pointer or Relationship Marker field types with invalid record type(s) in constraint definitions</h3> 
			</div> -->
<?php
						foreach ($dtysWithInvalidRectypeConstraint as $row) {
?>
                    <div class="msgline"><b><?= $row['dty_Name'] ?></b> field (code <?= $row['dty_ID'] ?>) has 
<?= count($row['invalidRectypeConstraint'])?> invalid record type constraint<?=(count($row['invalidRectypeConstraint'])>1?"s":"")?> 
(code: <?= join(",",$row['invalidRectypeConstraint'])?>)
                    </div>
                        
<?php
						}
}
?>

		</div>
	</body>
</html>


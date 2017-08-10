<?php

    /**
    * db access to usrBoomarks table
    * 
    *
    * @package     Heurist academic knowledge management system
    * @link        http://HeuristNetwork.org
    * @copyright   (C) 2005-2015 University of Sydney
    * @author      Artem Osmakov   <artem.osmakov@sydney.edu.au>
    * @license     http://www.gnu.org/licenses/gpl-3.0.txt GNU License 3.0
    * @version     4.0
    */

    /*
    * Licensed under the GNU License, Version 3.0 (the "License"); you may not use this file except in compliance
    * with the License. You may obtain a copy of the License at http://www.gnu.org/licenses/gpl-3.0.txt
    * Unless required by applicable law or agreed to in writing, software distributed under the License is
    * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied
    * See the License for the specific language governing permissions and limitations under the License.
    */

require_once (dirname(__FILE__).'/../System.php');
require_once (dirname(__FILE__).'/dbEntityBase.php');
require_once (dirname(__FILE__).'/dbEntitySearch.php');
require_once (dirname(__FILE__).'/db_files.php');


class DbUsrBookmarks extends DbEntityBase
{

    public function init(){
        parent::init();
        
        //verify that NEW field exists in database
        
        $mysqli = $this->system->get_mysqli();
        //verify that required column exists in sysUGrps
        $query = "SHOW COLUMNS FROM `usrBookmarks` LIKE 'bkm_Notes'";

        $res = $mysqli->query($query);

        $row_cnt = $res->num_rows;
        $res->close();
        if(!$row_cnt){
            //alter table
            $query = "ALTER TABLE `usrBookmarks` ADD `bkm_Notes` text COMMENT 'Personal notes'";
            $res = $mysqli->query($query);
            if(!$res){
                $system->addError(HEURIST_DB_ERROR, 'Cannot modify table to store Personal notes', $mysqli->error);
            }
            return false;
        }
        
    }
    
    /**
    *  search bookmarks
    * 
    *  other parameters :
    *  details - id|name|list|all or list of table fields
    *  offset
    *  limit
    *  request_id
    * 
    *  @todo overwrite
    */
    public function search(){

                
        $this->searchMgr = new dbEntitySearch( $this->system, $this->fields);
        
        $res = $this->searchMgr->validateParams( $this->data );
        if(!is_bool($res)){
            $this->data = $res;
        }else{
            if(!$res) return false;        
        }        
        
        $needCheck = false;
        
        //compose WHERE 
        $where = array();
        $from_table = array($this->config['tableName']);
        
        $pred = $this->searchMgr->getPredicate('bkm_ID');
        if($pred!=null) array_push($where, $pred);

        $pred = $this->searchMgr->getPredicate('bkm_UGrpID');
        if($pred!=null) array_push($where, $pred);

        $pred = $this->searchMgr->getPredicate('bkm_RecID');
        if($pred!=null) array_push($where, $pred);

        $pred = $this->searchMgr->getPredicate('bkm_Rating');
        if($pred!=null) array_push($where, $pred);

        
        //compose SELECT it depends on param 'details' ------------------------
        if(@$this->data['details']=='id'){
        
            $this->data['details'] = 'bkm_ID';
            
        }else if(@$this->data['details']=='name' || @$this->data['details']=='list' || @$this->data['details']=='full'){

            $this->data['details'] = 'bkm_ID,bkm_UGrpID,bkm_RecID,bkm_Rating,bkm_PwdReminder,bkm_Notes';
            
        }else{
            $needCheck = true;
        }
        
        if(!is_array($this->data['details'])){ //specific list of fields
            $this->data['details'] = explode(',', $this->data['details']);
        }
        
        //validate names of fields
        if($needCheck && !$this->_validateFieldsForSearch()){
            return false;
        }

        $is_ids_only = (count($this->data['details'])==1);
            
        //compose query
        $query = 'SELECT SQL_CALC_FOUND_ROWS DISTINCT '.implode(',', $this->data['details'])
        .' FROM '.implode(',', $from_table);

         if(count($where)>0){
            $query = $query.' WHERE '.implode(' AND ',$where);
         }
         
         $query = $query.$this->searchMgr->getOffset()
                        .$this->searchMgr->getLimit();

        $calculatedFields = null;
        
        $result = $this->searchMgr->execute($query, $is_ids_only, $this->config['tableName'], $calculatedFields);
        
        return $result;
    }
    
    
    //
    // validate permission for edit/delete bookmark
    // for delete and assign see appropriate methods
    //    
    protected function _validatePermission(){
        
        if(!$this->system->is_dbowner() && count($this->recordIDs)>0){ //there are records to update/delete
            
            //$ugrs = $this->system->get_user_group_ids();
            $ugrID = $this->system->get_user_id();
            
            $mysqli = $this->system->get_mysqli();
             
            $recIDs_norights = mysql__select_list($mysqli, $this->config['tableName'], $this->primaryField, 
                    'bkm_ID in ('.implode(',', $this->recordIDs).') AND bkm_UGrpID!='.$ugrID); //' not in ('.implode(',',$ugrs).')');
            
            
            $cnt = count($recIDs_norights);       
                    
            if($cnt>0){
                $this->system->addError(HEURIST_ACTION_BLOCKED, 
                (($cnt==1 && (!isset($this->records) || count($this->records)==1))
                    ? 'Bookmark belongs'
                    : $cnt.' Bookmark belong')
                    .' to other user. Insufficient rights for this operation'); // or workgroup you are not a member
                return false;
            }
        }
        
        return true;
    }
    
    //
    //
    //    
    protected function prepareRecords(){
    
        $ret = parent::prepareRecords();

        //add specific field values
        foreach($this->records as $idx=>$record){
            $rec_ID = intval(@$record[$this->primaryField]);
            $isinsert = ($rec_ID<1);
            if($isinsert && !($this->records[$idx]['bkm_UGrpID']>0)){
                $this->records[$idx]['bkm_UGrpID'] = $this->system->get_user_id();
            }
            $this->records[$idx]['bkm_Modified'] = null; //reset
        }

        return $ret;
        
    }    
    
    //
    //
    //
    public function delete(){

        $this->recordIDs = prepareIds($this->data['recID']);
        
        $mysqli = $this->system->get_mysqli();
       
        
        $query = 'SELECT count(tag_ID) FROM usrBookmarks, usrTags, usrRecTagLinks where tag_ID=rtl_TagID AND tag_UGrpID='
            .$this->system->get_user_id()
            .' AND rtl_RecID=bkm_RecID AND bkm_ID in (' . implode(',', $this->recordIDs). ')';
                       
        $cnt = mysql__select_value($mysqli, $query);

        if($cnt>0){
                $this->system->addError(HEURIST_ACTION_BLOCKED, 
                    'It is not possible to remove bookmark. Bookmarked record has personal tags');
                return false;
        }
    
        $ret = parent::delete();    
    }
}
?>

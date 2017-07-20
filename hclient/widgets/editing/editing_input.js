/**
* Widget for input controls on edit form
*
* @package     Heurist academic knowledge management system
* @link        http://HeuristNetwork.org
* @copyright   (C) 2005-2016 University of Sydney
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


$.widget( "heurist.editing_input", {

    // default options
    options: {
        varid:null,  //id to create imput id, otherwise it is combination of index and detailtype id
        recID: null,  //record id for current record - required for relation marker and file
        recordset:null, //reference to parent recordset

        //field desription is taken from window.hWin.HEURIST4.rectypes
        rectypes: null,  // reference to window.hWin.HEURIST4.rectypes - defRecStructure
        rectypeID: null, //field description is taken either from rectypes[rectypeID] or from dtFields
        dtID: null,      // field type id (for recDetails) or field name (for other Entities)

        //  it is either from window.hWin.HEURIST4.rectype.typedefs.dtFields - retrieved with help rectypeID and dtID
        // object with some mandatory field names
        dtFields: null,

        values: null,
        readonly: false,
        title: '',  //label (overwrite Display label from record structure)
        showclear_button: true,
        show_header: true, //show/hide label
        suppress_prompts:false, //supress help, error and required features
        detailtype: null,  //overwrite detail type from db (for example freetext instead of memo)
        
        change: null  //onchange callback
    },

    newvalues:{},  //keep actual value for resource (recid) and file (ulfID)
    detailType:null,
    configMode:null, //configuration settings, mostly for enum and resource types (from field rst_FieldConfig)

    // the constructor
    _create: function() {

        //field description is taken either from rectypes[rectypeID] or from dtFields
        if(this.options.dtFields==null && this.options.dtID>0 && this.options.rectypeID>0 &&
            this.options.rectypes && this.options.rectypes.typedefs && this.options.rectypes.typedefs[this.options.rectypeID])
        {

            this.options.dtFields = this.options.rectypes.typedefs[this.options.rectypeID].dtFields[this.options.dtID];
        }

        if(this.options.dtFields==null){ //field description is not defined
            return;
        }


        this.configMode = this.f('rst_FieldConfig');
        if(!window.hWin.HEURIST4.util.isempty(this.configMode)){
            if($.type(this.configMode) === "string"){
                try{
                    this.configMode = $.parseJSON(this.configMode);
                }catch(e){
                    this.configMode = null;
                }
            }
            if(!$.isPlainObject(this.configMode)){
                this.configMode = null;
            }
        }

        var that = this;

        this.detailType = this.options.detailtype ?this.options.detailtype :this.f('dty_Type');

        var required = "";
        if(this.options.readonly || this.f('rst_Display')=='readonly') {
            required = "readonly";

            //spacer
            $( "<span>")
            .addClass('editint-inout-repeat-button')
            .css({width:'16px', display:'table-cell'})
            .appendTo( this.element );

        }else{
            if(!this.options.suppress_prompts){
                required = this.f('rst_RequirementType');
            }
            /*if (required == 'optional') required = "optional";
            else if (required == 'required') required = "required";
            else if (required == 'recommended') required = "recommended";
            else required = "";*/

            var repeatable = (Number(this.f('rst_MaxValues')) != 1)? true : false; //saw TODO this really needs to check many exist

            
            if(!repeatable || this.options.suppress_repeat){  
                //spacer
                $( "<span>")
                .addClass('editint-inout-repeat-button')
                .css({width:'16px', display:'table-cell'})
                .appendTo( this.element );
                
            }else{ //multiplier button
                this.btn_add = $( "<button>")
                .addClass("smallbutton editint-inout-repeat-button")
                //.css('display','table-cell')
                //.css({width:'16px', height:'16px', display:'table-cell'})
                .appendTo( this.element )
                .button({icons:{primary: "ui-icon-circlesmall-plus"}, text:false})
                .css({display:'table-cell'});

                // bind click events
                this._on( this.btn_add, {
                    click: function(){
                        if( !(Number(this.f('rst_MaxValues'))>0)  || this.inputs.length < this.f('rst_MaxValues')){
                            this._addInput('');
                        }
                    }
                });
            }
        }

        //header
        if(true || this.options.show_header){
            this.header = $( "<div>")
            .addClass('header '+required)
            //.css('width','150px')
            .css('vertical-align', (this.detailType=="blocktext" || this.detailType=="file")?'top':'')
            .html('<label>'
                + (window.hWin.HEURIST4.util.isempty(this.options.title)?this.f('rst_DisplayName'):this.options.title) +'</label>')
            .appendTo( this.element );
        }


        //input cell
        this.input_cell = $( "<div>")
        .addClass('input-cell')
        .appendTo( this.element );

        //add hidden error message div

        this.error_message = $( "<div>")
        .hide()
        .addClass('heurist-prompt ui-state-error')
        .css({'height': 'auto',
            'padding': '0.2em',
            'margin-bottom': '0.2em'})
        .appendTo( this.input_cell );

        //add prompt
        var help_text = this.f('rst_DisplayHelpText');
        this.input_prompt = $( "<div>")
        .text( help_text && !this.options.suppress_prompts ?help_text:'' )
        .addClass('heurist-helper1');
        if(window.hWin.HAPI4.get_prefs('help_on')!=1){
            this.input_prompt.hide();
        }
        this.input_prompt.appendTo( this.input_cell );


        //values are not defined - assign default value

        if( !window.hWin.HEURIST4.util.isArray(this.options.values) ){
            var def_value = this.f('rst_DefaultValue');
            if(window.hWin.HEURIST4.util.isempty(def_value)){
                this.options.values = [''];        
            }else if(window.hWin.HEURIST4.util.isArray(def_value)){
                this.options.values = def_value;
            }else{
                this.options.values = [def_value];
            }
        }
        //recreate input elements and assign given values
        this.setValue(this.options.values);

        this._refresh();
    }, //end _create

    /* private function */
    _refresh: function(){
        if(this.f('rst_Visible')==false){
            this.element.hide();    
        }else{
            this.element.show();    
        }
        
        
        if(this.options.showclear_button){
            this.element.find('.btn_input_clear').css({'visibility':'visible','max-width':16});
        }else{
            this.element.find('.btn_input_clear').css({'visibility':'hidden','max-width':0});
        }
        
        if(this.options.show_header){
            this.header.show();
        }else{
            this.header.hide();
        }        
    },
    
    _setOptions: function( ) {
        this._superApply( arguments );
        this._refresh();
    },

    // events bound via _on are removed automatically
    // revert other modifications here
    _destroy: function() {
        if(this.btn_add){
            this.btn_add.remove();
        }
        // remove generated elements
        if(this.rec_search_dialog){
            this.rec_search_dialog.remove();
        }
        if(this.rec_relation_dialog){
            this.rec_relation_dialog.remove();
        }
        if(this.header){
            this.header.remove();
        }
        if(this.inputs){
            $.each(this.inputs, function(index, value){ value.remove(); } );
            this.input_cell.remove();
        }
    },

    /**
    * get value for given record type structure field
    *
    * dtFields - either from rectypes.typedefs and index is taken from dtFieldNamesToIndex
    *          - or it is object with following list of properties
    dty_Type,
    rst_DisplayName,  //label
    rst_DisplayHelpText  (over dty_HelpText)           //hint
    rst_DisplayExtendedDescription  (over dty_ExtendedDescription) //rollover

    rst_RequirementType,  //requirement
    rst_MaxValues     //repeatability

    rst_DisplayWidth - width in characters

    rst_PtrFilteredIDs
    rst_FilteredJsonTermIDTree      @todo rename to rst_FieldConfig (over dty_JsonConfig)
    rst_TermIDTreeNonSelectableIDs
    dty_TermIDTreeNonSelectableIDs
    *
    *
    * @param fieldname
    */
    f: function(fieldname){

        var val = this.options['dtFields'][fieldname]; //try get by name
        if(window.hWin.HEURIST4.util.isnull(val) && this.options.rectypes){ //try get by index
            var fi = this.options.rectypes.typedefs.dtFieldNamesToIndex;
            val = this.options['dtFields'][fi[fieldname]];
        }
        if(window.hWin.HEURIST4.util.isempty(val)){ //some default values
            if(fieldname=='rst_RequirementType') val = 'optional'
            else if(fieldname=='rst_MaxValues') val = 1
                else if(fieldname=='dty_Type') val = 'freetext'
                    else if(fieldname=='rst_DisplayWidth'
                        && (this.f('dty_Type')=='freetext' || this.f('dty_Type')=='blocktext' || this.f('dty_Type')=='resource')) {
                            val = 60;
                        }
        }
        return val;

        /*}else{
        var rfrs = this.options.rectypes.typedefs[this.options.rectypeID].dtFields[this.options.dtID];
        var fi = this.options.rectypes.typedefs.dtFieldNamesToIndex;
        return rfrs[fi[fieldname]];
        }*/
    },


    //
    //
    //
    _removeInput: function(input_id){
        if(this.inputs.length>1){
            //find in array
            var that = this;
            $.each(this.inputs, function(idx, item){

                var $input = $(item);
                if($input.attr('id')==input_id){
                    if(that.newvalues[input_id]){
                        delete that.newvalues[input_id];
                    }
                    
                    if(that.detailType=='file'){
                        $input.fileupload('destroy');
                        $input.remove();
                        that.input_cell.find('.input-div').remove();
                    }else{
                        //remove element
                        $input.parents('.input-div').remove();
                    }
                    //remove from array
                    that.inputs.splice(idx,1);
                    return;
                }

            });
        }
    },
    
    
    _onChange: function(event){
        if($.isFunction(this.options.change)){
            this.options.change.call();    
        }
    },

    /**
    * add input according field type
    *
    * @param value
    * @param idx - index for repetative values
    */
    _addInput: function(value) {

        if(!this.inputs){//init
            this.inputs = [];
        }

        var that = this;

        var $input = null;
        //@todo check faceted search!!!!! var inputid = 'input'+(this.options.varid?this.options.varid :idx+'_'+this.options.dtID);
        //repalce to uniqueId() if need
        value = window.hWin.HEURIST4.util.isnull(value)?'':value;


        var $inputdiv = $( "<div>" ).addClass('input-div').insertBefore(this.input_prompt);  //.appendTo( this.input_cell );

        if(this.detailType=='blocktext'){

            $input = $( "<textarea>",{rows:3})
            .uniqueId()
            .addClass('text ui-widget-content ui-corner-all')
            .val(value)
            .change(function(){that._onChange();})
            .appendTo( $inputdiv );

        }else if(this.detailType=='enum' || this.detailType=='relationtype'){

            $input = $( '<select>' )
            .uniqueId()
            .addClass('text ui-widget-content ui-corner-all')
            .css('width','auto')
            .val(value)
            .change(function(){that._onChange();})
            .appendTo( $inputdiv );

            this._recreateSelector($input, value);

        }else if(this.detailType=='boolean'){

            $input = $( '<input>',{type:'checkbox', value:'1'} )
            .uniqueId()
            .addClass('text ui-widget-content ui-corner-all')
            .css('vertical-align','-3px')
            .change(function(){that._onChange();})
            .appendTo( $inputdiv );

            if(!(value==false || value=='0' || value=='n')){
                $input.prop('checked','checked');
            }

        }else if(this.detailType=="rectype"){

            $input = $( "<select>" )
            .uniqueId()
            .addClass('text ui-widget-content ui-corner-all')
            .css('width','auto')
            .val(value)
            .change(function(){that._onChange();})
            .appendTo( $inputdiv );

            window.hWin.HEURIST4.ui.createRectypeSelect($input.get(0),null, this.f('cst_EmptyValue'));
            if(value){
                $input.val(value);
            }

        }else if(this.detailType=="user"){ //special case - only groups of current user

            $input = $( "<select>")
            .uniqueId()
            .addClass('text ui-widget-content ui-corner-all')
            .css('width','auto')
            .val(value)
            .change(function(){that._onChange();})
            .appendTo( $inputdiv );

            window.hWin.HEURIST4.ui.createUserGroupsSelect($input.get(0),null,
                [{key:'',title:window.hWin.HR('select user/group...')},
                    {key:window.hWin.HAPI4.currentUser['ugr_ID'], title:window.hWin.HAPI4.currentUser['ugr_FullName'] }] );
            if(value){
                $input.val(value);
            }

        }else if(this.detailType=="relmarker"){ 
            
                this.options.showclear_button = false;

                var __show_addlink_dialog = function(){
                            var url = window.hWin.HAPI4.baseURL 
                                +'hclient/framecontent/recordAddLink.php?db='+window.hWin.HAPI4.database
                                +'&source_ID=' + that.options.recID
                                +'&dty_ID=' + that.options.dtID;
                            
                            window.hWin.HEURIST4.msg.showDialog(url, {height:380, width:600,
                                title: window.hWin.HR('Add relationship'),
                                class:'ui-heurist-bg-light',
                                callback: function(context){
                                    
                                    //add new element
                //context = {rec_ID: targetIDs[0], rec_Title:sTargetName, rec_RecTypeID:target_RecTypeID,                     relation_recID:0, trm_ID:termID };
                                    if(context && context.count>0){
                                        var ele = window.hWin.HEURIST4.ui.createRecordLinkInfo($inputdiv,
                                            context, true);
                                        ele.appendTo($inputdiv);
                                    }
                                    
                                }
                            } );
                };
            
            
                if(this.inputs.length==0){ //show current relations
            
                var sRels = '';
                if(that.options.recordset){
                    
                    var relations = that.options.recordset.getRelations();
                    if(relations && relations.direct){
                        
                        var ptrset = that.f('rst_PtrFilteredIDs');
                        var allTerms = this.f('rst_FilteredJsonTermIDTree');        
                        var headerTerms = this.f('rst_TermIDTreeNonSelectableIDs') || this.f('dty_TermIDTreeNonSelectableIDs');
                        //var terms = window.hWin.HEURIST4.ui.getPlainTermsList(this.detailType, allTerms, headerTerms, null);
                        
                        var headers = relations.headers;
                        var direct = relations.direct;
                        
                        var ph_gif = window.hWin.HAPI4.baseURL + 'hclient/assets/16x16.gif';
                        
                        for(var k in direct){
                            //direct[k]['dtID']==this.options.dtID && 
                            if(direct[k]['trmID']>0){ //relation   
                            
                                //verify that target rectype is satisfy to constraints and trmID allowed
                                var targetID = direct[k].targetID;
                                var targetRectypeID = headers[targetID][2];
                                
                                if(window.hWin.HEURIST4.ui.isTermInList(this.detailType, allTerms, headerTerms, direct[k]['trmID']))                                  {
                                    window.hWin.HEURIST4.ui.createRecordLinkInfo($inputdiv, 
                                        {rec_ID: targetID, 
                                         rec_Title: headers[targetID][0], 
                                         rec_RecTypeID: headers[targetID][1], 
                                         relation_recID: direct[k]['relationID'], 
                                         trm_ID: direct[k]['trmID']}, true);
                                }
                            }
                        }
                    }
                }
                
                    /*
                    $input = $( "<div>")
                        .uniqueId()
                        .html(sRels)
                        //.addClass('ui-widget-content ui-corner-all')
                        .appendTo( $inputdiv );
                   */  
                   $inputdiv
                        .uniqueId();
                   $input = $inputdiv;

                   //define explicit add relationship button
                   var $btn_add_rel_dialog = $( "<button>", {title: "Click to add new relationship"})
                            .addClass("add-rel-button")
                            .button({icons:{primary: "ui-icon-circle-plus"},label:'Add Relationship'})
                            .appendTo( $inputdiv )
                            .click(function(){__show_addlink_dialog()});
            
                    if( $inputdiv.find('.link-div').length>0 ){
                        $btn_add_rel_dialog.hide();
                    }
                
                }else{
                    //this is second call - some links are already defined
                    //show popup dialog
                    __show_addlink_dialog();
                    return;
                }
                
/*            
                        $input.css('width','auto');

                        if(!this.rec_relation_dialog){
                            this.rec_relation_dialog = this.element.rec_relation({

                                rectype_set: this.f('rst_PtrFilteredIDs'), //constraints for target record types
                                reltype_set: this.f('rst_FilteredJsonTermIDTree'), //contraints for relation types
                                reltype_headers: this.f('rst_TermIDTreeNonSelectableIDs') || this.f('dty_TermIDTreeNonSelectableIDs'), //subset of headers for relation type pulldown

                                source_ids: [this.options.recID],
                                isdialog: true
                            });
                        }

                        var $btn_rec_relation_dialog = $( "<button>", {title: "Click to define relationship"})
                        .addClass("smallbutton")
                        .appendTo( $inputdiv )
                        .button({icons:{primary: "ui-icon-link"},text:false});

                        function __show_relation_dialog(event){
                            event.preventDefault();

                            that.rec_relation_dialog.rec_relation("option",{
                                //retuns selected recrod
                                onselect: function(event, lbl){ //@todo - work with new relation record
                                    $input.val(lbl);
                                    
                                    //if(recordset && recordset.length()>0){
                                    //var record = recordset.getFirstRecord();
                                    //$input.val(recordset.fld(record,'rec_Title'));
                                    //that.newvalues[$input.attr('id')] = recordset.fld(record,'rec_ID');
                                    //}

                                }
                            });

                            that.rec_relation_dialog.rec_relation( "show" );
                        };

                        this._on( $btn_rec_relation_dialog, { click: __show_relation_dialog } );
                        this._on( $input, { keypress: __show_relation_dialog, click: __show_relation_dialog } );
*/
            
        }else{
            $input = $( "<input>")
            .uniqueId()
            .addClass('text ui-widget-content ui-corner-all')
            .val(value)
            .change(function(){
                    that._onChange();
            })
            .appendTo( $inputdiv );

            if(this.detailType=="integer" || this.detailType=="year"){

                $input.keypress(function (e) {
                    var code = (e.keyCode ? e.keyCode : e.which);
                    var charValue = String.fromCharCode(e.keyCode);
                    var valid = false;

                    if(charValue=='-' && this.value.indexOf('-')<0){
                        this.value = '-'+this.value;
                    }else{
                        valid = /^[0-9]+$/.test(charValue);
                    }

                    if(!valid){
                        window.hWin.HEURIST4.util.stopEvent(e);
                        e.preventDefault();
                        window.hWin.HEURIST4.msg.showTooltipFlash(window.hWin.HR('Numeric field'),1000,$input);
                    }

                });
                /*$input.keyup(function () {
                if (this.value != this.value.replace(/[^0-9-]/g, '')) {
                this.value = this.value.replace(/[^0-9-]/g, '');  //[-+]?\d
                }
                });*/
            }else
            if(this.detailType=="float"){

                    $input.keypress(function (e) {
                        var code = (e.keyCode ? e.keyCode : e.which);
                        var charValue = String.fromCharCode(e.keyCode);
                        var valid = false;

                        if(charValue=='-' && this.value.indexOf('-')<0){
                            this.value = '-'+this.value;
                        }else if(charValue=='.' && this.value.indexOf('.')<0){
                            valid = true;
                        }else{
                            valid = /^[0-9]+$/.test(charValue);
                        }

                        if(!valid){
                            window.hWin.HEURIST4.util.stopEvent(e);
                            e.preventDefault();
                            window.hWin.HEURIST4.msg.showTooltipFlash(window.hWin.HR('Numeric field'),1000,$input);
                        }

                    });

            }else
            if(this.detailType=="date"){
                
                $input.css('width','20ex');
                
                if($.isFunction($('body').calendarsPicker)){
                        
                    var defDate = window.hWin.HAPI4.get_prefs("record-edit-date");
                    $input.calendarsPicker({
                        calendar: $.calendars.instance('gregorian'),
                        showOnFocus: false,
                        defaultDate: defDate?defDate:'',
                        selectDefaultDate: true,
                        dateFormat: 'yyyy-mm-dd',
                        pickerClass: 'calendars-jumps',
                        //popupContainer: $input.parents('body'),
                        onSelect: function(dates){
                        },
                        renderer: $.extend({}, $.calendars.picker.defaultRenderer,
                                {picker: $.calendars.picker.defaultRenderer.picker.
                                    replace(/\{link:prev\}/, '{link:prevJump}{link:prev}').
                                    replace(/\{link:next\}/, '{link:nextJump}{link:next}')}),
                        showTrigger: '<span class="ui-icon ui-icon-calendar trigger" style="display:inline-block" alt="Popup"></span>'}
                    );     
                           
                }else{
                        var $datepicker = $input.datepicker({
                            /*showOn: "button",
                            buttonImage: "ui-icon-calendar",
                            buttonImageOnly: true,*/
                            showButtonPanel: true,
                            changeMonth: true,
                            changeYear: true,
                            dateFormat: "yy-mm-dd"
                            /*,beforeShow : function(dateText, inst){
                                $(inst.dpDiv[0]).find('.ui-datepicker-current').click(function(){
                                    console.log('today '+$datepicker.datepicker( "getDate" ));  
                                });
                            }*/
                        });

                        var $btn_datepicker = $( "<button>", {title: "Show calendar"})
                        .addClass("smallbutton")
                        .appendTo( $inputdiv )
                        .button({icons:{primary: "ui-icon-calendar"},text:false});

                        
                        this._on( $btn_datepicker, { click: function(){$datepicker.datepicker( "show" ); }} );
                }  
                        

            }else 
            if(this.detailType=="resource"){
                
                        $input.css({'min-wdith':'40ex', width:'auto'});

                        //old way - by default lookup for Records filtered by Record Types
                        var ptrset = that.f('rst_PtrFilteredIDs');

                        var __show_select_dialog = null;
                        var $btn_rec_search_dialog = $( "<button>", {title: "Click to search and select"})
                        .addClass("smallbutton")
                        .appendTo( $inputdiv )
                        .button({icons:{primary: "ui-icon-link"},text:false});

                        if(window.hWin.HEURIST4.util.isempty(this.configMode)){

                            __show_select_dialog = function __show_select_dialog(event){
                                event.preventDefault();
       
       //LATEST "ENTITY" SELECTOR - it works, however it requires to load additional js - so it is better to open it in popup url
                                /*
                                 var options = {
                                    select_mode: 'select_single',
                                    edit_mode: 'popup',
                                    select_return_mode: 'recordset',
                                    rectype_set: that.f('rst_PtrFilteredIDs'),
                                    onselect:function(event, data){

                                        if(data && data.selection && window.hWin.HEURIST4.util.isRecordSet(data.selection)){
                                            var record = data.selection.getFirstRecord();
                                            var rec_Title = data.selection.fld(record,'rec_Title');
                                            that.newvalues[$input.attr('id')] = data.selection.fld(record,'rec_ID');
                                            $input.val(rec_Title).change();
                                        }
                                    }
                                 };                                
                                 //public function on manageRecords.js
                                 showManageRecords( options ); 
                                 */
       //SELECTOR in POPUP URL
                                var url = window.hWin.HAPI4.baseURL +
                                'hclient/framecontent/recordSelect.php?db='+window.hWin.HAPI4.database+
                                '&rectype_set='+that.f('rst_PtrFilteredIDs');
                                window.hWin.HEURIST4.msg.showDialog(url, {height:600, width:600,
                                    title: window.hWin.HR('Select linked record'),
                                    class:'ui-heurist-bg-light',
                                    callback: function(recordset){
                                        if( window.hWin.HEURIST4.util.isRecordSet(recordset) ){
                                            var record = recordset.getFirstRecord();
                                            var rec_Title = recordset.fld(record,'rec_Title');
                                            that.newvalues[$input.attr('id')] = recordset.fld(record,'rec_ID');
                                            $input.val(rec_Title).change();
                                        }
                                    }
                                } );
                                 
                            };
             
        //OLDEST H3 SELECTOR
        /*
        top.HEURIST.rectypes = window.hWin.HEURIST4.rectypes;                        
                                
        var url = window.hWin.HAPI4.baseURL+'records/pointer/selectRecordFromSearch.html?' 
        +'&db='+window.hWin.HAPI4.database+'&t='+that.f('rst_PtrFilteredIDs');
            
        window.hWin.HEURIST4.msg.showDialog(url, {height:600, width:600,    
                                    title: window.hWin.HR('Select linked record'),
                                    class:'ui-heurist-bg-light',
                                    callback: function(bibID, bibTitle){
                                        if(bibID>0){
                                            var name = bibTitle;
                                            that.newvalues[$input.attr('id')] = bibID;
                                            $input.val(bibTitle).change();
                                        }
                                    }
                                } );
                            };
        */

                                //assign initial display value
                                if(Number(value)>0){
                                    var sTitle = null;
                                    if(that.options.recordset){
                                        var relations = that.options.recordset.getRelations();
                                        if(relations && relations.headers && relations.headers[value]){
                                            var sTitle = window.hWin.HEURIST4.util.htmlEscape(relations.headers[value][0]);
                                            $input.val(sTitle);
                                        }
                                    }
                                    if(!sTitle){
                                        window.hWin.HAPI4.RecordMgr.search({q: 'ids:'+value, w: "all", f:"header"}, 
                                            function(response){
                                                if(response.status == window.hWin.HAPI4.ResponseStatus.OK){
                                                    var recordset = new hRecordSet(response.data);
                                                    $input.val( recordset.fld(recordset.getFirstRecord(),'rec_Title') );        
                                                }
                                            }
                                        );
                                    }
                                    
                                }

                            //$input.css('width', this.options['input_width']?this.options['input_width']:'300px');
                        }else{ //---------------------------------------------
                            //this is entity selector
                            //detect entity
                            var entityName = this.configMode.entity;
                            var widgetName = 'manage'+entityName.capitalize();
                            
                            if(window.hWin.HEURIST4.util.isempty(entityName)) entityName='Records'; //by default

                            if($.isFunction($('body')[widgetName])){ //OK! widget js has been loaded

                                var popup_options = {
                                    isdialog: true,
                                    select_mode: (this.configMode.csv==true?'select_multi':'select_single'),
                                    //selectbutton_label: '',
                                    //page_size: $('#page_size').val(),
                                    //action_select: false,
                                    //action_buttons: true,
                                    filter_group_selected:null,
                                    filter_groups: this.configMode.filter_group,
                                    onselect:function(event, data){
                                        
                                        if( data && window.hWin.HEURIST4.util.isArrayNotEmpty(data.selection) )
                                        {
                                            //config and data are loaded already, since dialog was opened
                                            var display_value = window.hWin.HAPI4.EntityMgr.getTitlesByIds(entityName, data.selection);
                                            $input.val( display_value.join(',') );
                                            that.newvalues[$input.attr('id')] = data.selection.join(',');
                                        }

                                    }
                                }//options

                                __show_select_dialog = function(event){
                                        //init dilaog
                                        var manage_dlg = $('<div>')
                                            .uniqueId()
                                            .appendTo( $('body') )
                                            [widgetName]( popup_options );

                                        manage_dlg[widgetName]( 'popupDialog' );
                                }
                                
                                //assign initial display value
                                var display_value = window.hWin.HAPI4.EntityMgr.getTitlesByIds(entityName, value.split(','));                                         $input.val( display_value.join(',') );
                            }
                        }

                        if(__show_select_dialog!=null){
                            this._on( $btn_rec_search_dialog, { click: __show_select_dialog } );
                            this._on( $input, { keypress: __show_select_dialog, click: __show_select_dialog } );
                        }
                        
                        this.newvalues[$input.attr('id')] = value;

            }else 
            if( this.detailType=='file' && this.configMode.entity=='records'){
                //at the momenet we use H3 file/url selector
                
console.log(value); 
                var urlThumb = '';
                if(value && value['ulf_ObfuscatedFileID']){
                    urlThumb = window.hWin.HAPI4.baseURL + '?db='+window.hWin.HAPI4.database+'&thumb='+
                        value['ulf_ObfuscatedFileID'];
                    $input.val( value['ulf_OrigFileName'] );
                }
                //container for image
                var $input_img = $('<div class="image_input ui-widget-content ui-corner-all">'
                    + '<img src="'+urlThumb+'" class="image_input"></div>').appendTo( $inputdiv );                

                //browse button    
                var $btn_fileselect_dialog = $( "<button>", {title: "Click to upload of select file"})
                        .addClass("smallbutton")
                        .css('vertical-align','top')
                        .appendTo( $inputdiv )
                        .button({icons:{primary: "ui-icon-folder-open"},text:false});
           
                var __show_select_fileurl = function(){
                    
                    var filed = that.newvalues[$input.attr('id')];
                    
                    var fieldata = encodeURIComponent(JSON.stringify({
                        remoteURL:filed['ulf_ExternalFileReference'],
                        origName:filed['ulf_OrigFileName'],
                        URL:  window.hWin.HAPI4.baseURL + '?db='+window.hWin.HAPI4.database
                                                        + '&file='+filed['ulf_ObfuscatedFileID'],
                        ext: filed['ulf_MimeExt'],
                        mediaType:filed['mediaType'],
                        remoteSource:filed['remoteSource'],
                        id: filed['ulf_ID'],
                        nonce: filed['ulf_ObfuscatedFileID'],
                    }));
        
                    var url = window.hWin.HAPI4.baseURL+'records/files/uploadFileOrDefineURL.html?value='+fieldata 
                        +'&db='+window.hWin.HAPI4.database+'&recid='+that.options.recID;
            
                    window.hWin.HEURIST4.msg.showDialog(url, {height:480, width:640,    
                        title: window.hWin.HR('Upload file or define URL'),
                        class:'ui-heurist-bg-light',
                        callback: function(isChanged, fileJSON) {

                            if(isChanged){

                                if(window.hWin.HEURIST4.isempty(fileJSON)){
                                    var r = confirm('You uploaded/changed the file data. If you continue, all changes will be lost.');
                                    return r;
                                }else{
                                    var filedata = JSON.parse(fileJSON);
                                    
                                    var filed = {
                                        ulf_ExternalFileReference: filedata['remoteURL'],
                                        ulf_OrigFileName:     filedata['origName'],
                                        ulf_MimeExt:          filedata['ext'],
                                        ulf_ObfuscatedFileID: filedata['nonce'],
                                        ulf_ID:               filedata['id'],
                                        URL:                  filedata['URL'],
                                        mediaType:            filedata['mediaType'],
                                        remoteSource:         filedata['remoteSource']
                                    };
                                    
                                    var urlThumb = window.hWin.HAPI4.baseURL + '?db='+window.hWin.HAPI4.database+'&thumb='+
                                                filed['ulf_ObfuscatedFileID'];
                                    $input.val( (filed.remoteSource=='heurist')
                                                        ?filed['ulf_OrigFileName']
                                                        :filed['ulf_ExternalFileReference'] );
                                    that.newvalues[$input.attr('id')] = filed;
                                    
                                    $input_img.find('img').attr('src', urlThumb);
                                    
                                }

                            }
                            //var helpDiv = document.getElementById("ui-pref-showhelp");
                            //top.HEURIST.util.setHelpDiv(helpDiv,null);

                            return true; //prevent close
                        }//callback
                    } );
           
                }//__show_select_fileurl
           
                this._on( $btn_fileselect_dialog, { click: __show_select_fileurl } );
                this._on($input_img, {click: __show_select_fileurl }); 
           
                if(value && value['ulf_ID']){
                    that.newvalues[$input.attr('id')] = value;
                }
            }
            else
            if( this.detailType=='file' ){
                
                        //url for thumb
                        var urlThumb = window.hWin.HAPI4.getImageUrl(this.configMode.entity, this.options.recID, 'thumbnail');
                        
                        //container for image
                        var $input_img = $('<div class="image_input ui-widget-content ui-corner-all">'
                            + '<img src="'+urlThumb+'" class="image_input"></div>').appendTo( $inputdiv );                
                            
                        //browse button    
                        var $btn_fileselect_dialog = $( "<button>", {title: "Click to select file for upload"})
                        .addClass("smallbutton")
                        .css('vertical-align','top')
                        .appendTo( $inputdiv )
                        .button({icons:{primary: "ui-icon-folder-open"},text:false});
                        
                        //set input as file and hide
                        $input.prop('type','file').hide();
                        
                        //temp file name 
                        var newfilename = '~'+window.hWin.HEURIST4.util.random();
                        
                        //init upload widget
                        $input.fileupload({
    url: window.hWin.HAPI4.baseURL +  'hserver/utilities/fileUpload.php',  //'ext/jquery-file-upload/server/php/',
    //url: 'templateOperations.php',
    formData: [ {name:'db', value: window.hWin.HAPI4.database}, 
                {name:'entity', value:this.configMode.entity},
                {name:'newfilename', value:newfilename }], //unique temp name
    //acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i
    //autoUpload: true,
    sequentialUploads:true,
    dataType: 'json',
    dropZone: $input_img,
    // add: function (e, data) {  data.submit(); },
    done: function (e, response) {
            response = response.result;
            if(response.status==window.hWin.HAPI4.ResponseStatus.OK){
                var data = response.data;
                $.each(data.files, function (index, file) {
                    if(file.error){ //it is not possible we should cought it on server side - just in case
                        $input_img.find('img').prop('src', '');
                        window.hWin.HEURIST4.msg.showMsgErr(file.error);
                    }else{
                        $input.attr('title', file.name);
                        $input_img.find('img').prop('src', file.thumbnailUrl);
                        that.newvalues[$input.attr('id')] = newfilename;
                    }
                });
            }else{
                window.hWin.HEURIST4.msg.showMsgErr(response.message);
            }
            var inpt = this;
            $input_img.off('click');
            $input_img.on({click: function(){
                        $(inpt).click();
            }});
            },                            
    progressall: function (e, data) { // to implement
        var progress = parseInt(data.loaded / data.total * 100, 10);
        //$('#progress .bar').css('width',progress + '%');
    }                            
                        });
                
                        //init click handlers
                        this._on( $btn_fileselect_dialog, { click: function(){ $input_img.click(); } } );
                        $input_img.on({click: function(){ //find('a')
                                $input.click();}
                        }); 
            }
            else //------------------------------------------------------------------------------------
            if(this.detailType=="geo"){
                
                $input.css('width','20ex');
                //browse button    
                var $btn_digitizer_dialog = $( "<button>", {title: "Click to draw map location"})
                        .addClass("smallbutton")
                        .css('vertical-align','top')
                        .appendTo( $inputdiv )
                        .button({icons:{primary: "ui-icon-globe"},text:false});
                      
                __show_mapdigit_dialog = function __show_select_dialog(event){
                    event.preventDefault();

                    var url = window.hWin.HAPI4.baseURL +
                    'hclient/framecontent/mapDraw.php?db='+window.hWin.HAPI4.database+
                    '&wkt='+$input.val();
                    
                    window.hWin.HEURIST4.msg.showDialog(url, {height:'800', width:'1000',
                        title: window.hWin.HR('Heurist map digitizer'),
                        class:'ui-heurist-bg-light',
                        callback: function(location){
                            if( !window.hWin.HEURIST4.util.isempty(location) ){
                                //that.newvalues[$input.attr('id')] = location
                                $input.val(location.type+' '+location.wkt).change();
                            }
                        }
                    } );
                };

                this._on( $btn_digitizer_dialog, { click: __show_mapdigit_dialog } );
                this._on( $input, { keypress: __show_mapdigit_dialog, click: __show_mapdigit_dialog } );
            }
            /*else if(this.detailType=="freetext" && this.options['input_width']){
            $input.css('width', this.options['input_width']);
            }*/

        }

        if (parseFloat( this.f('rst_DisplayWidth') ) > 0 
            && this.detailType!='boolean' && this.detailType!='date') {    //if the size is greater than zero
            $input.css('width', Math.round(2 + Math.min(100, Number(this.f('rst_DisplayWidth')))) + "ex"); //was *4/3
        }


        this.inputs.push($input);

        //name="type:1[bd:138]"

        //clear button
        //var $btn_clear = $( "<div>")
        if(this.options.showclear_button)
        {

            var $btn_clear = $('<button>',{
                title: 'Clear entered value',
                'data-input-id': $input.attr('id')
            })
            .addClass("smallbutton btn_input_clear")
            //.css({'vertical-align': (this.detailType=='blocktext' || this.detailType=='file')?'top':'' })
            .appendTo( $inputdiv )
            .button({icons:{primary: "ui-icon-circlesmall-close"},text:false});
            //.position( { my: "right top", at: "right top", of: $($input) } );

            // bind click events
            this._on( $btn_clear, {
                click: function(e){
                    var input_id = $(e.target).parent().attr('data-input-id');
                    if(that.inputs.length>1){  //remove supplementary 
                        that._removeInput( input_id );
                    }else{  //and clear last one
                        that._clearValue(input_id, '');
                    }
                }
            });

        }

        return $input.attr('id');

    },


    //
    // recreate SELECT for enum/relation type
    //
    _recreateSelector: function($input, value){

        $input.empty();

        var allTerms = this.f('rst_FieldConfig');

        if(!window.hWin.HEURIST4.util.isempty(allTerms)){//this is not vocabulary ID, this is something more complex

            if($.isPlainObject(this.configMode)){ //this lookup for entity

                //create and fill SELECT
                //this.configMode.entity
                //this.configMode.filter_group

                //add add/browse buttons
                window.hWin.HEURIST4.ui.createEntitySelector($input.get(0), this.configMode, true, null);

                if(this.configMode.button_browse){

                }

            }else{

                if (!$.isArray(allTerms) && !window.hWin.HEURIST4.util.isempty(allTerms)) {
                    //is it CS string - convert to array
                    allTerms = allTerms.split(',');
                }

                if(window.hWin.HEURIST4.util.isArrayNotEmpty(allTerms)){
                    if(window.hWin.HEURIST4.util.isnull(allTerms[0]['key'])){
                        //plain array
                        var idx, options = [];
                        for (idx=0; idx<allTerms.length; idx++){
                            options.push({key:allTerms[idx], title:allTerms[idx]});
                        }
                        allTerms = options;
                    }
                    //array of key:title objects
                    window.hWin.HEURIST4.ui.createSelector($input.get(0), allTerms);
                }
            }
            if(!window.hWin.HEURIST4.util.isnull(value))  $input.val(value);

        }else{ //this is usual enumeration from defTerms

            allTerms = this.f('rst_FilteredJsonTermIDTree');        
            //headerTerms - not used anymore
            var headerTerms = this.f('rst_TermIDTreeNonSelectableIDs') || this.f('dty_TermIDTreeNonSelectableIDs');

            //vocabulary
            window.hWin.HEURIST4.ui.createTermSelectExt2($input.get(0),
                {datatype:this.detailType, termIDTree:allTerms, headerTermIDsList:headerTerms,
                    defaultTermID:value, topOptions:true, supressTermCode:true});
        }
    },

    //
    // internal - assign display value for specific input element
    //
    _clearValue: function(input_id, value, display_value){

        var that = this;
        $.each(this.inputs, function(idx, item){

            var $input = $(item);
            if($input.attr('id')==input_id){
                if(that.newvalues[input_id]){
                    that.newvalues[input_id] = '';
                }
                
                if(that.detailType=='file'){
                    that.input_cell.find('img.image_input').prop('src','');
                }else{
                    $input.val( display_value?display_value :value);    
                }
                that._onChange();
                return;
            }

        });

    },

    //
    // recreate input elements and assign values
    //
    setValue: function(values){

        //clear previous inputs
        this.input_cell.find('.input-div').remove();
        this.inputs = [];

        var isReadOnly = (this.options.readonly || this.f('rst_Display')=='readonly');

        var i;
        for (i=0; i<values.length; i++){
            if(isReadOnly){
                this._addReadOnlyContent(values[i]);
            }else{
                var inpt_id = this._addInput(values[i]);
            }
        }
        if (isReadOnly) {
            this.options.values = values;
        }

    },

    //
    // get value for particular input element
    //  input_id - id or element itself
    //
    _getValue: function(input_id){

        if(this.detailType=="relmarker") return null;
        
        var res = null;
        var $input = $(input_id);

        if(!(this.detailType=="resource" || this.detailType=="file")){
            res = $input.val();
        }else if (!window.hWin.HEURIST4.util.isempty( this.newvalues[$input.attr('id')] ) ){
            res = this.newvalues[$input.attr('id')];
            if (this.detailType=="file"){
                res = res['ulf_ID'];
            }
        }

        return res;
    },

    //
    //
    //
    getValues: function(){

        if(this.options.readonly || this.f('rst_Display')=='readonly'){
            return this.options.values;
        }else{
            var idx;
            var ress = [];
            for (idx in this.inputs) {
                var res = this._getValue(this.inputs[idx]);
                if(!window.hWin.HEURIST4.util.isempty( res ) || ress.length==0){ //provide the only empty value  || res.trim()!=''
                    if(window.hWin.HEURIST4.util.isnull( res )) res = '';
                    ress.push(res)
                }
            }
            return ress;
        }

    },

    
    //
    //
    //
    setDisabled: function(is_disabled){

        if(!(this.options.readonly || this.f('rst_Display')=='readonly')){
            var idx;
            for (idx in this.inputs) {
                var input_id = this.inputs[idx];
                var $input = $(input_id);
                window.hWin.HEURIST4.util.setDisabled($input, is_disabled);
            }
        }

    },
    
    //
    //
    //
    isChanged: function(value){

        if(value===true){
            this.options.values = [''];
            return true;
        }else{
        
            if(this.options.readonly || this.f('rst_Display')=='readonly'){
                return false;
            }else{
                if(this.options.values.length!=this.inputs.length){
                    return true;
                }
                var idx;
                for (idx in this.inputs) {
                    var res = this._getValue(this.inputs[idx]);
                    
                    if (!(window.hWin.HEURIST4.util.isempty(this.options.values[idx]) && window.hWin.HEURIST4.util.isempty(res))
                       && (this.options.values[idx]!=res)){
                        return true;
                    }
                }
            }
        
            return false;        
        
        }
    },
    
    //
    // returns array of input elements
    //
    getInputs: function(){
        return this.inputs;
    },

    validate: function(){

        var req_type = this.f('rst_RequirementType');
        var max_length = this.f('dty_Size');
        var data_type = this.f('dty_Type');
        var errorMessage = '';

        if(req_type=='required'){

            var ress = this.getValues();

            if(ress.length==0 || window.hWin.HEURIST4.util.isempty(ress[0]) || ress[0].trim()=='' ){
                //error highlight
                $(this.inputs[0]).addClass( "ui-state-error" );
                //add error message
                errorMessage = 'Field is requried. Please specify value';

            }else if((data_type=='freetext' || data_type=='blocktext') && ress[0].length<4){
                //errorMessage = 'Field is requried. Please specify value';
            }
        }
        //verify max alowed size
        if(max_length>0 &&
            (data_type=='freetext' || data_type=='blocktext')){

            var idx;
            for (idx in this.inputs) {
                var res = this._getValue(this.inputs[idx]);
                if(!window.hWin.HEURIST4.util.isempty( res ) && res.length>max_length){
                    //error highlight
                    $(this.inputs[idx]).addClass( "ui-state-error" );
                    //add error message
                    errorMessage = 'Field is requried. Please specify value';
                }
            }
        }
        if(data_type=='integer' || this.detailType=='year'){
            //@todo validate 
            
        }else if(data_type=='float'){
            
            
        }
        

        if(errorMessage!=''){
            this.error_message.text(errorMessage);
            this.error_message.show();
        }else{
            this.error_message.hide();
            $(this.inputs).removeClass('ui-state-error');
        }

        return (errorMessage=='');
    },

    
    focus: function(){
        if(this.inputs && this.inputs.length>0){
            $(this.inputs[0]).focus();   
            return true;
        }else{
            return false;
        }
    },

    //
    //
    //
    _addReadOnlyContent: function(value, idx) {

        var disp_value ='';

        if($.isArray(value)){

            disp_value = value[1]; //record title, relation description, filename, human readable date and geo

        }else if(this.detailType=="enum" || this.detailType=="relationtype"){

            disp_value = window.hWin.HEURIST4.ui.getTermValue(value, true);

            if(window.hWin.HEURIST4.util.isempty(value)) {
                disp_value = 'term missed. id '+termID
            }
        } else if(this.detailType=="file"){

            disp_value = "@todo file "+value;

        } else if(this.detailType=="resource"){

            disp_value = "@todo resource "+value;

        } else if(this.detailType=="relmarker"){  //combination of enum and resource

            disp_value = "@todo relation "+value;

            //@todo NEW datatypes
        } else if(this.detailType=="geo"){

            /*if(detailType=="query")
            if(detailType=="color")
            if(detailType=="bool")
            if(detailType=="password")*/

            disp_value = "@todo geo "+value;


        }else{
            disp_value = value;
        }

        if(this.detailType=="blocktext"){
            this.input_cell.css({'padding-top':'0.4em'});
        }

        var $inputdiv = $( "<div>" ).addClass('input-div').css({'font-weight':'bold'}).insertBefore(this.input_prompt);

        $inputdiv.html(disp_value);
        
    }


});

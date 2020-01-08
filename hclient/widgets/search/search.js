/**
* Builds and manages display of the main Heurist page - search and visualisation
*
* Before this widget was generic, however search on main page became very distinctive and got lot of additional ui comonents.
* Thus, we have the specific search widget and this one remains for main ui
*
* @package     Heurist academic knowledge management system
* @link        http://HeuristNetwork.org
* @copyright   (C) 2005-2019 University of Sydney
* @author      Artem Osmakov   <artem.osmakov@sydney.edu.au>
* @note        Completely revised for Heurist version 4
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


$.widget( "heurist.search", {

    // default options
    options: {
        search_domain: 'a', //current search domain all|bookmark|recently added|recently selected  or a|b|r|s
        search_domain_set: null, // comma separated list of allowed domains  a,b,c,r,s

        isloginforced:true,

        btn_visible_newrecord: true, // show add record button
        btn_visible_save: false,     // save search popup button
        btn_entity_filter: true,     // show buttons: filter by entity
        menu_entity_filter: true,    // show dropdown entity filter
        search_button_label: '',
        search_input_label: '',
        
        button_class: 'ui-heurist-btn-header1',
        
        
        isapplication:true,  // send and recieve the global events
        // callbacks
        onsearch: null,  //on start search
        onresult: null,   //on search result
        
        search_realm:  null  //accepts search/selection events from elements of the same realm only
    },

    _total_count_of_curr_request: 0, //total count for current request (main and rules) - NOT USED

    query_request:null,
    search_assistant:null,
    search_assistant_popup:null,
    
    buttons_by_entity:[], //

    _is_publication:false, //this is CMS publication - take css from parent
    
    // the constructor
    _create: function() {
        
        var that = this;
        
        if(this.element.parent().attr('data-heurist-app-id')){
            
            this.options.button_class = '';
            this._is_publication = true;
            //this is CMS publication - take bg from parent
            this.element.addClass('ui-widget-content').css({'background':'none','border':'none'});
        }else
        //this.element.css({border:'2px solid green','background-color':'lightgreen'});
        if(false && window.hWin.HAPI4.sysinfo['layout']!='H4Default' && window.hWin.HAPI4.sysinfo['layout']!='H5Default'){
            this.element.addClass('ui-heurist-header1'); //dark navy bg - used long ago in original layout - to remove
        }else{
            this.element.addClass('ui-widget-content');
        }
        this.element.css({height:'100%',height:'100%','font-size':'0.8em'});

        //var css_valign = {'position': 'relative', 'top': '50%', 'transform': 'translateY(-50%)',
        //          '-webkit-transform': 'translateY(-50%)', '-ms-transform': 'translateY(-50%)'};

        var sz_search = '500px',
        sz_input = '350px',
        sz_search_padding = '0';


        var div_left_visible = (!this.options.isloginforced || this.options.btn_visible_dbstructure);

        if(false) //div_left_visible)
        {

            // database summary, login and register buttons in navigation panel
            var div_left  = $('<div>')
            .css({'height':'2em','width':0, 'padding':'1.8em','float':'left'})
            .appendTo( this.element );

            if(!this.options.isloginforced){
                // Login button if not already logged in
                this.btn_login = $( "<button>" ) // login button
                .css('width',(window.hWin.HAPI4.sysinfo.registration_allowed==1)?'80px':'160px')
                .addClass('logged-out-only')
                .addClass(this.options.button_class)
                .appendTo(div_left)
                .button({label: window.hWin.HR("Login"), icon:'ui-icon-key'})
                .click( function(){ that._doLogin(); });

                // Register button if the database permits user registration
                if(window.hWin.HAPI4.sysinfo.registration_allowed==1){
                    this.btn_register = $( "<button>", {
                        label: window.hWin.HR("Register")
                    })
                    .css('width','80px')
                    .addClass('logged-out-only')
                    .addClass(this.options.button_class)
                    .appendTo(div_left)
                    .button()
                    .click( function(){ that._doRegister(); });
                } // register button
                
                div_left.css('width','200px');

            } // not bypassing login

        }else{ // lefthand - navigation - panel not visible
            sz_search = '600px';
            sz_input = '450px';
            sz_search_padding = '20px';
        }

        //------------------------------------------- filter by entities
        this.options.btn_entity_filter = this.options.btn_entity_filter && (window.hWin.HAPI4.get_prefs_def('entity_btn_on','1')=='1');
        
        this.div_entity_btns   = $('<div>').addClass('heurist-entity-filter-buttons')
                                .css({ 'display':(this._is_publication?'none':'block'),
                                    'padding':this._is_publication?0:('20px 5 20px '+sz_search_padding),
                                    'visibility':this.options.btn_entity_filter?'visible':'hidden',
                                    'height':this.options.btn_entity_filter?'auto':'10px'})
                                .appendTo( this.element );
        //quick filter by entity
        var $d2 = $('<div>').css('float','left');
        $('<label>').text(window.hWin.HR('Entities')).appendTo($d2);
        
        
        if(this.options.menu_entity_filter){
            this.filter_by_entity = $('<span title="Show list of entities to filter">'
            +'by usage <span class="ui-icon ui-icon-triangle-1-s"></span></span>')  
            .addClass('graytext')
            .css({'text-decoration':'none','padding':'0 10px','outline':0,'font-weight':'bold', 'font-size': '12px',cursor:'pointer'})
            .appendTo( $d2 ); //was div_search_help_links
        }
        
        
        this.btns_by_entity = $('<button>').button({label: window.hWin.HR("Show list of entities to filter"), 
                  showLabel:false, icon:'ui-icon-gear'})
        .appendTo($d2);         //.css({'font-size':'1.1em'})
        $d2.appendTo(this.div_entity_btns);
        
        //selector with checkboxes to select filter by entity buttons
        this.btns_by_entity_options = {select_name:'select_btns_by_entity', 
                useIcons: true, useCounts:true, useGroups:true, useCheckboxes:true, 
                ancor: this.btns_by_entity, 
                marked: this.buttons_by_entity,
                showAllRectypes: true, 
                onmarker: function (ele){
                    var is_checked = !ele.hasClass('ui-icon-check-on');
                    var rty_ID = ele.attr('data-id');
                    
                    ele.removeClass('ui-icon-check-'+(is_checked?'off':'on'))
                        .addClass('ui-icon-check-'+(is_checked?'on':'off'));                    
                    
                    var idx = window.hWin.HEURIST4.util.findArrayIndex(rty_ID, this.buttons_by_entity);
                    if(is_checked){
                        if(idx<0) this.buttons_by_entity.push(rty_ID);    
                    }else{
                        if(idx>=0) this.buttons_by_entity.splice(idx, 1);    
                    }
                    this._redraw_buttons_by_entity();
                },
                onselect: function __onSelectRectypeFilter(event, data){
                               var selval = data.item.value;
                               if(selval>0){
                                   that.select_rectype_filter.val(selval);
                                   that.input_search.val('t:'+selval);
                                   that._doSearch(true);
                               }
                               return false;
                           }};            
        
        //click on button - opens rectype selector with checkboxes
        this._on( this.btns_by_entity, {  click: function(){
                this._openSelectRectypeFilter( this.btns_by_entity_options );
                return false;
        } });

         
        //------------------------------------------- filter inputs                        

        // Search functions container
        //'height':'100%', 'float':'left'   , 'min-width':sz_search  ,  
        this.div_search   = $('<div>').css({ 'float':'left', 'width':'100%' }).appendTo( this.element );

               
        
        //header-label
        this.div_search_header = $('<div>')
        .css({'width':'auto','text-align':'right','height':'6.88em','line-height':'31px','padding-left':sz_search_padding})
        .addClass('div-table-cell')
        .appendTo( this.div_search );
        
        if(this.options.search_input_label){
            this.div_search_header.text( this.options.search_input_label ).css({'padding-right':'4px'});     
        }
        
        
/* hidden on 2016-11-11        
        $( "<label>" ).text(window.hWin.HR("Filter"))
        .css({'font-weight':'bold','font-size':'1.2em','padding-left':'1em','padding-right':'1em','vertical-align': 'top', 'line-height':'20px'})
        .appendTo( this.div_search_header );
*/

        // Search field
        this.div_search_input = $('<div>')
        .addClass('div-table-cell')       
        .appendTo( this.div_search );

        //promt to be shown when input is empty        
        this.input_search_prompt = $( "<span>" )
        .text(this._is_publication?'':window.hWin.HR("enter search/filter or use filter builder at right"))
        .addClass('graytext')
        .css({'font-size':'0.8em', 'margin': '22px 0 0 0.5em',
              'position': 'absolute'})
        .appendTo( this.div_search_input );
        this._on( this.input_search_prompt, {click: function(){
                //AAAA  
                this.input_search.focus()
        }} );

        //promt to be shown when input has complex search expression (json search)
        this.input_search_prompt2 = $( "<span>" )
        .html('<span style="font-size:1em">'+window.hWin.HR("filter")
                +'</span>&nbsp;&nbsp;<span class="ui-icon ui-icon-eye" style="font-size:2em;width: 1.7em;margin-top:1px"/>')
        .css({'width':'370', height:'20px','background':'#F4F2F4', 'padding':'10', 
              'position': 'absolute'})
        .appendTo( this.div_search_input );
        this._on( this.input_search_prompt2, {click: function(){
                this.input_search_prompt2.hide();
                this.input_search.focus()
        }} );

        this.input_search = $( "<textarea>" )
        .css({'margin-right':'0.2em', 'height':'41px', 
            'max-height':'70px',
            'padding':'0.4em',
            'min-height':'41px', 'line-height': '14px', 
            'min-width':'10em', 'width':'100%', 'padding-right':'18px' })  //was width:sz_input, 'max-width':sz_input,  
        .addClass("text ui-widget-content ui-corner-all")
        .appendTo(  this.div_search_input );
        
        if(this._is_publication){
            this.input_search.css({'resize':'none', 'height':'30px', 'max-height':'30px', 'min-height':'30px' });    
        }
        
        // AAAA
        this._on( this.input_search, {
            click: function(){ this.input_search_prompt2.hide(); }, 
            keyup: this._showhide_input_prompt, 
            change: this._showhide_input_prompt
            });
        
        //disable because of initial search
        if(this.options.btn_visible_newrecord){
            window.hWin.HEURIST4.util.setDisabled(this.input_search, true); 
            this.input_search.css({'width':'400px','height':'1.4em','max-width':'650px'});
        }else{
            this.div_search_input.css({'width':'100%'});
        }
            
        
        //quick filter by entity
        if(this.options.menu_entity_filter){
            var div_search_help_links = $('<div>').css('padding-top','2px').appendTo(this.div_search_input);

            var link = $('<span title="Show syntax and examples of the Heurist query/filter language">'
            +'filter help <span class="ui-icon ui-icon-info" style="font-size:0.8em"></span></span>')                
            .addClass('graytext')
            .css({'text-decoration':'none','outline':0, cursor:'pointer'})
            .appendTo(div_search_help_links);
            
            this._on( link, {  click: function(){
                window.open('context_help/advanced_search.html','_blank');
            } });
        
            this.filter_by_entity_options = {select_name:'select_rectype_filter', 
                    useIcons: true, useCounts:true, useGroups:false, 
                    ancor:this.filter_by_entity, 
                    onselect: function __onSelectRectypeFilter(event, data){
                                   var selval = data.item.value;
                                   if(selval>0){
                                       that.select_rectype_filter.val(selval);
                                       that.input_search.val('t:'+selval);
                                       that._doSearch(true);
                                   }
                                   return false;
                               }};            
            
            //click on label - opens selector
            this._on( this.filter_by_entity, {  click: function(){
                    this._openSelectRectypeFilter( this.filter_by_entity_options );
                    return false;
            } });
        } 
       
        var menu_h = window.hWin.HEURIST4.util.em(1); //get current font size in em

        this.input_search.data('x', this.input_search.outerWidth());
        this.input_search.data('y', this.input_search.outerHeight());

/*AAAA*/
        this.input_search.mouseup(function () {
            var $this = $(this);
            if ($this.outerWidth() != $this.data('x') || $this.outerHeight() != $this.data('y')) {
                //alert($this.outerWidth() + ' - ' + $this.data('x') + '\n' + $this.outerHeight() + ' - ' + $this.data('y'));
                if($this.outerHeight()<25){
                    //aaa  that.div_search.css('padding-top','1.8em');
                    $this.height(23);
                }else{
                    if($this.outerHeight()> that.element.height()-menu_h-8){    //, 'max-height': (this.element.height()-12)+':px'
                        $this.height(that.element.height()-menu_h-10);
                        pt = '2px';
                    }else{
                        //parseFloat(that.div_search.css('padding-top'))
                        pt =  (that.element.height() - $this.height())/2 - menu_h;
                    }
                    //aaa that.div_search.css('padding-top', pt );
                }
            }
            // set new height/width
            $this.data('x', $this.outerWidth());
            $this.data('y', $this.outerHeight());
        }) // this.input_search.mouseup
        

        //
        // search/filter buttons - may be Search or Bookmarks according to settings and whether logged in
        //
        this.div_search_as_guest = $('<div>') //.css({'min-width':'14em'})
        .addClass('div-table-cell logged-out-only')
        .appendTo( this.div_search );

        this.btn_search_as_guest = $( "<button>")
        .appendTo( this.div_search_as_guest )
        .css({'min-height':'30px'})
        .addClass(this.options.button_class)
        .button({label: window.hWin.HR(this.options.search_button_label), iconPosition: 'end', icon:"ui-icon-search"});

        this.div_search_as_user = $('<div>') //.css({'min-width':'18em','padding-right': '10px'})
        .addClass('div-table-cell logged-in-only')
        .appendTo( this.div_search );

        this.btn_search_as_user = $( "<button>", {
            label: window.hWin.HR(this.options.search_button_label), title: "Apply the filter/search in the search field and display results in the central panel below"
        })
        .css({'min-height':'30px'})
        .appendTo( this.div_search_as_user )
        .addClass(this.options.button_class)
        .button({showLabel:true, icon:this._is_publication?'ui-icon-search':'ui-icon-filter'});
        
        if(!this._is_publication){
            this.btn_search_as_user.css({'font-size':'1.3em','min-width':'9em'})      
        }else
        if(this.options.search_button_label){
            var w = window.hWin.HEURIST4.util.px(this.options.search_button_label, this.btn_search_as_user);
            this.btn_search_as_user.css({'width': (30+w)+'px'}); 
        }
        
        this.btn_search_domain = $( "<button>", {
            label: window.hWin.HR("filter option")
        })
        .css({'font-size':'1.45em','vertical-align':'top'}) 
        .appendTo( this.div_search_as_user )
        .addClass(this.options.button_class+' heurist-bookmark-search')
        .button({icon:'ui-icon-carat-1-s',  label: window.hWin.HR("filter domain"), showLabel:false});
        //.height( this.btn_search_as_user.height() );

        //btn_search_domain is hidden this.div_search_as_user.controlgroup();

        var dset = ((this.options.search_domain_set)?this.options.search_domain_set:'a,b').split(',');//,c,r,s';
        var smenu = "";
        $.each(dset, function(index, value){
            var lbl = that._getSearchDomainLabel(value);
            if(lbl){
                smenu = smenu + '<li id="search-domain-'+value+'"><a href="#">'+window.hWin.HR(lbl)+'</a></li>'
            }
        });

        this.menu_search_domain = $('<ul>'+smenu+'</ul>')   //<a href="#">
        .css({position:'absolute', zIndex:9999})
        .appendTo( this.document.find('body') )
        .menu({
            select: function( event, ui ) {
                var mode =  ui.item.attr('id').substr(14);  //(ui.item.attr('id')=="search-domain-b")?"b":"a";
                that.option("search_domain", mode);
                that._refresh();
        }})
        .hide();

        this._on( this.btn_search_domain, {
            click: function() {
                $('.ui-menu').not('.horizontalmenu').not('.heurist-selectmenu').hide(); //hide other
                var menu = $( this.menu_search_domain )
                .css('width', '100px')     //was this.div_search_as_user.width()
                .show()
                .position({my: "right top", at: "right bottom", of: this.btn_search_domain });
                $( document ).one( "click", function() { menu.hide(); });
                return false;
            }
        });

        
        
        if(this.options.btn_visible_save){
            
            // Save search popup button
            var div_save_filter = $('<div>').addClass('div-table-cell logged-in-only')
            
            if(window.hWin.HAPI4.sysinfo['layout']=='original'){
                div_save_filter.appendTo( this.div_search );
            }else{
                div_save_filter.css({'min-width': '245px'});
                div_save_filter.insertBefore( this.div_search_header );
            }
            
            this.btn_search_save = $( "<button>", {
                label: window.hWin.HR("Save"),
                title: window.hWin.HR('Save the current filter and rules as a link in the navigation tree in the left panel')
            })
            .css({'min-width': '110px','vertical-align':'top','margin-left': '15px'})
            .addClass(this.options.button_class)
            .appendTo(div_save_filter)
            .button({icon: 'ui-icon-circle-arrow-s'});

            this._on( this.btn_search_save, {  click: function(){
                window.hWin.HAPI4.SystemMgr.verify_credentials(function(){ 
                var  app = window.hWin.HAPI4.LayoutMgr.appGetWidgetByName('svs_list');
                if(app && app.widget){
                    $(app.widget).svs_list('editSavedSearch', 'saved'); //call public method
                }
                });
            } });
        }


        // Manage structure button
        if(window.hWin.HAPI4.sysinfo['layout']=='original'){
            
        this.btn_manage_structure = $( "<button>", {
                label: window.hWin.HR("Manage Structure"),
                title: "Add new / modify existing record types - general characteristics, data fields and rules which compose a record"
            })
            .css({'width':'140px','min-width': '120px','margin-left':'3em'})
            //.addClass('logged-in-only')
            .addClass(this.options.button_class)
            .appendTo( this.div_add_record )
            .button()
            .click(function(){ 
                window.hWin.HAPI4.SystemMgr.verify_credentials(function(){ 
                    window.hWin.HEURIST4.msg.showDialog(window.HAPI4.baseURL + 'admin/structure/rectypes/manageRectypes.php?popup=1&db='+window.hWin.HAPI4.database,
                    { width:1200, height:600, title:'Manage Structure', 
                      afterclose: function(){ window.hWin.HAPI4.SystemMgr.get_defs_all( false, that.document)}} )
                });
            });
        }    
        

        this.div_buttons = $('<div>')
        .addClass('div-table-cell logged-in-only')
        .css({'text-align': 'center'}) // , 'width':'50px'
        .insertBefore( this.div_search_as_guest );
        
        /* according to new design 2016-10-05 - outdated

        // Quick search builder dropdown form
        var link = $('<button>')
        .button({icon: 'ui-icon-arrowthick-1-s', showLabel:false,
            label:'Dropdown form for building a simple filter expression',
            title:window.hWin.HR('Build a filter expression using a form-driven approach (simple and advanced options)')})
        .addClass(this.options.button_class)
        .css({'width':'40px','vertical-align': '-4px'})  //'padding':'0 1.0em',
        .appendTo(this.div_buttons);*/

        var linkGear = $('<a>',{href:'#', 
        title:window.hWin.HR('Build a filter expression using a form-driven approach (simple and advanced options)')})
        .css({'padding-right':'1.5em','display':'inline-block','margin-left':'-27px','opacity':'0.5','margin-top': '0.6em', width:'20px'})
        .addClass('ui-icon ui-icon-filter-form') //was ui-icon-gear
        .appendTo(this.div_buttons);
        this._on( linkGear, {  click: this.showSearchAssistant });
        
        /* rotate icon with given interval
        setInterval( function(){ linkGear.addClass('rotate'); 
                    setTimeout( function(){ linkGear.removeClass('rotate'); }, 1000 ) }, 5000 );
        */            

        this.search_assistant = null;

        // Info button - moved after search buttons
        this.div_buttons = $('<div>')
        .addClass('div-table-cell')
        .css({'text-align': 'center'}) // ,     ,'width': '20px'
        .appendTo( this.div_search ); //.insertBefore( this.div_search_as_guest );

        // Add record button
        if(this.options.btn_visible_newrecord){

            /* on right hand side
            this.div_add_record = $('<div>')
            .addClass('logged-in-only')
            .css({'float': 'right', 'padding': '23px 23px 0 0'})
            .appendTo( this.element );
            */
            
            this.div_add_record = $('<div>').css({'min-width':'36em','padding-left':'40px'})
            .addClass('div-table-cell logged-in-only')
            .appendTo( this.div_search );


            this.btn_add_record = $( "<button>", {
                title: "Click to select a record type and create a new record (entity) in the database"
            })
            .css({'font-size':'1.3em','min-width':'110px','max-width':'250px'})  
            //.addClass('logged-in-only')
            //.addClass(this.options.button_class)
            .appendTo( this.div_add_record )
            .button({label: window.hWin.HR("Add Record"), icon:'ui-icon-plusthick'}) //"ui-icon-circle-plus"
            .addClass('truncate')
            .click( function(){ 
                window.hWin.HAPI4.SystemMgr.verify_credentials(function(){
                    if(that.select_rectype_addrec.val()>0){
                        window.hWin.HEURIST4.ui.openRecordEdit(-1, null, 
                            {new_record_params:{RecTypeID:that.select_rectype_addrec.val()}});
                    }else{
                        that.btn_select_rt.click();
                    }
                }); 
            });

            this.btn_select_rt = $( "<button>")
            .css({'font-size':'1.3em'})
            .appendTo( this.div_add_record )
            //.addClass(this.options.button_class+' heurist-bookmark-search')
            .button({label:window.hWin.HR("Select record type"), icon: "ui-icon-carat-1-s", showLabel:false});
            
            this.btn_add_record_dialog = $( "<button>")
            .css({'font-size':'0.8em'})
            .appendTo( this.div_add_record )
            .button({label: '<div style="text-align:left;display:inline-block">'
                            +window.hWin.HR('Define Parameters') +'<br>'+window.hWin.HR('Add Record')+'</div>', 
                     icon: "ui-icon-carat-1-s", iconPosition:'end',
                     title:'Click to define parameters and add new record'})
            .click( function(){ 
                    window.hWin.HEURIST4.ui.showRecordActionDialog('recordAdd');            
            });
            
            this.btn_add_record_dialog.find('.ui-button-icon').css('vertical-align','baseline');

            this.btn_select_owner = $( "<button>")
            .css({'font-size':'0.8em'})
            .appendTo( this.div_add_record )
            .button({label:'owner', icon: "ui-icon-carat-1-s", iconPosition:'end',
                     title:'Ownership and access rights for new record'}).hide();
            //.addClass('truncate');
            this.btn_select_owner.find('.ui-button-icon').css('vertical-align','baseline');
            
/*
            this.btn_lookup_TEMP = $( "<button>")
            .css({'font-size':'0.8em'})
            .appendTo( this.div_add_record )
            .button({label: 'lookup'})
            .click( function(){ 
                    window.hWin.HEURIST4.ui.showRecordActionDialog('recordLookup');            
            });
*/            
            
            /*
            this.select_rectype_addrec = $('<select>')   
                .attr('size',20)
                .addClass('text ui-corner-all ui-widget-content select_rectype_addrec') 
                .css({'position':'absolute','min-width':'250'})
                .appendTo( $('body') ) 
                .hide();
                */
                
            this._on( this.btn_select_rt, {
                click:  function(){
            
                this.select_rectype_addrec.hSelect('open');
                this.select_rectype_addrec.hSelect('menuWidget')
                    .position({my: "left top", at: "left bottom", of: this.btn_add_record });
                return false;
                    
            }});

            var that = this;
            this._on( this.btn_select_owner, {
                click:  function(){
                    
                    var btn_select_owner = this.btn_select_owner;
                    
                    var add_rec_prefs = window.hWin.HAPI4.get_prefs('record-add-defaults');
                    if(!$.isArray(add_rec_prefs) || add_rec_prefs.length<4){
                        add_rec_prefs = [0, 0, 'viewable', '']; //rt, owner, access, tags  (default to Everyone)
                    }
                    if(add_rec_prefs.length<5){ //visibility groups
                        add_rec_prefs.push('');
                    }
                        
                    //show dialog that changes ownership and view access                   
                    window.hWin.HEURIST4.ui.showRecordActionDialog('recordAccess', {
                           currentOwner:  add_rec_prefs[1],
                           currentAccess: add_rec_prefs[2],
                           currentAccessGroups: add_rec_prefs[4],
                           scope_types: 'none',
                           height:400, 
                           title: window.hWin.HR('Default ownership and access for new record'),
                           onClose:                         
                           function(context){

                            if(context && context.NonOwnerVisibility && 
                                (context.NonOwnerVisibility!=add_rec_prefs[2] || 
                                 context.OwnerUGrpID!=add_rec_prefs[1] ||
                                 context.NonOwnerVisibilityGroups!=add_rec_prefs[4])){
                                
                                add_rec_prefs[1] = context.OwnerUGrpID;  
                                add_rec_prefs[2] = context.NonOwnerVisibility;  
                                add_rec_prefs[4] = context.NonOwnerVisibilityGroups;  
                                
                                that.setOwnerAccessButtonLabel( add_rec_prefs );
                                
                                window.hWin.HAPI4.save_pref('record-add-defaults', add_rec_prefs);
                                window.hWin.HAPI4.triggerEvent(window.hWin.HAPI4.Event.ON_PREFERENCES_CHANGE, {origin:'search'});
                            }
                    
                        }});
                
                return false;
                    
            }});
            
            this.div_add_record.controlgroup();
            
        } // add record button
        
        
        


        // bind click events
        this._on( this.btn_search_as_user, {
            click:  function(){
                //that.option("search_domain", "a");
                that._doSearch(true);}
        });

        this._on( this.btn_search_as_guest, {
            click: function(){
                that.option("search_domain", "a");
                that._doSearch(true);
            }
        });
        
/* AAAA */        
        this._on( this.input_search, {
            keypress: function(e){
                var code = (e.keyCode ? e.keyCode : e.which);
                if (code == 13) {
                    window.hWin.HEURIST4.util.stopEvent(e);
                    e.preventDefault();
                    that._doSearch(true);
                }
            }
        });

        //-----------------------

        //global listeners
        $(window.hWin.document).on(
            window.hWin.HAPI4.Event.ON_CREDENTIALS+' '
                +window.hWin.HAPI4.Event.ON_PREFERENCES_CHANGE, function(e, data) {
                    
            if(e.type == window.hWin.HAPI4.Event.ON_PREFERENCES_CHANGE){
                //@todo update btn_select_owner label
            }
            if(!data || data.origin!='search'){
                that._refresh();
            }
        });
        $(window.hWin.document).on(
            window.hWin.HAPI4.Event.ON_REC_SEARCHSTART
            + ' ' + window.hWin.HAPI4.Event.ON_REC_SEARCH_FINISH
            + ' ' + window.hWin.HAPI4.Event.ON_REC_UPDATE
            + ' ' + window.hWin.HAPI4.Event.ON_STRUCTURE_CHANGE, 
            function(e, data) { that._onSearchGlobalListener(e, data) } );
            
            
        this.div_search.find('.div-table-cell').css('vertical-align','top');

        this._recreateRectypeSelectors();
        
        this._refresh();

    }, //end _create
             
    //
    //
    //
    _redraw_buttons_by_entity: function(is_init){
        
        if(is_init===true){
            //get from preferences
            this.buttons_by_entity = window.hWin.HAPI4.get_prefs_def('entity_filter_btns','');
            
            if(window.hWin.HEURIST4.util.isempty(this.buttons_by_entity)){
                this.buttons_by_entity = [];
                
                if(true){
                    //get 5 from first group
                    var rectypes = window.hWin.HEURIST4.rectypes.groups[0].allTypes;
                    for(var m=0; m<rectypes.length && m<5; m++){
                        this.buttons_by_entity.push(rectypes[m]);
                    }
                }else{
                    //get 5 top most used rectypes
                    var sorted = [];
                    for(var rty_ID in window.hWin.HEURIST4.rectypes.counts)
                    if(rty_ID>0){
                        sorted.push({'id':rty_ID, 'cnt':window.hWin.HEURIST4.rectypes.counts[rty_ID]});
                    }
                    sorted.sort(function(a,b){
                         return Number(a['cnt'])<Number(b['cnt'])?1:-1;
                    });
                    for(var idx=0; idx<sorted.length && idx<5; idx++){
                        this.buttons_by_entity.push(sorted[idx]['id']);    
                    }
                }
            }else{
                this.buttons_by_entity = this.buttons_by_entity.split(',');    
            }
            
            
            
        }
        
        
        this._off( this.div_entity_btns.find('.entity-filter-button'), 'click');
        
        this.div_entity_btns.find('.entity-filter-button').remove();
        
        var idx=this.buttons_by_entity.length-1;
        while(idx>=0){
            
            var rty_ID = this.buttons_by_entity[idx];
            
            if(rty_ID>0 && window.hWin.HEURIST4.rectypes.names[rty_ID]) {           
            
                var btn = $('<div>').button({label:
                '<img src="'+window.hWin.HAPI4.iconBaseURL + rty_ID + '.png" height="12">'
                +'<span class="truncate" style="max-width:100px;display:inline-block;margin-left:8px">'
                        + window.hWin.HEURIST4.rectypes.names[rty_ID] + '</span>'
                        + '<span style="float:right;padding:2px;font-size:0.8em;">['   
                        +  ((window.hWin.HEURIST4.rectypes.counts[rty_ID]>0)?window.hWin.HEURIST4.rectypes.counts[rty_ID]:0)
                        +']</span>'}) 
                    .attr('data-id', rty_ID)
                    .css({'margin-left':'6px','font-size':'0.9em'})        
                    .addClass('entity-filter-button')  // ui-state-active
                    .insertAfter(this.btns_by_entity.parent()); //appendTo(this.div_entity_btns);
                
                this._on( btn, {  click: function(e){
                       var selval = $(e.target).hasClass('entity-filter-button')
                                ?$(e.target):$(e.target).parent('.entity-filter-button');
                       selval = selval.attr('data-id');
                       if(selval>0){
                           this.select_rectype_filter.val(selval);
                           this.input_search.val('t:'+selval);
                           this._doSearch(true);
                       }
                } });
            
            }else{
                //remove wrong(removed) rectypes
                is_init = false;
                this.buttons_by_entity.splice(idx,1);
            }
            idx--;
            
        }//for
        
        var that = this;
        this.div_entity_btns.sortable({
            //containment: 'parent',
            items: '.entity-filter-button',
            cursor: 'move',
            handle:'img',
            delay: 250,
            axis: 'x',
            stop:function(){
                that.buttons_by_entity = [];
                $.each(that.div_entity_btns.find('.entity-filter-button'),function(idx, item){
                  that.buttons_by_entity.push( $(item).attr('data-id') );
                })
                window.hWin.HAPI4.save_pref('entity_filter_btns', that.buttons_by_entity.join(','));
            }}
        );
        
        if(is_init!==true){
            //save in user preferences
            window.hWin.HAPI4.save_pref('entity_filter_btns', this.buttons_by_entity.join(','));
        }
            
    },

    
   //
   // set label for default ownership/access button
   //   
   setOwnerAccessButtonLabel: function( add_rec_prefs ){
       
        var that = this;
       
        window.hWin.HAPI4.SystemMgr.usr_names({UGrpID:add_rec_prefs[1]},
            function(response){
                if(response.status == window.hWin.ResponseStatus.OK){
                    var ownership = [], title = [], cnt = 0;
                    for(var ugr_id in response.data){
                        if(cnt<1){
                            ownership = response.data[ugr_id];    
                        }
                        title.push(response.data[ugr_id]);
                        cnt++;
                    }
                    if(cnt>1){
                       ownership = cnt + ' groups'; 
                       title = 'Default owners: '+title.join(', ')+'. ';
                    }else{
                       title = '';
                    }
                    
                    var access = {hidden:'Owner only', viewable:'Logged-in', pending:'Public pending', public:'Public'};
                    if(add_rec_prefs[4]){
                        access = 'Groups';
                        title = title + 'Viewable for '+(add_rec_prefs[4].split(',').length)+' groups';
                    }else{
                        access = access[add_rec_prefs[2]];
                    }
                    
                    that.btn_select_owner.button({'label':
                        '<div style="text-align:left;display:inline-block" title="'+title+'">'
                        +ownership+'<br>'+access+'</div>'});
                }
        });
        
   },
    
    
    _showhide_input_prompt:function() {
                if(this.input_search.val()==''){
                    this.input_search_prompt.show();    
                    this.input_search_prompt2.hide();    
                }else{
                    this.input_search_prompt.hide();     
                }
    },

    /* EXPERIMENTAL
    _initPagination: function(){
    this.div_paginator = $('<span>')
    .css('display', 'inline-block')
    .appendTo( this.div_search )
    .pagination();
    },
    */

    _setOption: function( key, value ) {
        this._super( key, value );

        if(key=='search_domain'){
            this._refresh();
        }
    },

    /* private function */
    _refresh: function(){

        if(window.hWin.HAPI4.has_access()){
            $(this.element).find('.logged-in-only').show();
            //$(this.element).find('.logged-in-only').css('visibility','visible');
            //$(this.element).find('.logged-out-only').css('visibility','hidden');
            $(this.element).find('.logged-out-only').hide();
        }else{
            $(this.element).find('.logged-in-only').hide();
            //$(this.element).find('.logged-in-only').css('visibility','hidden');
            //$(this.element).find('.logged-out-only').css('visibility','visible');
            $(this.element).find('.logged-out-only').show();

            if(this.options.isloginforced){
                this._doLogin();
            }
        }

//ART        $(this.element).find('.div-table-cell').height( $(this.element).height() );

        this.btn_search_as_user.button( "option", "label", window.hWin.HR(this._getSearchDomainLabel(this.options.search_domain)));

        this.btn_search_domain.css('display', (window.hWin.HAPI4.get_prefs('bookmarks_on')=='1')?'inline-block':'none');

        if(this.options.btn_visible_newrecord){

            if(!this.select_rectype_addrec){ //add record selector

                this.select_rectype_addrec = window.hWin.HEURIST4.ui.createRectypeSelect();
                if(this.select_rectype_addrec.hSelect("instance")!=undefined){
                    this.select_rectype_addrec.hSelect( "menuWidget" ).css({'max-height':'450px'});                        
                }

                var that = this;
                this.select_rectype_addrec.hSelect({change: function(event, data){

                    var selval = data.item.value;
                    that.select_rectype_addrec.val(selval);
                    var opt = that.select_rectype_addrec.find('option[value="'+selval+'"]');
                    that.btn_add_record.button({label: 'Add '+opt.text().trim()});

                    var prefs = window.hWin.HAPI4.get_prefs('record-add-defaults');
                    if(!$.isArray(prefs) || prefs.length<4){
                        prefs = [selval, 0, 'viewable', '']; //default to everyone   window.hWin.HAPI4.currentUser['ugr_ID']
                    }else{
                        prefs[0] = selval; 
                    }
                    window.hWin.HAPI4.save_pref('record-add-defaults', prefs);

                    window.hWin.HAPI4.triggerEvent(window.hWin.HAPI4.Event.ON_PREFERENCES_CHANGE, {origin:'search'});

                    window.hWin.HEURIST4.ui.openRecordEdit(-1, null, {new_record_params:{RecTypeID:selval}});
                    return false;
                    }
                });
                this.select_rectype_addrec.hSelect('hideOnMouseLeave', this.btn_select_rt);

            }

            var add_rec_prefs = window.hWin.HAPI4.get_prefs('record-add-defaults');
            if(!$.isArray(add_rec_prefs) || add_rec_prefs.length<4){
                add_rec_prefs = [0, 0, 'viewable', '']; //rt, owner, access, tags  (default to Everyone)
            }
            if(add_rec_prefs.length<4){
                add_rec_prefs.push(''); //visibility groups
            }

            if(add_rec_prefs[0]>0) {
                this.select_rectype_addrec.val(add_rec_prefs[0]); 
                var opt = this.select_rectype_addrec.find('option[value="'+add_rec_prefs[0]+'"]');
                this.btn_add_record.button({label: 'Add '+opt.text()});
            }

            this.setOwnerAccessButtonLabel( add_rec_prefs );

        }
        
        this._showhide_input_prompt();
    },

    //
    // creates selectors menu_entity_filter, btn_entity_filter
    //
    _recreateSelectRectypeFilter: function(opts){
            var that = this;

            var exp_level = window.hWin.HAPI4.get_prefs_def('userCompetencyLevel', 2);
            
            var select_rectype = opts['select_name'];
            
            opts.useIds = (exp_level<2);
            
            this[select_rectype] = window.hWin.HEURIST4.ui.createRectypeSelectNew(null, opts);
                        
            if(this[select_rectype].hSelect("instance")!=undefined){
                var menu = this[select_rectype].hSelect( "menuWidget" );
                menu.css({'max-height':'450px'});                        
            }
            
            
            this[select_rectype].hSelect({change: opts.onselect});
            this[select_rectype].hSelect('hideOnMouseLeave', opts.ancor);
    },
    

    //
    // recreate rectype selectors and filter button set
    //
    _recreateRectypeSelectors: function(){

        var that = this;
        
        window.hWin.HEURIST4.rectypes.counts_update = (new Date()).getTime();
                    
        var request = {
                'a'       : 'counts',
                'entity'  : 'defRecTypes',
                'mode'    : 'record_count',
                'ugr_ID'  : window.hWin.HAPI4.user_id()
                };
                             
        window.hWin.HAPI4.EntityMgr.doRequest(request, 
            function(response){

                if(response.status == window.hWin.ResponseStatus.OK){
    
                    window.hWin.HEURIST4.rectypes.counts = response.data;
                    
                    if(that.options.menu_entity_filter){ //selector to filter by entity
                            that._recreateSelectRectypeFilter(that.filter_by_entity_options);
                    }
                        
                    //buttons - filter by entity
                    if(that.options.btn_entity_filter){
                        that._redraw_buttons_by_entity(true);
                        that.btns_by_entity_options.marked = that.buttons_by_entity;
                        
                        that._recreateSelectRectypeFilter(that.btns_by_entity_options);
                    }
        
                }else{
                    window.hWin.HEURIST4.msg.showMsgErr(response);
                    window.hWin.HEURIST4.rectypes.counts_update = 0;
                }
        });
        
    },


    //
    //
    //
    _openSelectRectypeFilter: function( opts ){
        
                var select_rectype = opts['select_name'];
        
                var that = this;
                function __openSelect(){
                    
                    that[select_rectype].hSelect('open');
                    that[select_rectype].val(-1);
                    that[select_rectype].hSelect('menuWidget')
                        .position({my: "left top", at: "left+10 bottom-4", of: opts['ancor']});
            
                    var menu = $(that[select_rectype].hSelect('menuWidget'));
                    var ele = $(menu[0]);
                    ele.scrollTop(0);        
                   
                    if(opts.useCheckboxes && $.isFunction(opts.onmarker)){
                        var spans = menu.find('span.rt-checkbox');
                        that._off(spans,'click');
                        that._on(spans,{'click':function(e){
                            if($(event.target).is('span')){
                                opts.onmarker.call(that, $(event.target) );
                                window.hWin.HEURIST4.util.stopEvent(e);
                            }}});
                        /*
                        menu.find('span.rt-checkbox').click(function(e){
                            if($(event.target).is('span')){
                                opts.onmarker.call(that, $(event.target) );
                                window.hWin.HEURIST4.util.stopEvent(e);
                            }
                        });
                        */
                    }
                    
                }
                
                if(this[select_rectype]){
                    __openSelect();
                }
                    

                /*            
                if(!window.hWin.HEURIST4.rectypes.counts ||
                    (new Date()).getTime() - window.hWin.HEURIST4.rectypes.counts_update > 30000)  //30 seconds
                {

                }else{
                    if(!this[select_rectype]){
                        this._recreateSelectRectypeFilter();
                    }
                    
                    __openSelect();
                } 
                */   
    },
        



    _showAdvancedAssistant: function(){
        //call Heurist vsn 3 search builder
        var q = "",
        that = this;
        if(this.input_search.val()!='') {
            q ="&q=" + encodeURIComponent(this.input_search.val());
        }else if(!Hul.isnull(this.query_request) && !Hul.isempty(this.query_request.q)){
            q ="&q=" + encodeURIComponent(this.query_request.q);
        }

        var url = window.hWin.HAPI4.baseURL+ "hclient/widgets/search/queryBuilderPopup.php?db=" 
                            + window.hWin.HAPI4.database + q;

        window.hWin.HEURIST4.msg.showDialog(url, { width:740, height:540, title:'Advanced Search Builder', callback:
            function(res){
                if(!Hul.isempty(res)) {
                    that.input_search.val(res);
                    that.input_search.change();
                    that._doSearch(true);
                }
        }});
    },

    //
    //
    //
    _isSameRealm: function(data){
        return !this.options.search_realm || (data && this.options.search_realm==data.search_realm);
    },
    

    _onSearchGlobalListener: function(e, data){

        var that = this;

        if(e.type == window.hWin.HAPI4.Event.ON_REC_SEARCHSTART)
        {

            //accept events from the same realm only
            if(!that._isSameRealm(data)) return;
            
            //data is search query request
            if(data.reset){
                that.input_search.val('');
                that.input_search.change();
            }else            
            //topids not defined - this is not rules request
            if(window.hWin.HEURIST4.util.isempty(data.topids) && data.apply_rules!==true){

                //request is from some other widget (outside)
                if(data.source!=that.element.attr('id')){
                    var qs;
                    if($.isArray(data.q)){
                        qs = JSON.stringify(data.q);
                    }else{
                        qs = data.q;
                    }

                    if(!window.hWin.HEURIST4.util.isempty(qs)){
                        
                        if(qs.length<10000){
                            that.input_search.val(qs);
                            that.options.search_domain = data.w;
                            that.query_request = data;
                            that._refresh();
                        }
                        if( true || window.hWin.HEURIST4.util.isJSON(data.q) || qs.length>100 ){
                            that.input_search_prompt2.css({width:(that.input_search.width()-30),
                                height:(that.input_search.height()-10)}).show();
                        }
                    }
                }

                var is_keep = window.hWin.HAPI4.get_prefs('searchQueryInBrowser');
                is_keep = (is_keep==1 || is_keep==true || is_keep=='true');
                
                if(is_keep && !this.options.search_realm){
                    var qs = window.hWin.HEURIST4.util.composeHeuristQueryFromRequest(data, true);
                    if(qs && qs.length<2000){
                        var s = location.pathname;
                        while (s.substring(0, 2) === '//') s = s.substring(1);
                        
                        window.history.pushState("object or string", "Title", s+'?'+qs );
                    }
                }
                
                that.input_search.change();

            }
            

            //ART that.div_search.css('display','none');
        }else if(e.type == window.hWin.HAPI4.Event.ON_REC_SEARCH_FINISH){ //search completed

            //accept events from the same realm only
            if(!that._isSameRealm(data)) return;
        
            window.hWin.HEURIST4.util.setDisabled(this.input_search, false);
            
            if(this.input_search.is(':visible')) {
                try{
                    this.input_search.focus();
                }catch(e){}
            }
            
            //show if there is resulst
            if(this.btn_search_save){
                if(window.hWin.HAPI4.currentRecordset && window.hWin.HAPI4.currentRecordset.length()>0) //
                {
                    this.btn_search_save.show();
                }else{
                    this.btn_search_save.hide();
                }
            }

        }else if(e.type == window.hWin.HAPI4.Event.ON_REC_UPDATE){ //record added/removed
            
            //recreate selectors
            this._recreateRectypeSelectors();
            
        }else if(e.type == window.hWin.HAPI4.Event.ON_STRUCTURE_CHANGE){

            if(this.search_assistant!=null){
                if(this.search_assistant_popup!=null && this.search_assistant_popup.dialog('instance')){
                    this.search_assistant_popup.dialog('close');
                    this.search_assistant_popup = null;
                }
                //this.search_assistant.dialog('destroy');
                this.search_assistant.remove();
                this.search_assistant = null;

            }
            //force recreate rectype selectors
            if(this.select_rectype_addrec!=null){
                this.select_rectype_addrec.remove();
                this.select_rectype_addrec = null;
                this._refresh();
            }

            this._recreateRectypeSelectors();
        }



    },


    /*
    _handleKeyPress: function(e){
    var code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) {
    this._doSearch();
    }
    },
    */
    _getSearchDomainLabel: function(value){
        var lbl = null;
        if(value=='b' || value=='bookmark') { lbl = 'Bookmarks'; }
        else if(value=='r') { lbl = 'recently added'; } //not implemented
            else if(value=='s') { lbl = 'recently selected'; } //not implemented
                else if(value=='c') { lbl = 'Search (in current)'; } //todo
                    else { lbl = this.options.search_button_label; this.options.search_domain='a';}
        return lbl;
    },

    //
    // search from input - query is defined manually
    //
    _doSearch: function(fl_btn){

        var qsearch;
        if(!fl_btn){

            var select_rectype = this.search_assistant.find(".sa_rectype");
            var select_fieldtype = this.search_assistant.find(".sa_fieldtype");
            var select_fieldvalue = this.search_assistant.find(".sa_fieldvalue");
            var select_sortby = this.search_assistant.find(".sa_sortby");
            var select_terms = this.search_assistant.find(".sa_termvalue");
            var select_coord1 = this.search_assistant.find(".sa_coord1");
            var select_coord2 = this.search_assistant.find(".sa_coord2");
            var sortasc =  this.search_assistant.find('.sa_sortasc');

            if( (select_rectype && select_rectype.val()) || 
                (select_fieldtype && select_fieldtype.val()) || 
                (select_fieldvalue && select_fieldvalue.val())){
               
                this.calcShowSimpleSearch();
                qsearch = this.input_search.val();
            }
                
        }else{
            qsearch = this.input_search.val();
        }


        qsearch = qsearch.replace(/,\s*$/, "");




        if ( qsearch ) {

            // q - query string
            // w  all|bookmark
            // stype  key|all   - key-search tags, all-title and pointer record title, by default rec_Title

            var that = this;

            /* concatemation with previos search  -- NOT USED
            if(this.options.search_domain=="c" && !window.hWin.HEURIST4.util.isnull(this.query_request)){ 
                this.options.search_domain = this.query_request.w;
                qsearch = this.query_request.q + ' AND ' + qsearch;
            }
            */
            
            window.hWin.HAPI4.SystemMgr.user_log('search_Record_direct');
            
            var request = window.hWin.HEURIST4.util.parseHeuristQuery(qsearch);

            request.w  = this.options.search_domain;
            request.detail = 'detail';
            request.source = this.element.attr('id');
            request.search_realm = this.options.search_realm;
            
            this.query_request = request;

            window.hWin.HAPI4.SearchMgr.doSearch( this, request );

        }

    }



    /**
    *  public method
    *
    * @returns {Boolean}
    */
    , showSearchAssistant: function() {
        
        var that = this;

        if(!this.search_assistant){ //not loadaed yet
        
            //load template
            this.search_assistant = $( "<div>" )
                .addClass('text ui-corner-all ui-widget-content ui-heurist-bg-light heurist-quick-search')  // menu-or-popup
                //.css({position:'absolute', zIndex:9999})
                .appendTo( this.element ) //document.find('body')
                .hide()
                .load(window.hWin.HAPI4.baseURL+"hclient/widgets/search/search_quick.html?t="+(new Date().getTime()), 
                function(){ that.showSearchAssistant(); } );
            return;
        }


        $('.ui-menu').not('.horizontalmenu').not('.heurist-selectmenu').hide(); //hide other
        $('.menu-or-popup').hide(); //hide other

            //var popup = $( this.search_assistant );
            var inpt = $(this.input_search).offset();
            //AAAA TEMP!!!!! popup.css({'left': inpt.left, 'top':inpt.top+$(this.input_search).height()+3 });
           
            //popup.position({my: "left top+3", at: "left bottom", of: this.input_search })
                
            //TEMP!!!!! popup.show("blind", {}, 500 );
            //popup.dialog({autoOpen:true});
            this.search_assistant_popup = window.hWin.HEURIST4.msg.showElementAsDialog({
                element: this.search_assistant[0],
                //opener: 
                width:420, height:270,
                modal: false,
                resizable: false,
                borderless: true,
                open: function(){
                    that._initSearchAssistant();    
                    
                    // assign value to rectype selector if previous search was by rectypes
                    if(that.query_request){
                        var q = that.query_request.q, rt = 0;
                        if ($.isPlainObject(q) && Object.keys(q).length==1 && !q['t']){
                            rt = q['t'];
                        }else if (q.indexOf('t:')==0){
                              q = q.split(':');
                              if(window.hWin.HEURIST4.util.isNumber(q[1])){
                                  rt = q[1];
                              }
                        }
                        if(rt>0 && window.hWin.HEURIST4.rectypes.names[rt]){
                            var sel = that.search_assistant.find(".sa_rectype");
                            sel.val(rt);
                            if(sel.hSelect("instance")!=undefined){
                                sel.hSelect("refresh"); 
                            }
                        }
                    }
                    
                }
            });


            //hide popupo in case click outside
            function _hidethispopup(event) {
                var popup = that.search_assistant_popup;
                if($(event.target).closest(popup).length==0 && $(event.target).attr('id')!='menu-search-quick-link'){
                    //TEMP!!!!! popup.hide( "blind", {}, 500 );
                    if(that.search_assistant_popup && that.search_assistant_popup.dialog('instance'))
                        that.search_assistant_popup.dialog('close');
                }else{
                    //TEMP!!!!! 
                    $( document ).one( "click", _hidethispopup);
                    //return false;
                }
            }

            //TEMP!!!!! 
            $( document ).one( "click", _hidethispopup);//hide itself on click outside

            
        

        return false;
    }

    //
    // init must be after dialog open, otherwise hSelect will be below
    //
    , _initSearchAssistant: function(){

        var $dlg = this.search_assistant;
        
        if($dlg.find('.quick-search-close').length>0){
            //already inited  
            
            //reinit all selectors as hSelect - to assign them to dialog (to be visible ontop)
            window.hWin.HEURIST4.ui.initHSelect($dlg.find(".sa_rectype"), false);            
            window.hWin.HEURIST4.ui.initHSelect($dlg.find(".sa_fieldtype"), false);            
            window.hWin.HEURIST4.ui.initHSelect($dlg.find(".sa_sortby"), false);            
            window.hWin.HEURIST4.ui.initHSelect($dlg.find(".sa_termvalue"), false);            
            
            return; 
        } 

        var that = this;


        var search_quick_close = $( "<button>", {
            label: window.hWin.HR("close")
        })
        .appendTo( $dlg )
        .addClass(this.options.button_class+' quick-search-close')
        .css({position:'absolute', zIndex:9999, 'right':4, top:4, width:16, height:16, 'font-size':'0.8em'})
        .button({icon: "ui-icon-triangle-1-n", showLabel:false});
        that._on( search_quick_close, {
            click: function(event){
                //$(document).off('keypress');
                //TEMP!!! $dlg.hide( "blind", {}, 500 );
                that.search_assistant_popup.dialog('close');
            }
        });


        var dv = $dlg.find('.btns')
        dv.css({'display':'block !important'});

        var link = $('<a>',{
            text: 'Advanced Search Builder', href:'#'
        })
        .css('font-size','1em')
        .appendTo( dv );
        that._on( link, {  click: function(event){
                //TEMP!!! $dlg.hide( "blind", {}, 500 );
                that.search_assistant_popup.dialog('close');
                //$(document).off('keypress');
                that._showAdvancedAssistant();
        } });


        var search_quick_go = $( "<button>")
        .appendTo( dv )
        .addClass(this.options.button_class)
        //.css({position:'absolute', zIndex:9999, 'right':4, top:4, width:18, height:18})
        .css('float', 'right')
        .button({
            label: window.hWin.HR("Go"), showLabel:true
        });
        that._on( search_quick_go, {
            click: function(event){
                //TEMP!!! $dlg.hide( "blind", {}, 500 );
                that.search_assistant_popup.dialog('close');
                that._doSearch();
            }
        });

        //find all labels and apply localization
        $dlg.find('label').each(function(){
            $(this).html(window.hWin.HR($(this).html()));
        });

        var select_rectype = $dlg.find(".sa_rectype").uniqueId();
        var select_fieldtype = $dlg.find(".sa_fieldtype");
        var select_sortby = $dlg.find(".sa_sortby");
        var select_terms = $dlg.find(".sa_termvalue");
        var sortasc =  $dlg.find('.sa_sortasc');
        $dlg.find(".fld_enum").hide();
        
        var exp_level = window.hWin.HAPI4.get_prefs_def('userCompetencyLevel', 2);

        select_rectype = window.hWin.HEURIST4.ui.createRectypeSelectNew(select_rectype.get(0), 
                    {useIcons: false, useCounts:true, useGroups:true, useIds: (exp_level<2), 
                        topOptions:window.hWin.HR('Any record type'), useHtmlSelect:false});

        var allowed = Object.keys(window.hWin.HEURIST4.detailtypes.lookups);
        allowed.splice(allowed.indexOf("separator"),1);
        allowed.splice(allowed.indexOf("geo"),1);
        allowed.splice(allowed.indexOf("relmarker"),1);

        function __startSearchOnEnterPress(e){
                var code = (e.keyCode ? e.keyCode : e.which);
                if (code == 13) {
                    window.hWin.HEURIST4.util.stopEvent(e);
                    e.preventDefault();
                    //TEMP!!! $dlg.hide( "blind", {}, 500 );
                    that.search_assistant_popup.dialog('close');
                    that._doSearch();
                }
        }
        
        that._on( $dlg.find('.text'), { keypress: __startSearchOnEnterPress});
        
        //change list of field types on rectype change
        that._on( select_rectype, {
            change: function (event){

                var rectype = (event)?Number(event.target.value):0;
                
                var topOptions2 = 'Any field type';
                var bottomOptions = null;

                if(!(rectype>0)){
                    //topOptions2 = [{key:'',title:window.hWin.HR('Any field type')}];
                    bottomOptions = [{key:'latitude',title:window.hWin.HR('geo: Latitude')},
                                     {key:'longitude',title:window.hWin.HR('geo: Longitude')}]; 
                }
                var exp_level = window.hWin.HAPI4.get_prefs_def('userCompetencyLevel', 2);
                
                select_fieldtype = window.hWin.HEURIST4.ui.createRectypeDetailSelect(
                        that.search_assistant.find(".sa_fieldtype").get(0), 
                            rectype, allowed, topOptions2, 
                            {show_parent_rt:true, show_latlong:true, bottom_options:bottomOptions, 
                                useIds: (exp_level<2), useHtmlSelect:false});

                var topOptions = [{key:'t', title:window.hWin.HR("record title")},
                    {key:'id', title:window.hWin.HR("record id")},
                    {key:'rt', title:window.hWin.HR("record type")},
                    {key:'u', title:window.hWin.HR("record URL")},
                    {key:'m', title:window.hWin.HR("date modified")},
                    {key:'a', title:window.hWin.HR("date added")},
                    {key:'r', title:window.hWin.HR("personal rating")},
                    {key:'p', title:window.hWin.HR("popularity")}];

                if(Number(rectype)>0){
                    topOptions.push({optgroup:'yes', title:window.hWin.HEURIST4.rectypes.names[rectype]+' '+window.hWin.HR('fields')});
                    /*
                    var grp = document.createElement("optgroup");
                    grp.label =  window.hWin.HEURIST4.rectypes.names[rectype]+' '+window.hWin.HR('fields');
                    select_sortby.get(0).appendChild(grp);
                    */
                }
                select_sortby = window.hWin.HEURIST4.ui.createRectypeDetailSelect(
                        that.search_assistant.find(".sa_sortby").get(0), rectype, allowed, topOptions,
                            {initial_indent:1, useHtmlSelect:false});
                            
                            
                that._on( select_fieldtype, {
                    change: __onFieldTypeChange
                });
                that._on( select_sortby, {
                    change: function(event){ 
                        this.calcShowSimpleSearch(); 
                        search_quick_go.focus();
                    }
                });
                            
                $dlg.find(".sa_fieldvalue").val("");
                $dlg.find(".sa_negate").prop("checked",'');
                $dlg.find(".sa_negate2").prop("checked",'');
                
                $dlg.find(".fld_contain").show();
                $dlg.find(".fld_enum").hide();
                $dlg.find(".fld_coord").hide();
                this.calcShowSimpleSearch();
                //AAAA 
                search_quick_go.focus();
            }
        });
        
        //change compare option according to selected field type
        // enum, geocoord, others
        function __onFieldTypeChange(event){

                if(event.target.value=='longitude' || event.target.value=='latitude'){

                    $dlg.find(".fld_contain").hide();
                    $dlg.find(".fld_enum").hide();
                    $dlg.find(".fld_coord").show();
                    
                }else{
                    var dtID = Number(event.target.value);
                    
                    $dlg.find(".fld_coord").hide();
                
                    var detailtypes = window.hWin.HEURIST4.detailtypes.typedefs;
                    var detailType = '';

                    if(Number(dtID)>0){
                        detailType = detailtypes[dtID].commonFields[detailtypes.fieldNamesToIndex['dty_Type']];
                    }
                    if(detailType=='enum'  || detailType=='relationtype'){
                        $dlg.find(".fld_contain").hide();
                        $dlg.find(".fld_enum").show();
                        //fill terms
                        var allTerms = detailtypes[dtID]['commonFields'][detailtypes['fieldNamesToIndex']['dty_JsonTermIDTree']],
                        disabledTerms = detailtypes[dtID]['commonFields'][detailtypes['fieldNamesToIndex']['dty_TermIDTreeNonSelectableIDs']];

                        var select_terms = $dlg.find(".sa_termvalue");

                        window.hWin.HEURIST4.ui.createTermSelectExt2(select_terms.get(0),
                        {datatype:detailType, termIDTree:allTerms, headerTermIDsList:disabledTerms, defaultTermID:null,
                            useIds: true, 
                            topOptions:[{ key:'any', title:window.hWin.HR('<any>')},{ key:'blank', title:'  '}], //window.hWin.HR('<blank>')
                            needArray:false, useHtmlSelect:false});
                                             
                        that._on( select_terms, { change: function(event){
                                this.calcShowSimpleSearch();
                            }
                        } );
                                                                                                 
                    } else {
                        $dlg.find(".fld_contain").show();
                        $dlg.find(".fld_enum").hide();
                    }
                    
                }

                this.calcShowSimpleSearch();
                //AAAA
                search_quick_go.focus();
        }//__onFieldTypeChange
            
        that._on( select_fieldtype, {
            change: __onFieldTypeChange
        });
        that._on( select_terms, { change: function(event){
                this.calcShowSimpleSearch();
                //AAAA
                search_quick_go.focus();
            }
        } );
        that._on( select_sortby, { change: function(event){
                this.calcShowSimpleSearch();
                //AAAA
                search_quick_go.focus();
            }
        } );
        that._on( that.search_assistant.find(".sa_fieldvalue"), {
            keyup: function(event){
                this.calcShowSimpleSearch();
            }
        });
        that._on( that.search_assistant.find(".sa_negate"), {
            change: function(event){
                this.calcShowSimpleSearch();
                //AAAA
                search_quick_go.focus();
            }
        });
        that._on( that.search_assistant.find(".sa_negate2"), {
            change: function(event){
                this.calcShowSimpleSearch();
            }
        });
        that._on( that.search_assistant.find(".sa_coord1"), {
            change: function(event){
                this.calcShowSimpleSearch();
            }
        });
        that._on( that.search_assistant.find(".sa_coord2"), {
            change: function(event){
                this.calcShowSimpleSearch();
            }
        });
        
        that._on( sortasc, {
            click: function(event){
                //window.hWin.HEURIST4.util.stopEvent(event);
                //sortasc.prop('checked', !sortasc.is(':checked'));
                this.calcShowSimpleSearch();
            }
        });

        select_rectype.trigger('change');

    }

    // recalculate search query value
    ,calcShowSimpleSearch: function (e) {

        
        
        var q = this.search_assistant.find(".sa_rectype").val(); if(q) q = "t:"+q;
        var fld = this.search_assistant.find(".sa_fieldtype").val(); 
        var ctn = '';
        
        if(fld=='latitude' || fld=='longitude'){
            var coord1 = this.search_assistant.find(".sa_coord1").val();
            var coord2 = this.search_assistant.find(".sa_coord2").val();
            
            var morethan = !isNaN(parseFloat(coord1));
            var lessthan = !isNaN(parseFloat(coord2));
            
            if(morethan && lessthan){
                fld = fld+':'+coord1+'<>'+coord2;
            }else if(morethan){
                fld = fld+'>'+coord1;
            }else if(lessthan){
                fld = fld+'<'+coord2;
            }else{
                fld = '';
            }
        }else{
            
            var isEnum = false;//this.search_assistant.find(".fld_enum").is(':visible');
            
            if(fld){
                var detailtypes = window.hWin.HEURIST4.detailtypes.typedefs;
                var detailType = '';

                if(Number(fld)>0){
                    var detailType = detailtypes[fld].commonFields[detailtypes.fieldNamesToIndex['dty_Type']];
                    isEnum = (detailType=='enum'  || detailType=='relationtype');
                }
                
                fld = "f:"+fld+":";  
            } 
            
            if(isEnum){
                var termid = this.search_assistant.find(".sa_termvalue").val();
                if(termid=='any' || termid=='blank'){
                    ctn = ''; 
                }else{
                    ctn = termid;
                }
                if(termid=='blank' || this.search_assistant.find(".sa_negate2").is(':checked')){
                    fld  = '-'+fld;
                }
                
            }else{
                ctn =  this.search_assistant.find(".sa_fieldvalue").val();
                if(this.search_assistant.find(".sa_negate").is(':checked')){
                    fld  = '-'+fld;
                }
            }
        }

        var asc = (this.search_assistant.find(".sa_sortasc").val()==1?"-":'') ; //($("#sa_sortasc:checked").length > 0 ? "" : "-");
        var srt = this.search_assistant.find(".sa_sortby").val();
        srt = (srt == "t" && asc == "" ? "" : ("sortby:" + asc + (isNaN(srt)?"":"f:") + srt));

        q = (q? (fld?q+" ": q ):"") + (fld?fld: (ctn?" all:":"")) + (ctn?(isNaN(Number(ctn))?'"'+ctn+'"':ctn):"") + (srt? " " + srt : "");
        if(!q){
            q = "sortby:t";
        }
        this.input_search.val(q);
        this.input_search.change();
        
        this.input_search_prompt2.css({width:(this.input_search.width()-30),
                                height:(this.input_search.height()-10)}).show();

        e = window.hWin.HEURIST4.util.stopEvent(e);
    }

    // events bound via _on are removed automatically
    // revert other modifications here
    ,_destroy: function() {

        $(window.hWin.document).off(window.hWin.HAPI4.Event.ON_CREDENTIALS
          +' '+window.hWin.HAPI4.Event.ON_PREFERENCES_CHANGE);
        $(this.document).off(window.hWin.HAPI4.Event.ON_REC_SEARCHSTART
          + ' ' + window.hWin.HAPI4.Event.ON_REC_SEARCH_FINISH
          + ' ' + window.hWin.HAPI4.Event.ON_REC_UPDATE
          + ' ' + window.hWin.HAPI4.Event.ON_STRUCTURE_CHANGE);

        // remove generated elements
        //this.btn_search_allonly.remove();  // bookamrks search off
        this.btn_search_as_guest.remove(); // bookamrks search on
        this.btn_search_as_user.remove();  // bookamrks search on
        this.btn_search_domain.remove();
        if(this.search_assistant){
            if(this.search_assistant_popup!=null && this.search_assistant_popup.dialog('instance')){
                this.search_assistant_popup.dialog('close');
                this.search_assistant_popup = null;
            }
            this.search_assistant.remove();
            this.search_assistant = null;
        }
        this.menu_search_domain.remove();
        this.input_search.remove();
        this.input_search_prompt.remove();

        this.div_search_as_user.remove();
        this.div_search_as_guest.remove();

        if(this.div_paginator) this.div_paginator.remove();
        
        if(this.filter_by_entity) this.filter_by_entity.remove();
        if(this.select_rectype_filter) {
            if(this.select_rectype_filter.hSelect("instance")!=undefined){
               this.select_rectype_filter.hSelect("destroy"); 
            }
            this.select_rectype_filter.remove();   
        }

        this.div_search.remove();
    }


    , _doLogin: function(){

        if(typeof doLogin !== "undefined" && $.isFunction(doLogin)){  // already loaded in index.php
            doLogin(false, function(is_logged){
                
                if(is_logged){
                    
                    //@todo move to some widget in ON_CREDENTIALS listener
                    var lt = window.hWin.HAPI4.sysinfo['layout']; 
                    if(!(lt=='DigitalHarlem' || lt=='DigitalHarlem1935' || lt=='WebSearch')){
                    
                        var init_search = window.hWin.HAPI4.get_prefs('defaultSearch');
                        if(!window.hWin.HEURIST4.util.isempty(init_search)){
                            var request = {q: init_search, w: 'a', f: 'map', source:'init' };
                            setTimeout(function(){
                                window.hWin.HAPI4.SearchMgr.doSearch(window.hWin.document, request);
                            }, 3000);
                        }
                        if(window.hWin.HAPI4.sysinfo.db_has_active_dashboard>0) {
                           //show dashboard
                           var prefs = window.hWin.HAPI4.get_prefs_def('prefs_sysDashboard', {showonstartup:1});
                           if(prefs.showonstartup==1)
                                    window.hWin.HEURIST4.ui.showEntityDialog('sysDashboard');
                        }
                        
                    }
                    
                }else{
                    window.hWin.location  = window.HAPI4.baseURL;
                }
                
            });
        }else{
            //var that = this;
            $.getScript(window.hWin.HAPI4.baseURL+'hclient/widgets/profile/profile_login.js', this._doLogin );
        }


    }

    , _doRegister: function(){

        if(false && !$.isFunction(doLogin)){  // already loaded in index.php
            //var that = this;
            $.getScript(window.hWin.HAPI4.baseURL+'hclient/widgets/profile/profile_login.js', this._doRegister );
        }else{
            doRegister();
        }

        /*
        if($.isFunction($('body').profile_edit)){

        if(!this.div_profile_edit || this.div_profile_edit.is(':empty') ){
        this.div_profile_edit = $('<div>').appendTo( this.element );
        }
        this.div_profile_edit.profile_edit({'ugr_ID': window.hWin.HAPI4.currentUser.ugr_ID});

        }else{
        var that = this;
        $.getScript(window.hWin.HAPI4.baseURL+'hclient/widgets/profile/profile_edit.js', function() {
        if($.isFunction($('body').profile_edit)){
        that._doRegister();
        }else{
        window.hWin.HEURIST4.msg.showMsgErr('Widget profile edit not loaded!');
        }
        });
        }
        */

    }

});

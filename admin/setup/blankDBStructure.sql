 -- populateBlankDB.sql: SQL file to create Heurist structures in a blank MySQL database
 -- @author Ian Johnson 11/1/2011
 -- @copyright 2005-2010 University of Sydney Digital Innovation Unit.
 -- @link: http://HeuristScholar.org
 -- @license http://www.gnu.org/licenses/gpl-3.0.txt
 -- @package Heurist academic knowledge management system
 -- @todo

\W -- warnings to standard out, OK for cammand line but not for phpMyAdmin

-- --------------------------------------------------------

-- TO DO: After creating the structure from this file we need to:
--
--        1. create referential constraints with AddReferentialConstraints.sql
--        2. add stored procedures from AddProceduresTriggers.sql
--        3. import core content (minimal database definitions) from
--           admin/setup/coreDefinitions.txt

-- The next section of this file is a PHPMyAdmin dump of H3 database structure
-- DO NOT include referential integrity or triggers/procedures

-- ***************************************************************************

--    *  createDefinitionTablesOnly.sql must be updated at the same time
--    *  if there is any change of structure

--   * THE INSERTION STATEMENTS AT THE END ARE * NOT * PART OF THE DUMP
--   * DO NOT DELETE THEM

-- ***************************************************************************

-- phpMyAdmin SQL Dump
-- version 2.9.0.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Sep 19, 2011 at 07:55 PM
-- Server version: 5.0.51
-- PHP Version: 5.2.3
--
-- Database: 'hdb_H3CoreDefinitions'
--

-- --------------------------------------------------------

--
-- Table structure for table 'Records'
--

CREATE TABLE Records (
  rec_ID int(10) unsigned NOT NULL auto_increment COMMENT 'The primary record ID, also called, historically, bib_id',
  rec_URL varchar(2000) default NULL COMMENT 'The primary URL pointed to by this record (particularly for Internet bookmarks)',
  rec_Added datetime NOT NULL default '0000-00-00 00:00:00' COMMENT 'Date and time record added',
  rec_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date and time the record was modified',
  rec_Title varchar(1023) NOT NULL COMMENT 'Composite (constructed) title of the record, used for display and search',
  rec_ScratchPad text COMMENT 'Scratchpad, mainly for text captured with bookmarklet',
  rec_RecTypeID smallint(5) unsigned NOT NULL COMMENT 'Record type, foreign key to defRecTypes table',
  rec_AddedByUGrpID smallint(5) unsigned default NULL COMMENT 'ID of the user who created the record',
  rec_AddedByImport tinyint(1) unsigned NOT NULL default '0' COMMENT 'Whether added by an import (value 1) or by manual entry (value 0)',
  rec_Popularity int(10) unsigned NOT NULL default '0' COMMENT 'Calculated popularity rating for sorting order, set by cron job',
  rec_FlagTemporary tinyint(1) unsigned NOT NULL default '0' COMMENT 'Flags a partially created record before fully populated',
  rec_OwnerUGrpID smallint(5) unsigned NOT NULL default '0' COMMENT 'User group which owns this record, 0 = everyone',
  rec_NonOwnerVisibility enum('viewable','hidden','public','pending') NOT NULL default 'viewable' COMMENT 'Defines if record visible outside owning user group(s) or to anyone',
  rec_URLLastVerified datetime default NULL COMMENT 'Last date time when URL was verified as contactable',
  rec_URLErrorMessage varchar(255) default NULL COMMENT 'Error returned by URL checking script for bad/inaccessible URLs',
  rec_URLExtensionForMimeType varchar(10) default NULL COMMENT 'A mime type extension for multimedia files pointed to DIRECTLY by the record URL',
  rec_Hash varchar(60) default NULL COMMENT 'A composite truncated metaphones + numeric values hash of significant fields',
  PRIMARY KEY  (rec_ID),
  KEY rec_URL (rec_URL(63)),
  KEY rec_Title (rec_Title(63)),
  KEY rec_RecTypeID (rec_RecTypeID),
  KEY rec_Modified (rec_Modified),
  KEY rec_OwnerUGrpID (rec_OwnerUGrpID),
  KEY rec_Hash (rec_Hash(40)),
  KEY rec_AddedByUGrpID (rec_AddedByUGrpID)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table 'defCalcFunctions'
--

CREATE TABLE defCalcFunctions (
  cfn_ID smallint(3) unsigned NOT NULL auto_increment COMMENT 'Primary key of defCalcFunctions table',
  cfn_Domain enum('calcfieldstring','pluginphp') NOT NULL default 'calcfieldstring' COMMENT 'Domain of application of this function specification',
  cfn_FunctionSpecification text NOT NULL COMMENT 'A function or chain of functions, or some PHP plugin code',
  cfn_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (cfn_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Specifications for generating calculated fields, plugins and';

-- --------------------------------------------------------

--
-- Table structure for table 'defCrosswalk'
--

CREATE TABLE defCrosswalk (
  crw_ID mediumint(8) unsigned NOT NULL auto_increment COMMENT 'Primary key',
  crw_SourcedbID mediumint(8) unsigned NOT NULL COMMENT 'The Heurist reference ID of the database containing the definition being mapped',
  crw_SourceCode mediumint(8) unsigned NOT NULL COMMENT 'The code of the definition in the source database',
  crw_DefType enum('rectype','constraint','detailtype','recstructure','ontology','vocabulary','term') NOT NULL COMMENT 'The type of code being mapped between the source and this database',
  crw_LocalCode mediumint(8) unsigned NOT NULL COMMENT 'The corresponding code in the local database',
  crw_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'The date when this mapping added or modified',
  PRIMARY KEY  (crw_ID),
  UNIQUE KEY crw_composite (crw_SourcedbID,crw_DefType,crw_LocalCode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Map the codes used in this Heurist DB to codes used in other';

-- --------------------------------------------------------

--
-- Table structure for table 'defDetailTypeGroups'
--

CREATE TABLE defDetailTypeGroups (
  dtg_ID tinyint(3) unsigned NOT NULL auto_increment COMMENT 'Primary ID - Code for detail type groups',
  dtg_Name varchar(63) NOT NULL COMMENT 'Descriptive heading to be displayed for each group of details (fields)',
  dtg_Order tinyint(3) unsigned zerofill NOT NULL default '002' COMMENT 'Ordering of detail type groups within pulldown lists',
  dtg_Description varchar(255) NOT NULL COMMENT 'General description fo this group of detail (field) types',
  dtg_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (dtg_ID)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='Groups detail types for display in separate sections of edit';

-- --------------------------------------------------------

--
-- Table structure for table 'defDetailTypes'
--

CREATE TABLE defDetailTypes (
  dty_ID smallint(5) unsigned NOT NULL auto_increment COMMENT 'Code for the detail type (field) - may vary between Heurist DBs',
  dty_Name varchar(255) NOT NULL COMMENT 'The canonical (standard) name of the detail type, used as default in edit form',
  dty_Documentation varchar(5000) default 'Please document the nature of this detail type (field)) ...' COMMENT 'Documentation of the detail type, what it means, how defined',
  dty_Type enum('freetext','blocktext','integer','date','year','relmarker','boolean','enum','relationtype','resource','float','file','geo','separator','calculated','fieldsetmarker') NOT NULL COMMENT 'The value-type of this detail type, what sort of data is stored',
  dty_HelpText varchar(255) NOT NULL default 'Please provide a short explanation for the user ...' COMMENT 'The default help text displayed to the user under the field',
  dty_ExtendedDescription varchar(5000) default 'Please provide an extended description for display on rollover ...' COMMENT 'Extended text describing this detail type, for display in rollover',
  dty_Status enum('reserved','approved','pending','open') NOT NULL default 'open' COMMENT 'Reserved Heurist codes, approved/pending by ''Board'', and user additions',
  dty_OriginatingDBID mediumint(8) unsigned default NULL COMMENT 'Database where this detail type originated, 0 = locally',
  dty_NameInOriginatingDB varchar(255) default NULL COMMENT 'Name used in database where this detail type originated',
  dty_IDInOriginatingDB smallint(5) unsigned default NULL COMMENT 'ID used in database where this detail type originated',
  dty_DetailTypeGroupID tinyint(3) unsigned NOT NULL default '1' COMMENT 'The general role of this detail allowing differentiated lists of detail types',
  dty_OrderInGroup tinyint(3) unsigned default '0' COMMENT 'The display order of DetailType within group, alphabetic if equal values',
  dty_JsonTermIDTree varchar(5000) default NULL COMMENT 'Tree of Term IDs to show for this field (display-only header terms set in HeaderTermIDs)',
  dty_TermIDTreeNonSelectableIDs varchar(1000) default NULL COMMENT 'Term IDs to use as non-selectable headers for this field',
  dty_PtrTargetRectypeIDs varchar(63) default NULL COMMENT 'CSVlist of target Rectype IDs, null = any',
  dty_FieldSetRectypeID smallint(5) unsigned default NULL COMMENT 'For a FieldSetMarker, the record type to be inserted as a fieldset',
  dty_ShowInLists tinyint(1) unsigned NOT NULL default '1' COMMENT 'Flags if detail type is to be shown in end-user interface, 1=yes',
  dty_NonOwnerVisibility enum('hidden','viewable','public','pending') NOT NULL default 'viewable' COMMENT 'Allows restriction of visibility of a particular field in ALL record types (overrides rst_VisibleOutsideGroup)',
  dty_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (dty_ID),
  UNIQUE KEY dty_Name (dty_Name),
  KEY dty_Type (dty_Type),
  KEY dty_DetailTypeGroupID (dty_DetailTypeGroupID)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='The detail types (fields) which can be attached to records';

-- --------------------------------------------------------

--
-- Table structure for table 'defFileExtToMimetype'
--

CREATE TABLE defFileExtToMimetype (
  fxm_Extension varchar(10) NOT NULL COMMENT 'The file extension, indicates mimetype, icon and some beahviours',
  fxm_MimeType varchar(100) NOT NULL COMMENT 'The standard mime type string',
  fxm_OpenNewWindow tinyint(1) unsigned NOT NULL default '0' COMMENT 'Flag if a new window should be opened to display this mimetype',
  fxm_IconFileName varchar(31) default NULL COMMENT 'Filename of the icon file for this mimetype (shared by several)',
  fxm_FiletypeName varchar(31) default NULL COMMENT 'A textual name for the file type represented by the extension',
  fxm_ImagePlaceholder varchar(63) default NULL COMMENT 'Thumbnail size representation for display, generate from fxm_FiletypeName',
  fxm_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (fxm_Extension)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Converts extensions to mimetypes and provides icons and mime';

-- --------------------------------------------------------

--
-- Table structure for table 'defLanguages'
--

CREATE TABLE defLanguages (
  lng_NISOZ3953 char(3) NOT NULL COMMENT 'Three character NISO Z39.53 language code',
  lng_ISO639 char(2) NOT NULL COMMENT 'Two character ISO639 language code',
  lng_Name varchar(63) NOT NULL COMMENT 'Language name, generally accepted name (normally English terminology)',
  lng_Notes varchar(1000) default NULL COMMENT 'URL reference to, or notes on the definition of the language',
  lng_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (lng_NISOZ3953)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Language list including optional standard language codes';

-- --------------------------------------------------------

--
-- Table structure for table 'defOntologies'
--

CREATE TABLE defOntologies (
  ont_ID smallint(5) unsigned NOT NULL auto_increment COMMENT 'Ontology code, primary key',
  ont_ShortName varchar(63) NOT NULL COMMENT 'The commonly used acronym or short name of the ontology',
  ont_FullName varchar(255) NOT NULL COMMENT 'The commonly used full name of the ontology',
  ont_Description varchar(1000) default NULL COMMENT 'An optional descriptuion of the domain, origina and aims of the ontology',
  ont_RefURI varchar(250) default NULL COMMENT 'The URI to a definition of the ontology',
  ont_Status enum('reserved','approved','pending','open') NOT NULL default 'open' COMMENT 'Reserved Heurist codes, approved/pending by ''Board'', and user additions',
  ont_OriginatingDBID mediumint(8) unsigned default NULL COMMENT 'Database where this ontology originated, 0 = locally',
  ont_NameInOriginatingDB varchar(63) default NULL COMMENT 'Name used in database where this ontology originated',
  ont_IDInOriginatingDB smallint(5) unsigned default NULL COMMENT 'ID used in database where this ontology originated',
  ont_Order tinyint(3) unsigned zerofill NOT NULL default '255' COMMENT 'Ordering value to define alternate display order in interface',
  ont_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (ont_ID),
  UNIQUE KEY ont_ShortName (ont_ShortName)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='A table of references to different ontologies used by Heuris';

-- --------------------------------------------------------

--
-- Table structure for table 'defRecStructure'
--

CREATE TABLE defRecStructure (
  rst_ID smallint(5) unsigned NOT NULL auto_increment COMMENT 'Primary key for the record structures table',
  rst_RecTypeID smallint(5) unsigned NOT NULL COMMENT 'The record type to which this detail is allocated, 0 = all rectypes',
  rst_DetailTypeID smallint(5) unsigned NOT NULL COMMENT 'Detail type for this field or, if MSB set, FieldSet code + 32767',
  rst_DisplayName varchar(255) NOT NULL default 'Please enter a prompt ...' COMMENT 'Display name for this dtl type in this rectype, autofill with dty_Name',
  rst_DisplayHelpText varchar(255) default NULL COMMENT 'The user help text to be displayed for this detail type for this record type',
  rst_DisplayExtendedDescription varchar(5000) default NULL COMMENT 'The rollover text to be displayed for this detail type for this record type',
  rst_DisplayOrder smallint(3) unsigned zerofill NOT NULL default '999' COMMENT 'A sort order for display of this detail type in the record edit form',
  rst_DisplayWidth tinyint(3) unsigned NOT NULL default '50' COMMENT 'The field width displayed for this detail type in this record type',
  rst_DefaultValue varchar(63) default NULL COMMENT 'The default value for this detail type for this record type',
  rst_RecordMatchOrder tinyint(1) unsigned NOT NULL default '0' COMMENT 'Indicates order of significance in detecting duplicate records, 1 = highest',
  rst_CalcFunctionID tinyint(3) unsigned default NULL COMMENT 'FK to table of function specifications for calculating string values',
  rst_RequirementType enum('required','recommended','optional','forbidden') NOT NULL default 'optional',
  rst_NonOwnerVisibility enum('hidden','viewable','public','pending') NOT NULL default 'viewable' COMMENT 'Allows restriction of visibility of a particular field in a specified record type',
  rst_Status enum('reserved','approved','pending','open') NOT NULL default 'open' COMMENT 'Reserved Heurist codes, approved/pending by ''Board'', and user additions',
  rst_MayModify enum('locked','discouraged','open') NOT NULL default 'open' COMMENT 'Extent to which detail may be modified within this record structure',
  rst_OriginatingDBID mediumint(8) unsigned default NULL COMMENT 'Database where this record structure element originated, 0 = locally',
  rst_IDInOriginatingDB smallint(5) unsigned default NULL COMMENT 'ID used in database where this record structure element originated',
  rst_MaxValues tinyint(3) unsigned NOT NULL default '0' COMMENT 'Maximum number of values per record for this detail, 0 = unlimited',
  rst_MinValues tinyint(3) unsigned NOT NULL default '0' COMMENT 'If required, minimum number of values per record for this detail',
  rst_DisplayDetailTypeGroupID tinyint(3) unsigned default NULL COMMENT 'If set, places detail in specified group instead of according to dty_DetailTypeGroup',
  rst_FilteredJsonTermIDTree varchar(500) default NULL COMMENT 'JSON encoded tree of allowed terms, subset of those defined in defDetailType',
  rst_PtrFilteredIDs varchar(250) default NULL COMMENT 'Allowed Rectypes (CSV) within list defined by defDetailType (for pointer details)',
  rst_OrderForThumbnailGeneration tinyint(3) unsigned default NULL COMMENT 'Priority order of fields to use in generating thumbnail, null = do not use',
  rst_TermIDTreeNonSelectableIDs varchar(255) default NULL COMMENT 'Term IDs to use as non-selectable headers for this field',
  rst_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (rst_ID),
  UNIQUE KEY rst_composite (rst_RecTypeID,rst_DetailTypeID),
  KEY rst_DetailTypeID (rst_DetailTypeID)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='The record details (fields) required for each record type';

-- --------------------------------------------------------

--
-- Table structure for table 'defRecTypeGroups'
--

CREATE TABLE defRecTypeGroups (
  rtg_ID tinyint(3) unsigned NOT NULL auto_increment COMMENT 'Record type group ID referenced in defRectypes',
  rtg_Name varchar(40) NOT NULL COMMENT 'Name for this group of record types, shown as heading in lists',
  rtg_Domain enum('functionalgroup','modelview') NOT NULL default 'functionalgroup' COMMENT 'Functional group (rectype has only one) or a Model/View group',
  rtg_Order tinyint(3) unsigned zerofill NOT NULL default '002' COMMENT 'Ordering of record type groups within pulldown lists',
  rtg_Description varchar(250) default NULL COMMENT 'A description of the record type group and its purpose',
  rtg_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (rtg_ID),
  UNIQUE KEY rtg_Name (rtg_Name)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='Grouping mechanism for record types in pulldowns';

-- --------------------------------------------------------

--
-- Table structure for table 'defRecTypes'
--

CREATE TABLE defRecTypes (
  rty_ID smallint(5) unsigned NOT NULL auto_increment COMMENT 'Record type code, widely used to reference record types, primary key',
  rty_Name varchar(63) NOT NULL COMMENT 'The name which is used to describe this record (object) type',
  rty_OrderInGroup tinyint(3) unsigned default '0' COMMENT 'Ordering within record type display groups for pulldowns',
  rty_Description varchar(5000) NOT NULL COMMENT 'Description of this record type',
  rty_TitleMask varchar(500) NOT NULL default '[title]' COMMENT 'Mask to build a composite title by combining field values',
  rty_CanonicalTitleMask varchar(500) default '160' COMMENT 'Version of the mask converted to detail codes for processing',
  rty_Plural varchar(63) default NULL COMMENT 'Plural form of the record type name, manually entered',
  rty_Status enum('reserved','approved','pending','open') NOT NULL default 'open' COMMENT 'Reserved Heurist codes, approved/pending by ''Board'', and user additions',
  rty_OriginatingDBID mediumint(8) unsigned default NULL COMMENT 'Database where this record type originated, 0 = locally',
  rty_NameInOriginatingDB varchar(63) default NULL COMMENT 'Name used in database where this record type originated',
  rty_IDInOriginatingDB smallint(5) unsigned default NULL COMMENT 'ID in database where this record type originated',
  rty_NonOwnerVisibility enum('hidden','viewable','public','pending') NOT NULL default 'viewable' COMMENT 'Allows blanket restriction of visibility of a particular record type',
  rty_ShowInLists tinyint(1) unsigned NOT NULL default '1' COMMENT 'Flags if record type is to be shown in end-user interface, 1=yes',
  rty_RecTypeGroupID tinyint(3) unsigned NOT NULL default '1' COMMENT 'Record type group to which this record type belongs',
  rty_RecTypeModelIDs varchar(63) default NULL COMMENT 'The model group(s) to which this rectype belongs, comma sep. list',
  rty_FlagAsFieldset tinyint(1) unsigned NOT NULL default '0' COMMENT '0 = full record type, 1 = Fieldset = set of fields to include in other rectypes',
  rty_ReferenceURL varchar(250) default NULL COMMENT 'A reference URL describing/defining the record type',
  rty_AlternativeRecEditor varchar(63) default NULL COMMENT 'Name or URL of alternative record editor function to be used for this rectype',
  rty_Type enum('normal','relationship','dummy') NOT NULL default 'normal' COMMENT 'Use to flag special record types to trigger special functions',
  rty_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (rty_ID),
  UNIQUE KEY rty_Name (rty_Name),
  KEY rty_RecTypeGroupID (rty_RecTypeGroupID)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='Defines record types, which corresponds with a set of detail';

-- --------------------------------------------------------

--
-- Table structure for table 'defRelationshipConstraints'
--

CREATE TABLE defRelationshipConstraints (
  rcs_ID smallint(5) unsigned NOT NULL auto_increment COMMENT 'Record-detailtype constraint table primary key',
  rcs_SourceRectypeID smallint(5) unsigned default NULL COMMENT 'Source record type for this constraint, Null = all types',
  rcs_TargetRectypeID smallint(5) unsigned default NULL COMMENT 'Target record type pointed to by relationship record, Null = all types',
  rcs_Description varchar(1000) default 'Please describe ...',
  rcs_RelationshipsLimit tinyint(3) unsigned default NULL COMMENT 'Deprecated: Null= no limit; 0=forbidden, 1, 2 ... =max # of relationship records per record per detailtype/rectypes triplet',
  rcs_Status enum('reserved','approved','pending','open') NOT NULL default 'open' COMMENT 'Reserved Heurist codes, approved/pending by ''Board'', and user additions',
  rcs_OriginatingDBID mediumint(8) unsigned NOT NULL default '0' COMMENT 'Database where this constraint originated, 0 or local db code = locally',
  rcs_IDInOriginatingDB smallint(5) unsigned default '0' COMMENT 'Code used in database where this constraint originated',
  rcs_TermID int(10) unsigned default NULL COMMENT 'The ID of a term to be constrained, applies to descendants unless they have more specific',
  rcs_TermLimit tinyint(2) unsigned default NULL COMMENT 'Null=none 0=not allowed 1,2..=max # times a term from termSet ident. by termID can be used',
  rcs_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (rcs_ID),
  UNIQUE KEY rcs_CompositeKey (rcs_SourceRectypeID,rcs_TargetRectypeID,rcs_TermID),
  KEY rcs_TermID (rcs_TermID),
  KEY rcs_TargetRectypeID (rcs_TargetRectypeID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Constrain target-rectype/vocabularies/values for a pointer d';

-- --------------------------------------------------------

--
-- Table structure for table 'defTerms'
--

CREATE TABLE defTerms (
  trm_ID int(10) unsigned NOT NULL auto_increment COMMENT 'Primary key, the term code used in the detail record',
  trm_Label varchar(63) NOT NULL COMMENT 'Text label for the term, cannot be blank',
  trm_InverseTermId int(10) unsigned default NULL COMMENT 'ID for the inverse value (relationships), null if no inverse',
  trm_Description varchar(1000) default NULL COMMENT 'A description/gloss on the meaning of the term',
  trm_Status enum('reserved','approved','pending','open') NOT NULL default 'open' COMMENT 'Reserved Heurist codes, approved/pending by ''Board'', and user additions',
  trm_OriginatingDBID mediumint(8) unsigned default NULL COMMENT 'Database where this detail type originated, 0 = locally',
  trm_NameInOriginatingDB varchar(63) default NULL COMMENT 'Name (label) for this term in originating database',
  trm_IDInOriginatingDB mediumint(8) unsigned default NULL COMMENT 'ID used in database where this  term originated',
  trm_AddedByImport tinyint(1) unsigned NOT NULL default '0' COMMENT 'Set to 1 if term added by an import, otherwise 0',
  trm_IsLocalExtension tinyint(1) unsigned NOT NULL default '0' COMMENT 'Flag that this value not in the externally referenced vocabulary',
  trm_Domain enum('enum','relation') NOT NULL default 'enum' COMMENT 'Define the usage of the term',
  trm_OntID smallint(5) unsigned NOT NULL default '0' COMMENT 'Ontology from which this vocabulary originated, 0 = locally defined ontology',
  trm_ChildCount tinyint(3) NOT NULL default '0' COMMENT 'Stores the count of children, updated whenever children are added/removed',
  trm_ParentTermID int(10) unsigned default NULL COMMENT 'The ID of the parent/owner term in the hierarchy',
  trm_Depth tinyint(1) unsigned NOT NULL default '1' COMMENT 'Depth of term in the term tree, should always be 1+parent depth',
  trm_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (trm_ID),
  KEY trm_ParentTermIDKey (trm_ParentTermID),
  KEY trm_InverseTermIDKey (trm_InverseTermId)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='Terms by detail type and the vocabulary they belong to';

-- --------------------------------------------------------

--
-- Table structure for table 'defTranslations'
--

CREATE TABLE defTranslations (
  trn_ID int(10) unsigned NOT NULL auto_increment COMMENT 'Primary key of defTranslations table',
  trn_Source enum('rty_Name','dty_Name','ont_ShortName','vcb_Name','trm_Label','rst_DisplayName','rtg_Name','dtl_Value') NOT NULL COMMENT 'The table/column to be translated (unique names identify source)',
  trn_Code smallint(5) unsigned NOT NULL COMMENT 'The primary key / ID in the table containing the text to be translated',
  trn_LanguageCode3 char(3) NOT NULL COMMENT 'The translation language code (NISO 3 character) for this record',
  trn_Translation varchar(63) NOT NULL COMMENT 'The translation of the text in this location (table/field/id)',
  trn_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (trn_ID),
  UNIQUE KEY trn_composite (trn_Source,trn_Code,trn_LanguageCode3),
  KEY trn_LanguageCode3 (trn_LanguageCode3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Translation table into multiple languages for all translatab';

-- --------------------------------------------------------

--
-- Table structure for table 'defURLPrefixes'
--

CREATE TABLE defURLPrefixes (
  urp_ID smallint(5) unsigned NOT NULL auto_increment COMMENT 'ID which will be stored as proxy for the URL prefix',
  urp_Prefix varchar(250) NOT NULL COMMENT 'URL prefix which is prepended to record URLs',
  urp_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (urp_ID),
  UNIQUE KEY urp_Prefix (urp_Prefix)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Common URL prefixes allowing single-point change of URL for ';

-- --------------------------------------------------------

--
-- Table structure for table 'recDetails'
--

CREATE TABLE recDetails (
  dtl_ID int(10) unsigned NOT NULL auto_increment COMMENT 'Primary key for record detail (field) values table',
  dtl_RecID int(10) unsigned NOT NULL COMMENT 'The record to which this detail (field) applies',
  dtl_DetailTypeID smallint(5) unsigned NOT NULL COMMENT 'The detail type code identifying the type definition of data',
  dtl_Value text COMMENT 'The value of the detail as text (used for all except files and geometry)',
  dtl_AddedByImport tinyint(1) unsigned NOT NULL default '0' COMMENT 'Set 1 if added by an import, set 0 if added by user during data entry',
  dtl_UploadedFileID mediumint(8) unsigned default NULL COMMENT 'The numeric code = filename of an uploaded file ',
  dtl_Geo geometry default NULL COMMENT 'A geometry (spatial) object',
  dtl_ValShortened varchar(31) NOT NULL COMMENT 'Truncated version of the textual value without spaces',
  dtl_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record detail, used to get last updated date for table',
  PRIMARY KEY  (dtl_ID),
  KEY dtl_DetailtypeIDkey (dtl_DetailTypeID),
  KEY dtl_RecIDKey (dtl_RecID),
  KEY dtl_ValShortenedKey (dtl_ValShortened),
  KEY dtl_ValueKey (dtl_Value(63)),
  KEY dtl_UploadedFileIDKey (dtl_UploadedFileID)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='The detail (field) values for each record - public data';

-- --------------------------------------------------------

--
-- Table structure for table 'recForwarding'
--

CREATE TABLE recForwarding (
  rfw_OldRecID int(10) unsigned NOT NULL COMMENT 'The deleted record which will be redirected to another',
  rfw_NewRecID int(10) unsigned NOT NULL COMMENT 'The new record to which this ID will be forwarded',
  PRIMARY KEY  (rfw_OldRecID),
  KEY rfw_NewRecID (rfw_NewRecID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Allows referer routine to redirect certain calls to a replac';

-- --------------------------------------------------------

--
-- Table structure for table 'recRelationshipsCache'
--

CREATE TABLE recRelationshipsCache (
  rrc_RecID int(10) unsigned NOT NULL COMMENT 'Record ID of a relationships record linking source and target records',
  rrc_SourceRecID int(10) unsigned NOT NULL COMMENT 'Pointer to source record for this relationship',
  rrc_TargetRecID int(10) unsigned NOT NULL COMMENT 'Pointer to target record for this relationship',
  PRIMARY KEY  (rrc_RecID),
  KEY rrc_sourcePtrKey (rrc_SourceRecID),
  KEY rrc_TargetPtrKey (rrc_TargetRecID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='A cache for record relationship pointers to speed access';

-- --------------------------------------------------------

--
-- Table structure for table 'recSimilarButNotDupes'
--

CREATE TABLE recSimilarButNotDupes (
  snd_SimRecsList varchar(16000) NOT NULL COMMENT 'A comma separated list of record IDs which are similar but not identical',
  KEY snd_SimRecsList (snd_SimRecsList(13))
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Used in dedupe. Sets of IDs which are not dupes. Index is of';

-- --------------------------------------------------------

--
-- Table structure for table 'recThreadedComments'
--

CREATE TABLE recThreadedComments (
  cmt_ID int(10) unsigned NOT NULL auto_increment COMMENT 'Comment ID, primary key for comments',
  cmt_Text varchar(5000) NOT NULL COMMENT 'Text of comment',
  cmt_OwnerUgrpID smallint(5) unsigned NOT NULL COMMENT 'User ID of user making comment',
  cmt_Added datetime NOT NULL default '0000-00-00 00:00:00' COMMENT 'Date and time of creation of comment',
  cmt_ParentCmtID int(10) unsigned default NULL COMMENT 'Parent comment of this comment',
  cmt_Deleted tinyint(1) unsigned NOT NULL default '0' COMMENT 'Flag deleted comments',
  cmt_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date and time of modification of comment',
  cmt_RecID int(10) unsigned NOT NULL COMMENT 'Record ID to which this comment applies, required',
  PRIMARY KEY  (cmt_ID),
  KEY cmt_OwnerUgrpID (cmt_OwnerUgrpID),
  KEY cmt_ParentCmtID (cmt_ParentCmtID),
  KEY cmt_RecID (cmt_RecID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Threaded comments for each record';

-- --------------------------------------------------------

--
-- Table structure for table 'recUploadedFiles'
--

CREATE TABLE recUploadedFiles (
  ulf_ID mediumint(8) unsigned NOT NULL auto_increment COMMENT 'A unique numeric file ID used as filename to store the data on disk and should be different ids if shared',
  ulf_OrigFileName varchar(255) NOT NULL COMMENT 'The original name of the file uploaded',
  ulf_UploaderUGrpID smallint(5) unsigned default NULL COMMENT 'The user who uploaded the file',
  ulf_Added datetime NOT NULL default '0000-00-00 00:00:00' COMMENT 'The date and time the file was uploaded',
  ulf_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'The date of last modification of the file description record, automatic update',
  ulf_ObfuscatedFileID varchar(40) default NULL COMMENT 'SHA-1 hash of ulf_ID and random number to block sequential file harvesting',
  ulf_ExternalFileReference varchar(1000) default NULL COMMENT 'URI of an external file, which may or may not be cached locally',
  ulf_PreferredSource enum('local','external') NOT NULL default 'local' COMMENT 'Preferred source of file if both local file and external reference set',
  ulf_Thumbnail blob COMMENT 'Cached autogenerated thumbnail for common image formats',
  ulf_Description text COMMENT 'A user-entered textual description of the file or image contents',
  ulf_MimeExt varchar(10) default NULL COMMENT 'Extension of the file, used to look up in mimetype table',
  ulf_AddedByImport tinyint(1) unsigned NOT NULL default '0' COMMENT 'Flag whether added by import = 1 or manual editing = 0',
  ulf_FileSizeKB int(10) unsigned default NULL COMMENT 'File size in Kbytes calculated at upload',
  PRIMARY KEY  (ulf_ID),
  KEY ulf_ObfuscatedFileIDKey (ulf_ObfuscatedFileID),
  KEY ulf_Description (ulf_Description(100)),
  KEY ulf_UploaderUGrpID (ulf_UploaderUGrpID),
  KEY ulf_MimeExt (ulf_MimeExt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Index to uploaded files linked from records';

-- --------------------------------------------------------

--
-- Table structure for table 'sysArchive'
--

CREATE TABLE sysArchive (
  arc_ID int(10) unsigned NOT NULL auto_increment COMMENT 'Primary key of archive table',
  arc_Table enum('rec','cfn','crw','dtg','dty','fxm','ont','rst','rtg','rty','rcs','trm','trn','urp','vcb','dtl','rfw','rrc','snd','cmt','ulf','sys','lck','tlu','ugr','ugl','bkm','hyf','rtl','rre','rem','rbl','svs','tag','wprm','chunk','wrprm','woot') NOT NULL COMMENT 'Identification of the MySQL table in which a record is being modified',
  arc_PriKey int(10) unsigned NOT NULL COMMENT 'Primary key of the MySQL record in the table being modified',
  arc_ChangedByUGrpID smallint(5) unsigned NOT NULL COMMENT 'User who is logged in and modifying this data',
  arc_OwnerUGrpID smallint(5) unsigned default NULL COMMENT 'Owner of the data being modified (if applicable eg. records, bookmarks, tags)',
  arc_RecID int(10) unsigned default NULL COMMENT 'Heurist record id (if applicable, eg. for records, bookmarks, tag links)',
  arc_TimeOfChange timestamp NOT NULL default CURRENT_TIMESTAMP COMMENT 'Timestamp of the modification',
  arc_DataBeforeChange blob COMMENT 'A representation of the data in the MySQL record before the mod, may be a diff',
  arc_ContentType enum('del','raw','zraw','diff','zdiff') NOT NULL default 'raw' COMMENT 'Format of the data stored, del=deleted, raw=text dump, Diff=delta, Z=zipped indicates ',
  PRIMARY KEY  (arc_ID),
  KEY arc_Table (arc_Table,arc_ChangedByUGrpID,arc_OwnerUGrpID,arc_RecID,arc_TimeOfChange)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='An archive of all (or most) changes in the database to allow';

-- --------------------------------------------------------

--
-- Table structure for table 'sysDBNameCache'
--

CREATE TABLE sysDBNameCache (
  dnc_ID int(10) unsigned NOT NULL COMMENT 'Heurist DB ID for a registered Heurist database',
  dnc_dbName varchar(63) NOT NULL COMMENT 'Name of the database (from sys_DBName or Heurist index database)',
  dnc_TimeStamp timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date when name of database last read from Heurist index or the database',
  dnc_URL varchar(128) default NULL COMMENT 'Root path to this installation and database',
  PRIMARY KEY  (dnc_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Local db name cache for display of origin and source DBs in ';

-- --------------------------------------------------------

--
-- Table structure for table 'sysDocumentation'
--

CREATE TABLE sysDocumentation (
  doc_id tinyint(3) unsigned NOT NULL auto_increment,
  doc_text text COMMENT 'Relevant documentation as text',
  PRIMARY KEY  (doc_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Descriptive infORmation about this database and its function';

-- --------------------------------------------------------

--
-- Table structure for table 'sysIdentification'
--

CREATE TABLE sysIdentification (
  sys_ID tinyint(1) unsigned NOT NULL default '1' COMMENT 'Only 1 record should exist in this table',
  sys_dbRegisteredID int(10) unsigned NOT NULL default '0' COMMENT 'Allocated by HeuristScholar.org, 0 indicates not yet registered',
  sys_dbVersion tinyint(3) unsigned NOT NULL default '0' COMMENT 'Major version for the database structure',
  sys_dbSubVersion tinyint(3) unsigned NOT NULL default '0' COMMENT 'Sub version',
  sys_dbSubSubVersion tinyint(3) unsigned NOT NULL default '0' COMMENT 'Sub-sub version',
  sys_eMailImapServer varchar(100) default NULL COMMENT 'Email server intermediary for record creation via email',
  sys_eMailImapPort varchar(5) default NULL COMMENT 'port for imap email server',
  sys_eMailImapProtocol varchar(5) default NULL COMMENT 'protocol for imap email server',
  sys_eMailImapUsername varchar(50) default NULL COMMENT 'user name for imap email server',
  sys_eMailImapPassword varchar(40) default NULL COMMENT 'password for imap email server',
  sys_IncomingEmailAddresses varchar(4000) default NULL COMMENT 'Comma-sep list of incoming email addresses for archiving emails visible to all admins',
  sys_TargetEmailAddresses varchar(255) default NULL COMMENT 'Comma-sep list for selecting target for sending records as data, see also ugr_TargetEmailAddresses',
  sys_UGrpsDatabase varchar(63) default NULL COMMENT 'Full name of SQL database containing user tables, null = use internal users/groups tables',
  sys_OwnerGroupID smallint(5) unsigned NOT NULL default '1' COMMENT 'User group which owns/administers this database, 1 by default',
  sys_dbName varchar(63) NOT NULL default 'Please enter a DB name ...' COMMENT 'A short descriptive display name for this database, distinct from the name in the URL',
  sys_dbOwner varchar(250) default NULL COMMENT 'Information on the owner of the database, may be a URL reference',
  sys_dbRights varchar(1000) NOT NULL default 'Please define ownership and rights here ...' COMMENT 'A statement of ownership and copyright for this database and content',
  sys_dbDescription varchar(1000) default NULL COMMENT 'A longer description of the content of this database',
  sys_SyncDefsWithDB varchar(63) default NULL COMMENT 'The name of the SQL database with which local definitions are to be synchronised',
  sys_AutoIncludeFieldSetIDs varchar(63) default '0' COMMENT 'CSV list of fieldsets which are included in all rectypes',
  sys_RestrictAccessToOwnerGroup tinyint(1) unsigned NOT NULL default '0' COMMENT 'If set, database may only be accessed by members of owners group',
  sys_URLCheckFlag tinyint(1) unsigned NOT NULL default '0' COMMENT 'Flags whether system should send out requests to URLs to test for validity',
  sys_UploadDirectory varchar(128) default NULL COMMENT 'Absolute directory path for uploaded files (blank = use default from installation)',
  sys_hmlOutputDirectory varchar(255) default NULL COMMENT 'Directory in which to write hml representation of published records, default to hml within upload directory',
  sys_htmlOutputDirectory varchar(255) default NULL COMMENT 'Directory in which to write html representation of published records, default to html within upload directory',
  sys_NewRecOwnerGrpID smallint(5) unsigned NOT NULL default '0' COMMENT 'Group which by default owns new records, 0=everyone. Allow override per user',
  sys_NewRecAccess enum('viewable','hidden','public','pending') NOT NULL default 'viewable' COMMENT 'Default visibility for new records - allow override per user',
  sys_SetPublicToPendingOnEdit tinyint(1) unsigned NOT NULL default '0' COMMENT '0=immediate publish when ''public'' record edited, 1 = reset to ''pending''',
  sys_ConstraintDefaultBehavior enum('locktypetotype','unconstrainedbydefault','allownullwildcards') NOT NULL default 'locktypetotype' COMMENT 'Determines default behaviour when no detail types are specified',
  sys_AllowRegistration tinyint(1) unsigned NOT NULL default '0' COMMENT 'If set, people can apply for registration through web-based form',
  sys_MediaFolders varchar(10000) default NULL COMMENT 'Additional comma-sep directories which can contain files indexed in database',
  PRIMARY KEY  (sys_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Identification/version for this Heurist database (single rec';

-- --------------------------------------------------------

--
-- Table structure for table 'sysLocks'
--

CREATE TABLE sysLocks (
  lck_Action enum('buildcrosswalks','editdefinitions','errorscan','buildtempdb') NOT NULL COMMENT 'Type of action being carried out',
  lck_UGrpID smallint(5) unsigned NOT NULL COMMENT 'Set to user ID to lock specified function',
  lck_Modified timestamp NOT NULL default CURRENT_TIMESTAMP COMMENT 'Date and time when the action was commenced, use to drop old locks',
  PRIMARY KEY  (lck_Action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Provides token system for selected administrative actions';

-- --------------------------------------------------------

--
-- Table structure for table 'sysTableLastUpdated'
--

CREATE TABLE sysTableLastUpdated (
  tlu_TableName varchar(40) NOT NULL COMMENT 'Name of table for which we are recording time of last update',
  tlu_DateStamp datetime NOT NULL default '0000-00-00 00:00:00' COMMENT 'Date and time of last update of table',
  tlu_CommonObj tinyint(1) unsigned NOT NULL default '1' COMMENT 'Indicates tables which contain data defs required in common-obj',
  PRIMARY KEY  (tlu_TableName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Datestamp, determines if updates since definitions loaded in';

-- --------------------------------------------------------

--
-- Table structure for table 'sysUGrps'
--

CREATE TABLE sysUGrps (
  ugr_ID smallint(5) unsigned NOT NULL auto_increment COMMENT 'User or group ID, used wherever a user or group is to be identified',
  ugr_Type enum('user','workgroup','ugradclass') NOT NULL default 'user' COMMENT 'User or workgroup, special workgroup types also supported',
  ugr_Name varchar(63) NOT NULL COMMENT 'The unique user/login/group name, user name defaults to email address',
  ugr_LongName varchar(128) default NULL COMMENT 'An optional longer descriptive name for a user group',
  ugr_Description varchar(1000) default NULL COMMENT 'Extended description of a user group displayed on homepage',
  ugr_Password varchar(40) NOT NULL COMMENT 'Encrypted password string',
  ugr_eMail varchar(100) NOT NULL COMMENT 'Contact email address of the user/group',
  ugr_FirstName varchar(40) default NULL COMMENT 'Person''s first name, only for Users, not Workgroups',
  ugr_LastName varchar(63) default NULL COMMENT 'Person''s last name, only for Users, not Workgroups',
  ugr_Department varchar(120) default NULL,
  ugr_Organisation varchar(120) default NULL,
  ugr_City varchar(63) default NULL,
  ugr_State varchar(40) default NULL,
  ugr_Postcode varchar(20) default NULL,
  ugr_Interests varchar(255) default NULL COMMENT 'List of research interests, only for Users, not Workgroups',
  ugr_Enabled enum('y','n') NOT NULL default 'y' COMMENT 'Flags if user can use Heurist, normally needs authorising by admin',
  ugr_LastLoginTime datetime default NULL COMMENT 'Date and time of last login (but user may stay logged in)',
  ugr_MinHyperlinkWords tinyint(3) unsigned NOT NULL default '3' COMMENT 'Filter hyperlink strings with less than this word count on hyperlink import ',
  ugr_LoginCount int(10) unsigned NOT NULL default '0' COMMENT 'Number of times user haslogged in',
  ugr_IsModelUser tinyint(1) unsigned NOT NULL default '0' COMMENT '1 indicates model user = domain profile',
  ugr_IncomingEmailAddresses varchar(4000) default NULL COMMENT 'Comma-sep list of incoming email addresses from which to archive emails',
  ugr_TargetEmailAddresses varchar(255) default NULL COMMENT 'Comma-sep list for selecting target for sending records as data, see also sys_TargetEmailAddresses',
  ugr_URLs varchar(2000) default NULL COMMENT 'URL(s) of group or personal website(s), comma separated',
  ugr_FlagJT int(1) unsigned NOT NULL default '0' COMMENT 'Flag to enable in Jobtrack/Worktrack application',
  ugr_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date of last modification of this record, used to get last updated date for table',
  PRIMARY KEY  (ugr_ID),
  UNIQUE KEY ugr_Name (ugr_Name),
  UNIQUE KEY ugr_eMail (ugr_eMail)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='Users/Groups diff. by ugr_Type. May defer to similar table i';

-- --------------------------------------------------------

--
-- Table structure for table 'sysUsrGrpLinks'
--

CREATE TABLE sysUsrGrpLinks (
  ugl_ID mediumint(8) unsigned NOT NULL auto_increment COMMENT 'Primary key for user-to-group membership',
  ugl_UserID smallint(5) unsigned NOT NULL COMMENT 'The user being assigned to a group',
  ugl_GroupID smallint(5) unsigned NOT NULL COMMENT 'The group to which this user is being assigned',
  ugl_Role enum('admin','member') NOT NULL default 'member' COMMENT 'The role of this user in the group - member, admin',
  PRIMARY KEY  (ugl_ID),
  UNIQUE KEY ugl_CompositeKey (ugl_UserID,ugl_GroupID),
  KEY ugl_GroupID (ugl_GroupID)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='Identifies groups to which a user belongs and their role in ';

-- --------------------------------------------------------

--
-- Table structure for table 'usrBookmarks'
--

CREATE TABLE usrBookmarks (
  bkm_ID int(10) unsigned NOT NULL auto_increment COMMENT 'Primary key, ID for bookmarks',
  bkm_Added datetime NOT NULL COMMENT 'Date and time of addition of bookmark',
  bkm_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date and time of modification',
  bkm_UGrpID smallint(5) unsigned NOT NULL COMMENT 'Owner of the bookmark - all bookmarks must be owned',
  bkm_PwdReminder varchar(250) default NULL COMMENT 'Password reminder field or short notes about access',
  bkm_RecID int(10) unsigned NOT NULL COMMENT 'The record to which this bookmark applies, must be set',
  bkm_Rating tinyint(3) unsigned NOT NULL default '0' COMMENT 'Five point rating for interest/quality/content',
  bkm_AddedByImport tinyint(1) unsigned NOT NULL default '0' COMMENT 'Set to 1 if bookmark added by import, 0 if added by data entry',
  bkm_ZoteroID int(10) unsigned default NULL COMMENT 'Records your Zotero ID for this record for synchronisation with Zotero',
  PRIMARY KEY  (bkm_ID),
  UNIQUE KEY bkm_RecID (bkm_RecID,bkm_UGrpID),
  KEY bkm_UGrpID (bkm_UGrpID),
  KEY bkm_Modified (bkm_Modified)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='Bookmark = personal data relating to a record, one for each ';

-- --------------------------------------------------------

--
-- Table structure for table 'usrHyperlinkFilters'
--

CREATE TABLE usrHyperlinkFilters (
  hyf_String varchar(63) NOT NULL COMMENT 'Hyperlink string to be ignored when encountered in hyperlink import',
  hyf_UGrpID smallint(5) unsigned NOT NULL COMMENT 'User for which this string is to be ignored',
  UNIQUE KEY hyf_CompositeKey (hyf_String,hyf_UGrpID),
  KEY hyf_UGrpID (hyf_UGrpID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Configure hyperlink import to ignore common link strings';

-- --------------------------------------------------------

--
-- Table structure for table 'usrRecTagLinks'
--

CREATE TABLE usrRecTagLinks (
  rtl_ID int(10) unsigned NOT NULL auto_increment COMMENT 'Primary link table key, one tag linked to one record',
  rtl_TagID mediumint(8) unsigned NOT NULL COMMENT 'The tag being linked to the record/bookmark',
  rtl_Order tinyint(3) unsigned zerofill NOT NULL default '255' COMMENT 'Ordering of tags within the current record/bookmark',
  rtl_AddedByImport tinyint(1) unsigned NOT NULL default '0' COMMENT '0 indicates added while editing, 1 indicates added during import',
  rtl_RecID int(10) unsigned NOT NULL COMMENT 'The record to which the tag is linked, should always be set',
  PRIMARY KEY  (rtl_ID),
  UNIQUE KEY rtl_composite_key (rtl_RecID,rtl_TagID),
  KEY rtl_TagIDKey (rtl_TagID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Link table connecting tags to records';

-- --------------------------------------------------------

--
-- Table structure for table 'usrRecentRecords'
--

CREATE TABLE usrRecentRecords (
  rre_UGrpID smallint(5) unsigned NOT NULL COMMENT 'ID of user who used the record',
  rre_RecID int(10) unsigned NOT NULL COMMENT 'ID of recently used record',
  rre_Time timestamp NOT NULL default CURRENT_TIMESTAMP COMMENT 'Timestamp of use of records, notably those searched for with pointer field',
  UNIQUE KEY rre_composite (rre_UGrpID,rre_RecID),
  KEY rre_RecID (rre_RecID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table 'usrReminders'
--

CREATE TABLE usrReminders (
  rem_ID mediumint(8) unsigned NOT NULL auto_increment COMMENT 'Unique reminder ID',
  rem_RecID int(10) unsigned NOT NULL COMMENT 'Record about which this reminder is sent, must refer to existing',
  rem_OwnerUGrpID smallint(5) unsigned NOT NULL COMMENT 'Owner of the reminder, the person who created it',
  rem_ToWorkgroupID smallint(5) unsigned default NULL COMMENT 'The workgroup to which the reminder should be sent',
  rem_ToUserID smallint(5) unsigned default NULL COMMENT 'The individual user to whom the reminder should be sent',
  rem_ToEmail varchar(255) default NULL COMMENT 'The individual email address(es) to which the reminder should be sent',
  rem_Message varchar(1000) default NULL COMMENT 'The message to be attached to the reminder, optional',
  rem_StartDate date NOT NULL default '1970-01-01' COMMENT 'The first (or only) date for sending the reminder',
  rem_Freq enum('once','daily','weekly','monthly','annually') NOT NULL default 'once' COMMENT 'The frequency of sending reminders',
  rem_Nonce varchar(31) default NULL COMMENT 'Random number hash for reminders',
  rem_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT ' ugr_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT ''Date of last modification of this record, used to get last updated date for table'',',
  PRIMARY KEY  (rem_ID),
  KEY rem_RecID (rem_RecID),
  KEY rem_OwnerUGrpID (rem_OwnerUGrpID),
  KEY rem_ToWorkgroupID (rem_ToWorkgroupID),
  KEY rem_ToUserID (rem_ToUserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Reminders attached to records and recipients, with start dat';

-- --------------------------------------------------------

--
-- Table structure for table 'usrRemindersBlockList'
--

CREATE TABLE usrRemindersBlockList (
  rbl_RemID mediumint(8) unsigned NOT NULL COMMENT 'Reminder ID to be blocked',
  rbl_UGrpID smallint(5) unsigned NOT NULL COMMENT 'User who does not wish to receive this reminder',
  UNIQUE KEY rbl_composite_key (rbl_RemID,rbl_UGrpID),
  KEY rbl_UGrpID (rbl_UGrpID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Allows user to block resending of specific reminders to them';

-- --------------------------------------------------------

--
-- Table structure for table 'usrSavedSearches'
--

CREATE TABLE usrSavedSearches (
  svs_ID mediumint(8) unsigned NOT NULL auto_increment COMMENT 'Saved search ID, used in publishing, primary key',
  svs_Name varchar(30) NOT NULL COMMENT 'The display name for this saved search',
  svs_Added date NOT NULL default '0000-00-00' COMMENT 'Date and time saves search added',
  svs_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date and time saves search last modified',
  svs_Query text NOT NULL COMMENT 'The text of the saved search - added to search URL',
  svs_UGrpID smallint(5) unsigned NOT NULL COMMENT 'The creator/owner or workgroup for the saved search',
  svs_ExclusiveXSL varchar(250) default '' COMMENT 'Name of XSL to which to lock this publish format, blank = any XSL OK',
  PRIMARY KEY  (svs_ID),
  KEY svs_UGrpID (svs_UGrpID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Saved searches for personal/usergroup use and for publishing';

-- --------------------------------------------------------

--
-- Table structure for table 'usrTags'
--

CREATE TABLE usrTags (
  tag_ID mediumint(8) unsigned NOT NULL auto_increment,
  tag_UGrpID smallint(5) unsigned NOT NULL COMMENT 'User or workgroup id of tag owner',
  tag_Text varchar(63) NOT NULL COMMENT 'The value (text) of the tag provided by the user or workgroup administrator',
  tag_Description varchar(250) default NULL COMMENT 'Description of the concept to which this tag is attached, optional',
  tag_AddedByImport tinyint(1) unsigned NOT NULL default '0' COMMENT 'Flag as to whether this tag was added by an import (1) or by editing (0)',
  tag_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT ' ugr_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT ''Date of last modification of this record, used to get last updated date for table'',',
  PRIMARY KEY  (tag_ID),
  UNIQUE KEY tag_composite_key (tag_Text,tag_UGrpID),
  KEY tag_UGrpID (tag_UGrpID),
  KEY tag_Text (tag_Text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Personal and user group tags (formerly keywords)';

-- --------------------------------------------------------

--
-- Table structure for table 'woot_ChunkPermissions'
--

CREATE TABLE woot_ChunkPermissions (
  wprm_ChunkID int(11) NOT NULL COMMENT 'ID of chunk for which permission is specified, may be repeated',
  wprm_UGrpID smallint(6) NOT NULL COMMENT 'User with specified right to this chunk',
  wprm_GroupID smallint(6) NOT NULL COMMENT 'User groups with specified right to this chunk',
  wprm_Type enum('RW','RO') NOT NULL COMMENT 'Read-write or read-only permission for this chunk/user/wg',
  wprm_CreatorID smallint(6) NOT NULL COMMENT 'Creator of the permission (= user ID ???? <check>)',
  wprm_Created datetime NOT NULL COMMENT 'Date and time of creation of the permission',
  UNIQUE KEY wprm_chunk_composite_key (wprm_ChunkID,wprm_UGrpID,wprm_GroupID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Permissions value for individual woot chunks';

-- --------------------------------------------------------

--
-- Table structure for table 'woot_Chunks'
--

CREATE TABLE woot_Chunks (
  chunk_ID int(11) NOT NULL auto_increment COMMENT 'Primary ID for a version of the text chunks making up a woot entry (page)',
  chunk_WootID int(11) NOT NULL COMMENT 'The ID of the woot entry (page) to which this chunk belongs',
  chunk_InsertOrder int(11) NOT NULL COMMENT 'Order of chunk within woot.',
  chunk_Version int(11) NOT NULL COMMENT 'A version code for the chunk, incremented when edited',
  chunk_IsLatest tinyint(1) NOT NULL COMMENT 'Presumably flags whether this is the latest version of the chunk',
  chunk_DisplayOrder int(11) NOT NULL COMMENT 'The order number of the chunk within the woot entry (page)',
  chunk_Text text COMMENT 'The actual XHTML content of the chunk',
  chunk_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date and time of modification of the chunk',
  chunk_OwnerID int(11) default NULL COMMENT 'Owner/creator (user ID) of the chunk',
  chunk_Deleted tinyint(1) NOT NULL COMMENT 'Deletion marker for this chunk',
  chunk_EditorID int(11) NOT NULL COMMENT 'Editor (user ID) of the chunk - presumably the last person to edit',
  PRIMARY KEY  (chunk_ID),
  UNIQUE KEY chunk_composite_key (chunk_WootID,chunk_InsertOrder,chunk_Version),
  KEY chunk_is_latest_key (chunk_IsLatest)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table 'woot_RecPermissions'
--

CREATE TABLE woot_RecPermissions (
  wrprm_WootID int(11) NOT NULL COMMENT 'ID of the woot entry to which this permission applies, may be repeated',
  wrprm_UGrpID int(11) NOT NULL COMMENT 'User ID to which this permission is being granted',
  wrprm_GroupID int(11) NOT NULL COMMENT 'User group ID to which this permission is being granted',
  wrprm_Type enum('RW','RO') NOT NULL COMMENT 'Type of permission being granted - read only or read-write',
  wrprm_CreatorID int(11) NOT NULL COMMENT 'Creator of the permission',
  wrprm_Created datetime NOT NULL COMMENT 'Date and time of creation of the permission',
  UNIQUE KEY wrprm_composite_key (wrprm_WootID,wrprm_UGrpID,wrprm_GroupID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Overall permissions for the woot record (entry/page)';

-- --------------------------------------------------------

--
-- Table structure for table 'woots'
--

CREATE TABLE woots (
  woot_ID int(11) NOT NULL auto_increment COMMENT 'Primary ID of a woot record/entry/page',
  woot_Title varchar(8191) default NULL COMMENT 'Name of the woot page, unique identifier of the woot page',
  woot_Created datetime default NULL COMMENT 'Date and time of creation of the woot record/entry/page',
  woot_Modified timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP COMMENT 'Date and time of modification of the woot record/entry/page',
  woot_Version int(11) NOT NULL COMMENT 'Version of the woot record/entry/page, presumably incremented on edit',
  woot_CreatorID int(11) default NULL COMMENT 'Creator (user id) of the woot',
  PRIMARY KEY  (woot_ID),
  UNIQUE KEY woot_title_key (woot_Title(200))
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Woot records (entries, pages) are linked to a set of XHTML c';



-- ------------------------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------------------------

-- STANDARD DATA FOR A NEW DATABASE
-- This is run BEFORE triggers and referential constraints

-- *** Update the following INSERT statement if database version # is changed

-- Insert a single row in sysIdentification table = the DB identification record
 DELETE FROM sysIdentification where sys_ID=1;
 INSERT INTO sysIdentification(sys_ID,sys_dbRegisteredID,sys_dbVersion,sys_dbSubVersion,
  sys_dbSubSubVersion,sys_eMailImapServer,sys_eMailImapPort,
  sys_eMailImapProtocol,sys_eMailImapUsername,sys_eMailImapPassword,
  sys_UGrpsdatabase,sys_OwnerGroupID)
  VALUES (1,0,1,0,0,NULL,NULL,NULL,NULL,NULL,NULL,1);
  -- 0 is everyone, 1 is the owning admins group, 2 is default dbAdmin user

-- These are critical to the working of the definitions caching system, without these
-- the system will not 'see' stuff which is addded to the definitions''
INSERT INTO `sysTableLastUpdated` VALUES ('defCalcFunctions', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defCrosswalk', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defDetailTypeGroups', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defDetailTypes', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defFileExtToMimetype', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defLanguages', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defOntologies', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defRecStructure', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defRecTypeGroups', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defRecTypes', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defRelationshipConstraints', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defTerms', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defTranslations', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('defURLPrefixes', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('sysDBNameCache', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('sysIdentification', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('sysUGrps', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('sysUsrGrpLinks', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('usrHyperlinkFilters', '0000-00-00 00:00:00', 1);
INSERT INTO `sysTableLastUpdated` VALUES ('usrTags', '0000-00-00 00:00:00', 1);


INSERT INTO sysUGrps (ugr_ID,ugr_Name,ugr_LongName,ugr_Type,ugr_Password,ugr_eMail,ugr_Enabled,ugr_FirstName,ugr_LastName)
 VALUES (1,'Database owners',
 'Group 1 owns databases by default. DO NOT DELETE.',
 'Workgroup','PASSWORD NOT REQUIRED','EMAIL NOT SET FOR ID=1','y','db','owners');
 -- Note: ugr_id=1 is set as the database owner group in the sysidentification table

 -- This user (#2) is replaced with the user who created the database
 INSERT INTO sysUGrps (ugr_ID,ugr_Name,ugr_LongName,ugr_Type,ugr_Password,ugr_eMail,ugr_Enabled,ugr_FirstName,ugr_LastName)
 VALUES (2,'dbAdmin','User 2 is default administrator for databases. DO NOT DELETE',
 'User','cfefBRSMX8ggU','EMAIL NOT SET FOR ID=2','y','sys','admin');  -- password is 'none'
  -- Note: ugr_id=2 is set as the database admin in the sysUsrGrpLinks table
  -- there can be multipl admins for a database

INSERT INTO sysUGrps (ugr_ID,ugr_Name,ugr_LongName,ugr_Type,ugr_Password,ugr_eMail,ugr_Enabled,ugr_FirstName,ugr_LastName)
 VALUES (3,'Everyone',
 'Group 0 represents all logged in users. DO NOT DELETE.',
 'Workgroup','PASSWORD NOT REQUIRED','EMAIL NOT SET FOR ID=0','y','every','user');
 -- Note: ugr_id=0 is set as the default new rec owner in the sysidentification table, this entry is require to constraint
 UPDATE sysUGrps set ugr_ID = 0 where ugr_ID = 3; -- cannot insert 0 straight up, it gets appended

-- Insert a row to define the link between group 1 (dbowners) and user 2 (the first admin)
INSERT IGNORE INTO sysUsrGrpLinks (ugl_UserID,ugl_GroupID,ugl_Role) VALUES (2,1,'admin');


-- defRectypegroups and defDetailtypeGroups are now inserted by coreDefinitions.txt

INSERT INTO defLanguages (lng_NISOZ3953, lng_ISO639, lng_Name, lng_Notes)
VALUES
('ARA', 'AR', 'Arabic', NULL),
('CAM', 'KM', 'Khmer', NULL),
('CHI', 'ZH', 'Chinese', NULL),
('CZE', 'CS', 'Czech', NULL),
('DAN', 'DA', 'Danish', NULL),
('DUT', 'NL', 'Dutch', NULL),
('ENG', 'EN', 'English', NULL),
('EST', 'ET', 'Estonian', NULL),
('FIN', 'FI', 'Finish', NULL),
('FRE', 'FR', 'French', NULL),
('GER', 'DE', 'German', NULL),
('GRE', 'EL', 'Greek', NULL),
('HEB', 'HE', 'Hebrew', NULL),
('HIN', 'HI', 'Hindi', NULL),
('HUN', 'HU', 'Hungarian', NULL),
('IND', 'ID', 'Indonesian', NULL),
('ITA', 'IT', 'Italian', NULL),
('JPN', 'JA', 'Japanese', NULL),
('KOR', 'KO', 'Korean', NULL),
('LAV', 'LV', 'Latvian', NULL),
('MAL', 'MS', 'Malay', NULL),
('NOR', 'NO', 'Norwegian', NULL),
('POL', 'PL', 'Polish', NULL),
('POR', 'PT', 'Portuguese', NULL),
('RUS', 'RU', 'Russian', NULL),
('SCC', 'HR', 'Croatian', NULL),
('SCR', 'SR', 'Serbian', NULL),
('SLO', 'SK', 'Slovak', NULL),
('SPA', 'ES', 'Spanish', NULL),
('SWA', 'SW', 'Swahili', NULL),
('SWE', 'SV', 'Swedish', NULL),
('THA', 'TH', 'Thai', NULL),
('TUR', 'TR', 'Turkish', NULL),
('UKR', 'UK', 'Ukranian', NULL),
('VIE', 'VI', 'Vietnamese', NULL),
('YID', 'YI', 'Yiddish', NULL);

-- Note: language terms removed because of duplicate key error because they occur in the core definitions
-- auto increment values for tables also removed because the concept code system takes care of core
-- definitions. defOntologies and FileExtToMimetype table now populated by coreDefinitions.txt

-- ------------------------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------------------------

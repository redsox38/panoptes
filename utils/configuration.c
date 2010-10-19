#include "config.h"
#include <stdio.h>
#ifdef HAVE_LIBXML_PARSER_H
#include <libxml/parser.h>
#include <libxml/tree.h>
#endif
#include <string.h>

xmlDoc  *doc = NULL;
xmlNode *root_element = NULL;

/*
  prune empty nodes from xml tree
  for easier parsing later 
*/

int do_remove_empty(xmlNode* node) {
  xmlNode* n;
  int i, is_empty, len;
  xmlChar* val;

  for(n = node; n; n = n->next) {
    if(n->type == XML_TEXT_NODE) {
      val = xmlNodeGetContent(n);
      len = strlen((const char*)val);

      is_empty = 1;
      for(i = 0; i < len; i++) {
	if(!isspace(val[i])) {
	  is_empty = 0;
	}
      }
      xmlFree(val);

      if(is_empty) {
	xmlUnlinkNode(n);
	xmlFreeNode(n);
	return 1;
      }
    }
  }

  for(n = node; n; n = n->next) {
    if(n->type == XML_ELEMENT_NODE) {
      do {
      }while(do_remove_empty(n->children));
    }
  }

  return 0;
}

void remove_empty(xmlNode* node) {
  int s;

  do {
    s = do_remove_empty(node);
  } while(s);
}

/* 
   function to be called when 
   discover service is shut down 
*/

void config_term_handler()
{
  if (doc) {
    /* free the document */
    xmlFreeDoc(doc);

    /* free global variables allocated by the parser */
    xmlCleanupParser();
  }
}

/*
  load xml confguration file into memory
*/
int load_config(char *file)
{ 
  doc = xmlReadFile(file, NULL, 0);
  
  if (doc == NULL) {
    fprintf(stderr, "error: could not parse file %s\n", file);
    return (-1);
  } else {    
    /*
     * Get the root element node
     */
    root_element = xmlDocGetRootElement(doc);
    remove_empty(root_element); 
  }

  return (0);
} 

char *get_config_value_from_node(xmlNode *node, char *param) {

  xmlNode* n;
  int i;
  xmlAttr* attr;
  xmlChar* ac;
  xmlChar* val;
  char     *t, *p = strdup(param);
  char     *r = NULL;

  for(n = node; n; n = n->next) {
    if(n->type == XML_ELEMENT_NODE) {
      if (!strncmp(n->name, p, strcspn(p, "."))) {
	attr = n->properties;
	t = index(p, '.');
	*t++;
	while(attr) {
	  if (!strcmp(attr->name, t)) {
	    ac = xmlGetProp(n, attr->name);
	    r = strdup((char *)ac);
	    xmlFree(ac);
	  }
	  attr = attr->next;
	}
      }
    }
  }

  free(p);
  return(r);
}

/* 
   retrieve node value
   i.e. <db name="foo"/>
   would be retrieved by passing db.foo as param
*/
char *get_config_value(char *param) {
  xmlNode* n;
  char *p;

  n = root_element;
  while (n != NULL) {
    p = get_config_value_from_node(n, param);
    if (p == NULL)
      n = n->children;
    else
      n = NULL;
  }

  return(p);
}

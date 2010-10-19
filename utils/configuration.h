#ifndef _CONFIGURATION_H
#define _CONFIGURATION_H

#include <stdio.h>
#include <string.h>

#define CONFIG_FILE "config.xml"

int load_config(char *);
char *get_config_value(char *);

#endif

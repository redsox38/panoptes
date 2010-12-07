/*
 *
 * Copyright (C) 2010 Todd Merritt <redsox38@gmail.com>
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU General Public License as published by
 *    the Free Software Foundation, either version 3 of the License, or
 *    (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU General Public License for more details.
 *
 *    You should have received a copy of the GNU General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

#include "config.h"
#include <stdio.h>
#include <string.h>
#include "panoptes/monitor_core.h"

int get_status_code(char *status_string)
{
  int rc = -1;

  if (!strcmp(status_string, "ok")) {
    rc = MONITOR_RESULT_OK;
  } else if (!strcmp(status_string, "warn")) {
    rc = MONITOR_RESULT_WARN;
  } else if (!strcmp(status_string, "new")) {
    rc = MONITOR_RESULT_NEW;
  } else if (!strcmp(status_string, "pending")) {
    rc = MONITOR_RESULT_PENDING;
  } else if (!strcmp(status_string, "critical")) {
    rc = MONITOR_RESULT_ERR;
  }
    
  return(rc);
}
